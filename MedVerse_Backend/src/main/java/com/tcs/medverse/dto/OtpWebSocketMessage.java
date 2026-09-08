package com.tcs.medverse.dto;

public record OtpWebSocketMessage(
        String sessionId,
        String otpRefId,
        String otp,
        long expiresInSeconds,
        String message
) {}
