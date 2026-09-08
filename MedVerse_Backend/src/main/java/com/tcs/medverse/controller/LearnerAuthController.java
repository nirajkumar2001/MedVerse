package com.tcs.medverse.controller;

import com.tcs.medverse.dto.request.LearnerChangePasswordRequest;
import com.tcs.medverse.dto.request.LearnerForgotPasswordRequest;
import com.tcs.medverse.dto.request.LearnerLoginRequest;
import com.tcs.medverse.dto.request.LearnerRegisterRequest;
import com.tcs.medverse.dto.request.LearnerResetPasswordRequest;
import com.tcs.medverse.service.LearnerAuthService;
import com.tcs.medverse.util.ResponseHandler;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Learner Authentication APIs", description = "Learner registration and session endpoints")
@RestController
@RequestMapping("/api/v1/learner/auth")
@RequiredArgsConstructor
public class LearnerAuthController {

    private final LearnerAuthService learnerAuthService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody LearnerRegisterRequest request) {
        return ResponseHandler.created(learnerAuthService.register(request), "Learner registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LearnerLoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        return ResponseHandler.success(learnerAuthService.login(request, httpRequest, httpResponse), "Learner login successful");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        learnerAuthService.logout(httpRequest, httpResponse);
        return ResponseHandler.success(Map.of("message", "Logged out successfully"), "Logged out successfully");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody LearnerForgotPasswordRequest request) {
        learnerAuthService.forgotPassword(request);
        return ResponseHandler.success(Map.of("message", "Password reset token sent"), "Password reset token sent");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody LearnerResetPasswordRequest request) {
        learnerAuthService.resetPassword(request);
        return ResponseHandler.success(Map.of("message", "Password reset successfully"), "Password reset successfully");
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody LearnerChangePasswordRequest request
    ) {
        learnerAuthService.changePassword((String) authentication.getPrincipal(), request);
        return ResponseHandler.success(Map.of("message", "Password changed successfully"), "Password changed successfully");
    }
}
