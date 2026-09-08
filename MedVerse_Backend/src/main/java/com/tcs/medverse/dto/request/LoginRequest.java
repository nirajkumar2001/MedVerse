package com.tcs.medverse.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginRequest(
        @NotBlank(message = "User ID is required")
        String userId,

        @NotBlank(message = "Password is required")
        String password,

        String deviceId,
        String deviceType,
        String deviceModel,
        String osVersion,
        String appVersion
) {}