package com.tcs.medverse.service;

import com.tcs.medverse.dto.request.LearnerChangePasswordRequest;
import com.tcs.medverse.dto.request.LearnerForgotPasswordRequest;
import com.tcs.medverse.dto.request.LearnerLoginRequest;
import com.tcs.medverse.dto.request.LearnerRegisterRequest;
import com.tcs.medverse.dto.request.LearnerResetPasswordRequest;
import com.tcs.medverse.dto.request.LoginRequest;
import com.tcs.medverse.dto.response.LearnerLoginResponse;
import com.tcs.medverse.dto.response.LearnerProfileResponse;
import com.tcs.medverse.dto.response.LoginResponse;
import com.tcs.medverse.entity.LearnerEntity;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.exception.BadRequestException;
import com.tcs.medverse.exception.ConflictException;
import com.tcs.medverse.exception.NotFoundException;
import com.tcs.medverse.repository.LearnerRepository;
import com.tcs.medverse.repository.SignupRepository;
import com.tcs.medverse.security.AuthCookieService;
import com.tcs.medverse.security.JwtService;
import com.tcs.medverse.util.OtpService;
import com.tcs.medverse.util.UserIdGenerator;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LearnerAuthServiceImpl implements LearnerAuthService {

    private final SignupRepository signupRepository;
    private final LearnerRepository learnerRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginService loginService;
    private final DeviceService deviceService;
    private final AuthCookieService authCookieService;
    private final OtpService otpService;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final UserIdGenerator userIdGenerator;

    @Override
    public LearnerProfileResponse register(LearnerRegisterRequest request) {
        if (signupRepository.existsByEmailAndRole(request.email(), Role.LEARNER)) {
            throw new ConflictException("Email already registered");
        }

        Signup signup = new Signup();
        signup.setAuthRefId("AUTH_" + UUID.randomUUID());
        signup.setUserId(generateUniqueLearnerId());
        signup.setEmail(request.email());
        signup.setName(request.name());
        signup.setPassword(passwordEncoder.encode(request.password()));
        signup.setAuthStatus(AuthStatus.APPROVED);
        signup.setRole(Role.LEARNER);
        signup.setActive(true);
        signupRepository.save(signup);

        LearnerEntity learner = learnerRepository.findByEmail(request.email()).orElseGet(LearnerEntity::new);
        learner.setLearnerId(learner.getLearnerId() == null ? signup.getUserId() : learner.getLearnerId());
        learner.setEmail(request.email());
        learner.setName(request.name());
        learner.setInstitution(request.institution());
        learner.setCreatedDate(learner.getCreatedDate() == null ? LocalDateTime.now() : learner.getCreatedDate());
        learnerRepository.save(learner);

        return new LearnerProfileResponse(
                learner.getLearnerId(),
                learner.getName(),
                learner.getEmail(),
                learner.getInstitution(),
                learner.getDepartment(),
                "Medical Student",
                learner.getCreatedDate() == null ? null : learner.getCreatedDate().toLocalDate().toString(),
                learner.getProfileImage()
        );
    }

    @Override
    public LearnerLoginResponse login(LearnerLoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        if (request.userId() == null || request.userId().isBlank()) {
            throw new BadRequestException("Learner ID is required");
        }
        Signup signup = signupRepository.findByUserId(request.userId())
                .filter(user -> user.getRole() == Role.LEARNER)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        LoginResponse lr = loginService.login(new LoginRequest(
                signup.getUserId(),
                request.password(),
                request.deviceId(),
                request.deviceType(),
                request.deviceModel(),
                request.osVersion(),
                request.appVersion()
        ));

        if (!"SUCCESS".equals(lr.status())) {
            throw new BadRequestException("Login failed: " + lr.status());
        }

        authCookieService.setAuthCookies(httpResponse, lr.authToken(), lr.refreshToken(), lr.deviceRefId(), isSecureRequest(httpRequest));

        LearnerEntity learner = learnerRepository.findById(signup.getUserId())
                .orElseThrow(() -> new NotFoundException("Learner profile not found"));

        return new LearnerLoginResponse(
                lr.authToken(),
                "Bearer",
                lr.deviceRefId(),
                learner.getLearnerId(),
                learner.getName(),
                lr.role().name()
        );
    }

    @Override
    public void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String deviceRefId = getCookieValue(httpRequest, AuthCookieService.DEVICE_ID_COOKIE);
        String authRefId = null;

        String accessToken = getCookieValue(httpRequest, AuthCookieService.ACCESS_TOKEN_COOKIE);
        if (accessToken != null && !accessToken.isBlank() && jwtService.validate(accessToken)) {
            Claims claims = jwtService.parseClaims(accessToken);
            authRefId = claims.getSubject();
            if (deviceRefId == null || deviceRefId.isBlank()) {
                deviceRefId = claims.get("deviceId", String.class);
            }
        }

        if (deviceRefId != null && !deviceRefId.isBlank()) {
            deviceService.deleteDeviceByRefId(deviceRefId);
        }
        loginService.revokeSession(authRefId, deviceRefId);
        authCookieService.clearAuthCookies(httpResponse, isSecureRequest(httpRequest));
    }

    @Override
    public void forgotPassword(LearnerForgotPasswordRequest request) {
        Signup signup = signupRepository.findByEmailAndRole(request.email(), Role.LEARNER)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        String resetToken = "RESET_" + UUID.randomUUID();
        otpService.storeOtp(resetToken, signup.getAuthRefId());
        emailService.sendOtp(request.email(), resetToken);
    }

    @Override
    public void resetPassword(LearnerResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        String authRefId = otpService.getOtp(request.resetToken());
        if (authRefId == null) {
            throw new BadRequestException("Invalid or expired reset token");
        }
        otpService.deleteOtp(request.resetToken());

        Signup signup = signupRepository.findByAuthRefId(authRefId)
                .orElseThrow(() -> new NotFoundException("Account not found"));
        signup.setPassword(passwordEncoder.encode(request.newPassword()));
        signupRepository.save(signup);
    }

    @Override
    public void changePassword(String authRefId, LearnerChangePasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        Signup signup = signupRepository.findByAuthRefId(authRefId)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        if (!passwordEncoder.matches(request.currentPassword(), signup.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        signup.setPassword(passwordEncoder.encode(request.newPassword()));
        signupRepository.save(signup);
    }

    private String generateUniqueLearnerId() {
        String userId;
        do {
            userId = userIdGenerator.generate(Role.LEARNER);
        } while (signupRepository.existsByUserId(userId));
        return userId;
    }

    private static boolean isSecureRequest(HttpServletRequest request) {
        if (request == null) return false;
        String proto = request.getHeader("X-Forwarded-Proto");
        return "https".equalsIgnoreCase(proto) || request.isSecure();
    }

    private static String getCookieValue(HttpServletRequest request, String name) {
        if (request == null) return null;
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
