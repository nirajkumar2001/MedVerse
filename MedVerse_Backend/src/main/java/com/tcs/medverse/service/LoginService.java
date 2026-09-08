package com.tcs.medverse.service;

import com.tcs.medverse.dto.request.DeviceRegisterRequest;
import com.tcs.medverse.dto.request.LoginRequest;
import com.tcs.medverse.dto.response.DeviceRegisterResp;
import com.tcs.medverse.dto.response.DeviceResponse;
import com.tcs.medverse.dto.response.LoginResponse;
import com.tcs.medverse.entity.AuthTokenEntity;
import com.tcs.medverse.entity.DeviceInfoEntity;
import com.tcs.medverse.entity.Login;
import com.tcs.medverse.entity.ProfileManage;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.exception.BadRequestException;
import com.tcs.medverse.exception.DeviceLimitExceededException;
import com.tcs.medverse.exception.ForbiddenException;
import com.tcs.medverse.exception.UnauthorizedException;
import com.tcs.medverse.repository.AuthTokenRepository;
import com.tcs.medverse.repository.DeviceInfoRepository;
import com.tcs.medverse.repository.LoginRepository;
import com.tcs.medverse.repository.ProfileManageRepository;
import com.tcs.medverse.repository.SignupRepository;
import com.tcs.medverse.security.JwtService;
import com.tcs.medverse.util.RateLimiterService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final SignupRepository signupRepository;
    private final DeviceInfoRepository deviceRepo;
    private final AuthTokenRepository authTokenRepo;
    private final LoginRepository loginRepository;
    private final ProfileManageRepository profileManageRepository;
    private final DeviceService deviceService;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;
    private final RateLimiterService rateLimiter;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        rateLimiter.checkRequestLimit("LOGIN:" + request.userId());

        if (request.userId().contains("@")) {
            throw new BadRequestException("Login with email is not allowed. Use userId.");
        }

        Signup user = signupRepository.findByUserId(request.userId())
                .orElse(null);
        if (user == null) {
            recordUnknownAttempt(request.userId(), "FAILED_INVALID_USER");
            throw new BadRequestException("Invalid credentials");
        }

        if (!encoder.matches(request.password(), user.getPassword())) {
            recordLogin(user, null, "FAILED_INVALID_PASSWORD");
            throw new BadRequestException("Invalid credentials");
        }

        ProfileManage profile = profileManageRepository.findById(user.getUserId()).orElse(null);
        boolean suspendedInProfile = profile != null
                && (profile.getStatus() == com.tcs.medverse.enums.AuthStatus.SUSPENDED
                || profile.getRejectionCount() >= 3);

        if (!user.isActive()
                || user.getAuthStatus() == com.tcs.medverse.enums.AuthStatus.SUSPENDED
                || suspendedInProfile) {
            if (user.getAuthStatus() != com.tcs.medverse.enums.AuthStatus.SUSPENDED || user.isActive()) {
                user.setAuthStatus(com.tcs.medverse.enums.AuthStatus.SUSPENDED);
                user.setActive(false);
                signupRepository.save(user);
            }
            if (profile != null && profile.getStatus() != com.tcs.medverse.enums.AuthStatus.SUSPENDED) {
                profile.setStatus(com.tcs.medverse.enums.AuthStatus.SUSPENDED);
                profileManageRepository.save(profile);
            }
            recordLogin(user, null, "DISABLED");
            return buildStatusResponse(user, "ACCOUNT_SUSPENDED");
        }

        if (user.getAuthStatus() == com.tcs.medverse.enums.AuthStatus.PENDING) {
            recordLogin(user, null, "PROFILE_PENDING");
            return buildStatusResponse(user, "PROFILE_PENDING");
        }

        if (user.getAuthStatus() == com.tcs.medverse.enums.AuthStatus.REJECTED) {
            recordLogin(user, null, "PROFILE_REJECTED");
            return buildStatusResponse(user, "PROFILE_REJECTED");
        }

        try {
            DeviceInfoEntity device = registerDevice(request, user);
            String accessToken = jwtService.generateAccessToken(user.getAuthRefId(), device.getDeviceRefId(), user.getRole());
            String refreshToken = generateRefreshToken(user, device);

            recordLogin(user, device.getDeviceRefId(), "SUCCESS");

            return buildSuccessResponse(user, accessToken, refreshToken, device.getDeviceRefId(), null);
        } catch (DeviceLimitExceededException e) {
            String tempToken = jwtService.generateDeviceManagementToken(user.getAuthRefId(), user.getRole());
            recordLogin(user, null, "DEVICE_LIMIT_EXCEEDED");
            return buildSuccessResponse(user, null, null, null, tempToken, activeDevices(user, null));
        }
    }

    public LoginResponse refreshToken(String refreshToken) {
        AuthTokenEntity token = findValidRefreshToken(refreshToken);
        if (token == null) {
            throw new UnauthorizedException("Session expired");
        }

        Signup user = token.getAuth();
        String newAccessToken = jwtService.generateAccessToken(
                user.getAuthRefId(),
                token.getDeviceRefId(),
                token.getRole()
        );

        return buildSuccessResponse(user, newAccessToken, null, token.getDeviceRefId(), null, null);
    }

    @Transactional
    public void revokeSession(String authRefId, String deviceRefId) {
        if (authRefId == null || deviceRefId == null) {
            return;
        }
        authTokenRepo.deleteByAuth_AuthRefIdAndDeviceRefId(authRefId, deviceRefId);
    }

    public String generateDeviceManagementToken(String authRefId, com.tcs.medverse.enums.Role role) {
        return jwtService.generateDeviceManagementToken(authRefId, role);
    }

    private DeviceInfoEntity registerDevice(LoginRequest request, Signup user) {
        String deviceId = request.deviceId();
        if (deviceId == null || deviceId.isBlank()) {
            deviceId = "DEVICE_" + UUID.randomUUID();
        }

        DeviceRegisterResp deviceResp = deviceService.registerWithAuth(
                new DeviceRegisterRequest(
                        deviceId,
                        request.deviceType(),
                        request.deviceModel(),
                        request.osVersion(),
                        request.appVersion(),
                        null, null, null, null
                ),
                user
        );

        return deviceRepo.findByDeviceRefId(deviceResp.deviceRefId())
                .orElseThrow(() -> new BadRequestException("Device registration failed"));
    }

    private String generateRefreshToken(Signup user, DeviceInfoEntity device) {
        String refreshToken = UUID.randomUUID().toString();
        AuthTokenEntity token = new AuthTokenEntity();
        token.setAuth(user);
        token.setDeviceRefId(device.getDeviceRefId());
        token.setRefreshTokenHash(encoder.encode(refreshToken));
        token.setExpiresAt(LocalDateTime.now().plusDays(30));
        token.setCreatedAt(LocalDateTime.now());
        token.setRole(user.getRole());
        authTokenRepo.save(token);
        return refreshToken;
    }

    private AuthTokenEntity findValidRefreshToken(String plainRefreshToken) {
        if (plainRefreshToken == null || plainRefreshToken.isBlank()) {
            return null;
        }

        List<AuthTokenEntity> candidates = authTokenRepo.findByExpiresAtAfter(LocalDateTime.now());
        for (AuthTokenEntity token : candidates) {
            String tokenHash = token.getRefreshTokenHash();
            if (tokenHash != null && encoder.matches(plainRefreshToken, tokenHash)) {
                return token;
            }
        }
        return null;
    }

    private void recordLogin(Signup user, String deviceRefId, String status) {
        Login login = new Login();
        login.setUserId(user.getUserId());
        login.setAuthRefId(user.getAuthRefId());
        login.setRole(user.getRole());
        login.setDeviceRefId(deviceRefId);
        login.setLoginStatus(status);
        login.setLoginAt(LocalDateTime.now());
        loginRepository.save(login);
    }

    private LoginResponse buildSuccessResponse(
            Signup user,
            String accessToken,
            String refreshToken,
            String deviceRefId,
            String tempToken
    ) {
        return new LoginResponse(
                tempToken == null ? "SUCCESS" : "DEVICE_LIMIT_EXCEEDED",
                accessToken,
                refreshToken,
                user.getUserId(),
                user.getAuthRefId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAuthStatus(),
                deviceRefId,
                tempToken,
                null,
                null
        );
    }

    private LoginResponse buildSuccessResponse(
            Signup user,
            String accessToken,
            String refreshToken,
            String deviceRefId,
            String tempToken,
            List<DeviceResponse> activeDevices
    ) {
        return new LoginResponse(
                tempToken == null ? "SUCCESS" : "DEVICE_LIMIT_EXCEEDED",
                accessToken,
                refreshToken,
                user.getUserId(),
                user.getAuthRefId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAuthStatus(),
                deviceRefId,
                tempToken,
                null,
                activeDevices
        );
    }

    private LoginResponse buildStatusResponse(Signup user, String status) {
        String reviewRemark = profileManageRepository.findById(user.getUserId())
                .map(ProfileManage::getReviewRemark)
                .orElse(null);

        return new LoginResponse(
                status,
                null,
                null,
                user.getUserId(),
                user.getAuthRefId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAuthStatus(),
                null,
                null,
                reviewRemark,
                null
        );
    }

    private List<DeviceResponse> activeDevices(Signup user, String currentDeviceRefId) {
        return deviceRepo.findByAuth_Id(user.getId()).stream()
                .map(device -> new DeviceResponse(
                        device.getDeviceRefId(),
                        device.getDeviceType(),
                        device.getDeviceModel(),
                        device.getOsVersion(),
                        device.getCreatedAt(),
                        device.getDeviceRefId() != null && device.getDeviceRefId().equals(currentDeviceRefId)
                ))
                .toList();
    }

    private void recordUnknownAttempt(String rawUserId, String status) {
        String safeUserId = (rawUserId == null || rawUserId.isBlank()) ? "UNKNOWN" : rawUserId;
        Login login = new Login();
        login.setUserId(safeUserId.length() > 8 ? safeUserId.substring(0, 8) : safeUserId);
        login.setAuthRefId("UNKNOWN_" + safeUserId);
        login.setRole(Role.LEARNER);
        login.setDeviceRefId(null);
        login.setLoginStatus(status);
        login.setLoginAt(LocalDateTime.now());
        loginRepository.save(login);
    }
}
