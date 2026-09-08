package com.tcs.medverse.dto.response;

public record LearnerLoginResponse(
        String token,
        String tokenType,
        String deviceRefId,
        String learnerId,
        String name,
        String role
) {}