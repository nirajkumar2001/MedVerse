package com.tcs.medverse.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LearnerLoginRequest(
        @NotBlank
        String userId,

        @NotBlank
        String password,

        // Device fields (required by existing login flow)
        @NotBlank
        String deviceId,
        @NotBlank
        String deviceType,
        @NotBlank
        String deviceModel,
        @NotBlank
        String osVersion,
        @NotBlank
        String appVersion
) {}
