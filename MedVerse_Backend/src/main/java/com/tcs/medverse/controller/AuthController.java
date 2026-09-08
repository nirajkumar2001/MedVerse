package com.tcs.medverse.controller;

import com.tcs.medverse.dto.request.LoginRequest;
import com.tcs.medverse.dto.request.LearnerChangePasswordRequest;
import com.tcs.medverse.dto.request.SignUpInitRequest;
import com.tcs.medverse.dto.request.RejectedProfileResubmitRequest;
import com.tcs.medverse.dto.request.OtpVerifyRequest;
import com.tcs.medverse.dto.request.UpdateEmailRequest;
import com.tcs.medverse.dto.request.EmailChangeVerifyRequest;
import com.tcs.medverse.dto.response.LoginResponse;
import com.tcs.medverse.dto.response.OtpResponse;
import com.tcs.medverse.dto.response.SignupResponse;
import com.tcs.medverse.dto.response.DeviceResponse;
import com.tcs.medverse.exception.BadRequestException;
import com.tcs.medverse.exception.UnauthorizedException;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.entity.Login;
import com.tcs.medverse.entity.ProfileManage;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.repository.DeviceInfoRepository;
import com.tcs.medverse.repository.LoginRepository;
import com.tcs.medverse.repository.ProfileManageRepository;
import com.tcs.medverse.repository.SignupRepository;
import com.tcs.medverse.security.AuthCookieService;
import com.tcs.medverse.security.JwtService;
import com.tcs.medverse.service.DeviceService;
import com.tcs.medverse.service.EmailService;
import com.tcs.medverse.service.LoginService;
import com.tcs.medverse.service.OtpRealtimeService;
import com.tcs.medverse.service.SignUpService;
import com.tcs.medverse.util.AppUtils;
import com.tcs.medverse.util.LoggingContext;
import com.tcs.medverse.util.OtpService;
import com.tcs.medverse.util.ResponseHandler;
import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Tag(name = "Authentication APIs", description = "Authentication related APIs")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Duration OTP_RESEND_COOLDOWN = Duration.ofSeconds(15);
    private static final Duration OTP_RESEND_BUFFER = Duration.ofMinutes(10);
    private static final int MAX_OTP_RESENDS = 5;

    private final SignUpService signupService;
    private final LoginService loginService;
    private final SignupRepository signupRepository;
    private final DeviceInfoRepository deviceRepo;
    private final LoginRepository loginRepository;
    private final ProfileManageRepository profileManageRepository;
    private final DeviceService deviceService;
    private final AuthCookieService authCookieService;
    private final JwtService jwtService;
    private final LoggingContext logging;
    private final OtpService otpService;
    private final OtpRealtimeService otpRealtimeService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final Map<String, PasswordResetSession> passwordResetRefs = new ConcurrentHashMap<>();
    private final Map<String, String> emailChangeRefs = new ConcurrentHashMap<>();

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignUpInitRequest request) {
        OtpResponse response = signupService.initiate(request);
        return ResponseHandler.created(response, "OTP sent successfully");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        SignupResponse response = signupService.verifySignupOtp(request);
        Signup signup = signupRepository.findByAuthRefId(response.authRefId()).orElse(null);
        recordAuthEvent(signup, null, "VERIFY_OTP_SUCCESS");
        return ResponseHandler.success(response, "OTP verified. User created and pending admin review.");
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> request) {
        String otpRefId = firstNonBlank(request, "otpRefId", "sessionId");
        OtpResponse response = signupService.resendSignupOtp(otpRefId);
        return ResponseHandler.success(response, "New OTP sent successfully");
    }

    @PostMapping("/rejected-profile/resubmit")
    public ResponseEntity<?> resubmitRejectedProfile(@Valid @RequestBody RejectedProfileResubmitRequest request) {
        SignupResponse response = signupService.resubmitRejectedProfile(request);
        return ResponseHandler.success(response, "Profile resubmitted for admin verification.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        LoginResponse response = loginService.login(request);
        if ("SUCCESS".equals(response.status())) {
            authCookieService.setAuthCookies(
                    httpResponse,
                    response.authToken(),
                    response.refreshToken(),
                    response.deviceRefId(),
                    isSecureRequest(httpRequest)
            );
        }
        return ResponseHandler.success(sanitize(response), "Login successful");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String refreshToken = getCookieValue(httpRequest, AuthCookieService.REFRESH_TOKEN_COOKIE);
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Session expired");
        }

        LoginResponse response = loginService.refreshToken(refreshToken);
        authCookieService.setAccessCookie(httpResponse, response.authToken(), isSecureRequest(httpRequest));
        if (response.deviceRefId() != null && !response.deviceRefId().isBlank()) {
            authCookieService.setDeviceCookie(httpResponse, response.deviceRefId(), isSecureRequest(httpRequest));
        }

        return ResponseHandler.success(sanitize(response), "Token refreshed successfully");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String identifier = firstNonBlank(request, "email", "identifier", "userId");
        if (identifier == null) {
            throw new BadRequestException("Email or User ID is required");
        }

        Signup signup = identifier.contains("@")
                ? signupRepository.findByEmail(identifier)
                .orElseThrow(() -> new BadRequestException("Account not found"))
                : signupRepository.findByUserId(identifier)
                .orElseThrow(() -> new BadRequestException("Account not found"));
        recordAuthEvent(signup, null, "PASSWORD_RESET_REQUESTED");

        String otpRefId = firstNonBlank(request, "otpRefId", "sessionId");
        if (otpRefId == null) {
            otpRefId = "RESET_" + java.util.UUID.randomUUID();
        }
        String otp = AppUtils.generate6DigitOtp();
        otpService.storeOtp(otpRefId, otp);
        passwordResetRefs.put(otpRefId, new PasswordResetSession(signup.getAuthRefId(), Instant.now(), 0, null));
        emailService.sendOtp(signup.getEmail(), otp);
        otpRealtimeService.publishOtp(otpRefId, otp);

        System.out.println("[PASSWORD_RESET_OTP] email=" + signup.getEmail()
                + " userId=" + signup.getUserId()
                + " otpRefId=" + otpRefId
                + " otp=" + otp);
        recordAuthEvent(signup, null, "FORGOT_PASSWORD_SUCCESS");

        return ResponseHandler.success(new OtpResponse(otpRefId), "Password reset OTP sent");
    }

    @PostMapping("/resend-password-reset-otp")
    public ResponseEntity<?> resendPasswordResetOtp(@RequestBody Map<String, String> request) {
        String otpRefId = firstNonBlank(request, "otpRefId", "sessionId");
        if (otpRefId == null) {
            throw new BadRequestException("otpRefId is required");
        }

        PasswordResetSession resetSession = passwordResetRefs.get(otpRefId);
        if (resetSession == null) {
            throw new BadRequestException("Password reset request expired or invalid");
        }

        resetSession = validateAndUpdatePasswordResetResendState(otpRefId, resetSession);
        Signup signup = signupRepository.findByAuthRefId(resetSession.authRefId())
                .orElseThrow(() -> new BadRequestException("Account not found"));

        String otp = AppUtils.generate6DigitOtp();
        otpService.storeOtp(otpRefId, otp);
        emailService.sendOtp(signup.getEmail(), otp);
        otpRealtimeService.publishOtp(otpRefId, otp);

        System.out.println("[PASSWORD_RESET_RESEND_OTP] email=" + signup.getEmail()
                + " userId=" + signup.getUserId()
                + " otpRefId=" + otpRefId
                + " otp=" + otp);

        return ResponseHandler.success(new OtpResponse(otpRefId), "New OTP sent successfully");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String otpRefId = firstNonBlank(request, "otpRefId", "resetToken");
        String otp = firstNonBlank(request, "otp", "resetOtp");
        String newPassword = firstNonBlank(request, "newPassword");
        String confirmPassword = firstNonBlank(request, "confirmPassword");

        if (otpRefId == null || otp == null || newPassword == null || confirmPassword == null) {
            throw new BadRequestException("otpRefId, otp, newPassword and confirmPassword are required");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new BadRequestException("Passwords do not match");
        }

        String storedOtp = otpService.getOtp(otpRefId);
        if (storedOtp == null || !storedOtp.equals(otp)) {
            String knownAuthRefId = passwordResetRefs.get(otpRefId) != null ? passwordResetRefs.get(otpRefId).authRefId() : null;
            recordAuthEventByAuthRef(knownAuthRefId, null, "VERIFY_OTP_FAILED");
            recordAuthEventByAuthRef(knownAuthRefId, null, "PASSWORD_RESET_FAILED");
            throw new BadRequestException("Invalid OTP");
        }

        PasswordResetSession resetSession = passwordResetRefs.get(otpRefId);
        if (resetSession == null) {
            throw new BadRequestException("Password reset request expired or invalid");
        }

        Signup signup = signupRepository.findByAuthRefId(resetSession.authRefId())
                .orElseThrow(() -> new BadRequestException("Account not found"));
        signup.setPassword(passwordEncoder.encode(newPassword));
        signupRepository.save(signup);
        recordAuthEvent(signup, null, "PASSWORD_RESET_SUCCESS");
        otpService.deleteOtp(otpRefId);
        passwordResetRefs.remove(otpRefId);

        return ResponseHandler.success(Map.of("userId", signup.getUserId()), "Password reset successfully");
    }

    private PasswordResetSession validateAndUpdatePasswordResetResendState(String otpRefId, PasswordResetSession resetSession) {
        Instant now = Instant.now();

        if (resetSession.blockedUntil() != null && now.isBefore(resetSession.blockedUntil())) {
            throw new BadRequestException("You have reached the max OTP resend limit. Please try after some time.");
        }

        if (resetSession.lastOtpSentAt() != null && now.isBefore(resetSession.lastOtpSentAt().plus(OTP_RESEND_COOLDOWN))) {
            throw new BadRequestException("Please wait 15 seconds before requesting another OTP.");
        }

        int nextResendCount = resetSession.resendCount() + 1;
        if (nextResendCount > MAX_OTP_RESENDS) {
            PasswordResetSession blocked = resetSession.withBlockedUntil(now.plus(OTP_RESEND_BUFFER));
            passwordResetRefs.put(otpRefId, blocked);
            throw new BadRequestException("You have reached the max OTP resend limit. Please try after some time.");
        }

        PasswordResetSession updated = resetSession.withResendState(now, nextResendCount);
        passwordResetRefs.put(otpRefId, updated);
        return updated;
    }

    @PostMapping("/request-email-change-otp")
    public ResponseEntity<?> requestEmailChangeOtp(
            Authentication authentication,
            @Valid @RequestBody UpdateEmailRequest request
    ) {
        Signup signup = currentSignup(authentication);

        if (request.email().equalsIgnoreCase(signup.getEmail())) {
            throw new BadRequestException("Same email address");
        }
        signupRepository.findByEmailAndRole(request.email(), signup.getRole())
                .filter(existing -> !existing.getId().equals(signup.getId()))
                .ifPresent(existing -> {
                    throw new BadRequestException("Email already in use for this role");
                });

        String otpRefId = "EMAIL_CHANGE_" + java.util.UUID.randomUUID();
        String otp = AppUtils.generate6DigitOtp();
        otpService.storeOtp(otpRefId, otp);
        emailChangeRefs.put(otpRefId, signup.getAuthRefId() + "|" + request.email());
        emailService.sendOtp(request.email(), otp);
        otpRealtimeService.publishOtp(otpRefId, otp);

        System.out.println("[EMAIL_CHANGE_OTP] currentEmail=" + signup.getEmail()
                + " newEmail=" + request.email()
                + " userId=" + signup.getUserId()
                + " otpRefId=" + otpRefId
                + " otp=" + otp);

        return ResponseHandler.success(new OtpResponse(otpRefId), "OTP sent to new email successfully");
    }

    @PostMapping("/verify-email-change")
    public ResponseEntity<?> verifyEmailChange(
            Authentication authentication,
            @Valid @RequestBody EmailChangeVerifyRequest request
    ) {
        Signup signup = currentSignup(authentication);
        String storedOtp = otpService.getOtp(request.otpRefId());
        if (storedOtp == null || !storedOtp.equals(request.otp())) {
            throw new BadRequestException("Invalid OTP");
        }

        String payload = emailChangeRefs.get(request.otpRefId());
        if (payload == null || !payload.startsWith(signup.getAuthRefId() + "|")) {
            throw new BadRequestException("Invalid email change request");
        }

        String newEmail = payload.substring(payload.indexOf('|') + 1);
        if (!newEmail.equalsIgnoreCase(request.email())) {
            throw new BadRequestException("Email does not match OTP request");
        }

        signup.setEmail(newEmail);
        signupRepository.save(signup);
        otpService.deleteOtp(request.otpRefId());
        emailChangeRefs.remove(request.otpRefId());
        recordAuthEvent(signup, null, "VERIFY_OTP_SUCCESS");

        return ResponseHandler.success(Map.of("email", newEmail), "Email changed successfully");
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody LearnerChangePasswordRequest request
    ) {
        Signup signup = currentSignup(authentication);
        if (!request.newPassword().equals(request.confirmPassword())) {
            recordAuthEvent(signup, null, "CHANGE_PASSWORD_FAILED");
            throw new BadRequestException("Passwords do not match");
        }
        if (!passwordEncoder.matches(request.currentPassword(), signup.getPassword())) {
            recordAuthEvent(signup, null, "CHANGE_PASSWORD_FAILED");
            throw new BadRequestException("Current password is incorrect");
        }

        signup.setPassword(passwordEncoder.encode(request.newPassword()));
        signupRepository.save(signup);
        recordAuthEvent(signup, null, "CHANGE_PASSWORD_SUCCESS");

        return ResponseHandler.success(Map.of("userId", signup.getUserId()), "Password changed successfully");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePasswordPost(
            Authentication authentication,
            @Valid @RequestBody LearnerChangePasswordRequest request
    ) {
        return changePassword(authentication, request);
    }

    @PutMapping("/2fa/toggle")
    public ResponseEntity<?> toggle2FA() {
        return ResponseHandler.success(Map.of("twoFactorEnabled", false), "Two-factor authentication is not enabled for this signup model");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestBody(required = false) Map<String, String> request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String deviceRefId = request == null ? null : request.get("deviceRefId");
        String authRefId = null;

        if (deviceRefId == null || deviceRefId.isBlank()) {
            deviceRefId = getCookieValue(httpRequest, AuthCookieService.DEVICE_ID_COOKIE);
        }

        String accessToken = getCookieValue(httpRequest, AuthCookieService.ACCESS_TOKEN_COOKIE);
        if (accessToken != null && !accessToken.isBlank() && jwtService.validate(accessToken)) {
            Claims claims = jwtService.parseClaims(accessToken);
            authRefId = claims.getSubject();
            if (deviceRefId == null || deviceRefId.isBlank()) {
                deviceRefId = claims.get("deviceId", String.class);
            }
        }

        if (deviceRefId != null && !deviceRefId.isBlank()) {
            try {
                deviceService.deleteDeviceByRefId(deviceRefId);
            } catch (Exception e) {
                logging.errorLogT("Failed to delete device: " + deviceRefId, e.getMessage());
            }
        }

        loginService.revokeSession(authRefId, deviceRefId);
        authCookieService.clearAuthCookies(httpResponse, isSecureRequest(httpRequest));
        recordAuthEventByAuthRef(authRefId, deviceRefId, "LOGOUT_SUCCESS");

        return ResponseHandler.success(Map.of("message", "Logged out successfully"), "Logged out successfully");
    }

    @GetMapping("/devices")
    public ResponseEntity<?> getDevices(Authentication authentication) {
        String authRefId = (String) authentication.getPrincipal();
        var signup = signupRepository.findByAuthRefId(authRefId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        var devices = deviceRepo.findByAuth_Id(signup.getId()).stream()
                .map(device -> new DeviceResponse(
                        device.getDeviceRefId(),
                        device.getDeviceType(),
                        device.getDeviceModel(),
                        device.getOsVersion(),
                        device.getCreatedAt(),
                        false
                ))
                .toList();
        return ResponseHandler.success(devices, "Devices retrieved");
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException("Not authenticated");
        }

        String authRefId = (String) authentication.getPrincipal();
        Signup signup = signupRepository.findByAuthRefId(authRefId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return ResponseHandler.success(Map.of(
                "userId", signup.getUserId(),
                "authRefId", signup.getAuthRefId(),
                "name", signup.getName(),
                "email", signup.getEmail(),
                "role", signup.getRole(),
                "authStatus", signup.getAuthStatus()
        ), "Current session retrieved");
    }

    @DeleteMapping("/devices/{deviceRefId}")
    public ResponseEntity<?> logoutDevice(Authentication authentication, @PathVariable String deviceRefId) {
        String authRefId = (String) authentication.getPrincipal();
        var signup = signupRepository.findByAuthRefId(authRefId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        var device = deviceRepo.findByDeviceRefId(deviceRefId)
                .orElseThrow(() -> new BadRequestException("Device not found"));
        if (device.getAuth() == null || !device.getAuth().getId().equals(signup.getId())) {
            throw new BadRequestException("Device not found");
        }

        deviceService.deleteDeviceByRefId(deviceRefId);
        loginService.revokeSession(authRefId, deviceRefId);
        return ResponseHandler.success(Map.of("message", "Device logged out successfully"), "Device logged out successfully");
    }

    @PostMapping("/logout-device")
    public ResponseEntity<?> logoutDevicePost(
            Authentication authentication,
            @RequestBody Map<String, String> request
    ) {
        String deviceRefId = firstNonBlank(request, "deviceRefId");
        if (deviceRefId == null) {
            throw new BadRequestException("deviceRefId is required");
        }
        return logoutDevice(authentication, deviceRefId);
    }

    @PostMapping("/device-management-token")
    public ResponseEntity<?> getDeviceManagementToken(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = loginService.login(request);
        return ResponseHandler.success(
                Map.of("tempToken", response.tempToken(), "role", response.role()),
                "Temporary token generated for device management"
        );
    }

    @GetMapping("/validate-device")
    public ResponseEntity<?> validateDevice(
            Authentication authentication,
            @RequestHeader(value = "X-Device-Ref-Id", required = false) String deviceRefId
    ) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException("Not authenticated");
        }

        if (deviceRefId == null || deviceRefId.isBlank()) {
            return ResponseHandler.success(Map.of("valid", true), "Device is valid");
        }

        String authRefId = (String) authentication.getPrincipal();
        if (!deviceService.isValidDevice(authRefId, deviceRefId)) {
            throw new UnauthorizedException("Device not authorized");
        }
        return ResponseHandler.success(Map.of("valid", true), "Device is valid");
    }

    private LoginResponse sanitize(LoginResponse response) {
        return new LoginResponse(
                response.status(),
                response.authToken(),
                response.refreshToken(),
                response.userId(),
                response.authRefId(),
                response.name(),
                response.email(),
                response.role(),
                response.authStatus(),
                response.deviceRefId(),
                response.tempToken(),
                response.reviewRemark(),
                response.activeDevices()
        );
    }

    private void recordAuthEvent(Signup signup, String deviceRefId, String status) {
        if (signup == null) {
            return;
        }
        Login login = new Login();
        login.setUserId(signup.getUserId());
        login.setAuthRefId(signup.getAuthRefId());
        login.setRole(signup.getRole());
        login.setDeviceRefId(deviceRefId);
        login.setLoginStatus(status);
        loginRepository.save(login);
    }

    private void recordAuthEventByAuthRef(String authRefId, String deviceRefId, String status) {
        if (authRefId == null || authRefId.isBlank()) {
            return;
        }

        Signup signup = signupRepository.findByAuthRefId(authRefId).orElse(null);
        if (signup != null) {
            recordAuthEvent(signup, deviceRefId, status);
            return;
        }

        ProfileManage profile = profileManageRepository.findByAuthRefId(authRefId).orElse(null);
        if (profile == null) {
            return;
        }

        Login login = new Login();
        login.setUserId(profile.getUserId());
        login.setAuthRefId(authRefId);
        login.setRole(profile.getRole() != null ? profile.getRole() : Role.LEARNER);
        login.setDeviceRefId(deviceRefId);
        login.setLoginStatus(status);
        loginRepository.save(login);
    }

    private Signup currentSignup(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        String authRefId = (String) authentication.getPrincipal();
        return signupRepository.findByAuthRefId(authRefId)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    private String firstNonBlank(Map<String, String> values, String... keys) {
        if (values == null) {
            return null;
        }
        for (String key : keys) {
            String value = values.get(key);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedProto != null) {
            return "https".equalsIgnoreCase(forwardedProto);
        }
        return request.isSecure();
    }

    private String getCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private record PasswordResetSession(
            String authRefId,
            Instant lastOtpSentAt,
            int resendCount,
            Instant blockedUntil
    ) {
        PasswordResetSession withResendState(Instant lastOtpSentAt, int resendCount) {
            return new PasswordResetSession(authRefId, lastOtpSentAt, resendCount, null);
        }

        PasswordResetSession withBlockedUntil(Instant blockedUntil) {
            return new PasswordResetSession(authRefId, lastOtpSentAt, resendCount, blockedUntil);
        }
    }
}
