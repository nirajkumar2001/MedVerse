package com.tcs.medverse.service;

import com.tcs.medverse.dto.request.SignUpInitRequest;
import com.tcs.medverse.dto.request.OtpVerifyRequest;
import com.tcs.medverse.dto.request.RejectedProfileResubmitRequest;
import com.tcs.medverse.dto.response.OtpResponse;
import com.tcs.medverse.dto.response.SignupResponse;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.entity.ProfileManage;
import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.repository.ProfileManageRepository;
import com.tcs.medverse.repository.SignupRepository;
import com.tcs.medverse.util.AppUtils;
import com.tcs.medverse.util.OtpService;
import com.tcs.medverse.util.UserIdGenerator;
import com.tcs.medverse.util.RateLimiterService;
import com.tcs.medverse.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class SignUpService {

    private static final Duration OTP_RESEND_COOLDOWN = Duration.ofSeconds(15);
    private static final Duration OTP_RESEND_BUFFER = Duration.ofMinutes(10);
    private static final int MAX_OTP_RESENDS = 3;

    private final SignupRepository signupRepository;
    private final PasswordEncoder encoder;
    private final RateLimiterService rateLimiter;
    private final UserIdGenerator userIdGenerator;
    private final OtpService otpService;
    private final EmailService emailService;
    private final OtpRealtimeService otpRealtimeService;
    private final ProfileManageRepository profileManageRepository;
    private final Map<String, PendingSignup> pendingSignups = new ConcurrentHashMap<>();

    public OtpResponse initiate(SignUpInitRequest r) {

        if (r.role() == Role.ADMIN) {
            throw new BadRequestException("Admin users cannot be created through public signup");
        }

        if (signupRepository.existsByEmailAndRole(r.email(), r.role())) {
            throw new BadRequestException("This email is already registered for the selected role. Please use a different email or select a different role.");
        }

        rateLimiter.checkRequestLimit("SIGNUP:" + r.email());

        String otpRefId = r.otpRefId() != null && !r.otpRefId().isBlank()
                ? r.otpRefId()
                : "SIGNUP_" + UUID.randomUUID();
        String otp = AppUtils.generate6DigitOtp();
        Instant now = Instant.now();

        pendingSignups.put(otpRefId, new PendingSignup(
                r.name(),
                r.email(),
                r.password(),
                r.role(),
                r.documentName(),
                r.documentContentType(),
                r.documentData(),
                now,
                0,
                null
        ));
        otpService.storeOtp(otpRefId, otp);
        emailService.sendOtp(r.email(), otp);
        otpRealtimeService.publishOtp(otpRefId, otp);

        return new OtpResponse(otpRefId, otp);
    }

    public OtpResponse resendSignupOtp(String otpRefId) {
        if (otpRefId == null || otpRefId.isBlank()) {
            throw new BadRequestException("otpRefId is required");
        }

        PendingSignup pending = pendingSignups.get(otpRefId);
        if (pending == null) {
            throw new BadRequestException("Signup request expired or invalid");
        }

        pending = validateAndUpdateResendState(otpRefId, pending);
        rateLimiter.checkRequestLimit("SIGNUP_RESEND:" + otpRefId);

        String otp = AppUtils.generate6DigitOtp();
        otpService.storeOtp(otpRefId, otp);
        emailService.sendOtp(pending.email(), otp);
        otpRealtimeService.publishOtp(otpRefId, otp);

        return new OtpResponse(otpRefId, otp);
    }

    private PendingSignup validateAndUpdateResendState(String otpRefId, PendingSignup pending) {
        Instant now = Instant.now();

        if (pending.blockedUntil() != null && now.isBefore(pending.blockedUntil())) {
            throw new BadRequestException("You have reached the max OTP resend limit. Please try after some time.");
        }

        if (pending.lastOtpSentAt() != null && now.isBefore(pending.lastOtpSentAt().plus(OTP_RESEND_COOLDOWN))) {
            throw new BadRequestException("Please wait 15 seconds before requesting another OTP.");
        }

        int nextResendCount = pending.resendCount() + 1;
        if (nextResendCount > MAX_OTP_RESENDS) {
            PendingSignup blocked = pending.withBlockedUntil(now.plus(OTP_RESEND_BUFFER));
            pendingSignups.put(otpRefId, blocked);
            throw new BadRequestException("You have reached the max OTP resend limit. Please try after some time.");
        }

        PendingSignup updated = pending.withResendState(now, nextResendCount);
        pendingSignups.put(otpRefId, updated);
        return updated;
    }

    @Transactional
    public SignupResponse resubmitRejectedProfile(RejectedProfileResubmitRequest request) {
        Signup signup = signupRepository.findByUserId(request.userId())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        if (!encoder.matches(request.password(), signup.getPassword())) {
            throw new BadRequestException("Invalid credentials");
        }

        if (signup.getAuthStatus() == AuthStatus.SUSPENDED || !signup.isActive()) {
            throw new BadRequestException("Your account is disabled because of incorrect document verification.");
        }

        if (signup.getAuthStatus() != AuthStatus.REJECTED) {
            throw new BadRequestException("Only rejected profiles can be resubmitted");
        }

        ProfileManage profile = profileManageRepository.findById(signup.getUserId())
                .orElseGet(() -> {
                    ProfileManage created = new ProfileManage();
                    created.setUserId(signup.getUserId());
                    created.setSignupId(signup.getId());
                    created.setAuthRefId(signup.getAuthRefId());
                    created.setName(signup.getName());
                    created.setEmail(signup.getEmail());
                    created.setRole(signup.getRole());
                    return created;
                });

        signup.setAuthStatus(AuthStatus.PENDING);
        signup.setActive(true);
        signupRepository.save(signup);

        profile.setStatus(AuthStatus.PENDING);
        profile.setDocumentName(request.documentName());
        profile.setDocumentContentType(request.documentContentType());
        profile.setDocumentData(request.documentData());
        profile.setReviewRemark(null);
        profile.setReviewedAt(null);
        profile.setSubmittedAt(java.time.LocalDateTime.now());
        profileManageRepository.save(profile);

        return toResponse(signup);
    }

    @Transactional
    public SignupResponse verifySignupOtp(OtpVerifyRequest request) {
        rateLimiter.checkRequestLimit("SIGNUP_OTP:" + request.otpRefId());

        PendingSignup pending = pendingSignups.get(request.otpRefId());
        if (pending == null) {
            throw new BadRequestException("Signup request expired or invalid");
        }

        if (request.identifier() != null && !request.identifier().isBlank()
                && !pending.email().equalsIgnoreCase(request.identifier())) {
            throw new BadRequestException("OTP does not match this email");
        }

        String storedOtp = otpService.getOtp(request.otpRefId());
        if (storedOtp == null || !storedOtp.equals(request.otp())) {
            throw new BadRequestException("Invalid OTP");
        }

        if (signupRepository.existsByEmailAndRole(pending.email(), pending.role())) {
            throw new BadRequestException("This email is already registered for the selected role. Please use a different email or select a different role.");
        }

        Signup signup = new Signup();
        signup.setUserId(generateUniqueUserId(pending.role()));
        signup.setAuthRefId("AUTH_" + UUID.randomUUID());
        signup.setName(pending.name());
        signup.setEmail(pending.email());
        signup.setPassword(encoder.encode(pending.password()));
        signup.setRole(pending.role());
        signup.setAuthStatus(AuthStatus.PENDING);
        signup.setActive(true);

        Signup saved = signupRepository.save(signup);
        createProfileManage(saved, pending);
        otpService.deleteOtp(request.otpRefId());
        pendingSignups.remove(request.otpRefId());

        System.out.println("[SIGNUP_VERIFIED] email=" + saved.getEmail()
                + " role=" + saved.getRole()
                + " userId=" + saved.getUserId());

        return toResponse(saved);
    }

    private void createProfileManage(Signup signup, PendingSignup pending) {
        ProfileManage profile = new ProfileManage();
        profile.setUserId(signup.getUserId());
        profile.setSignupId(signup.getId());
        profile.setAuthRefId(signup.getAuthRefId());
        profile.setName(signup.getName());
        profile.setEmail(signup.getEmail());
        profile.setRole(signup.getRole());
        profile.setStatus(signup.getAuthStatus());
        profile.setDocumentName(pending.documentName());
        profile.setDocumentContentType(pending.documentContentType());
        profile.setDocumentData(pending.documentData());
        profileManageRepository.save(profile);
    }

    private String generateUniqueUserId(Role role) {
        String userId;
        do {
            userId = userIdGenerator.generate(role);
        } while (signupRepository.existsByUserId(userId));
        return userId;
    }

    private SignupResponse toResponse(Signup signup) {
        return new SignupResponse(
                signup.getId(),
                signup.getUserId(),
                signup.getAuthRefId(),
                signup.getName(),
                signup.getEmail(),
                signup.getRole(),
                signup.getAuthStatus(),
                signup.isActive()
        );
    }

    private record PendingSignup(
            String name,
            String email,
            String password,
            Role role,
            String documentName,
            String documentContentType,
            String documentData,
            Instant lastOtpSentAt,
            int resendCount,
            Instant blockedUntil
    ) {
        PendingSignup withResendState(Instant lastOtpSentAt, int resendCount) {
            return new PendingSignup(name, email, password, role, documentName, documentContentType, documentData, lastOtpSentAt, resendCount, null);
        }

        PendingSignup withBlockedUntil(Instant blockedUntil) {
            return new PendingSignup(name, email, password, role, documentName, documentContentType, documentData, lastOtpSentAt, resendCount, blockedUntil);
        }
    }
}
