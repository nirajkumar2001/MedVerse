package com.tcs.medverse.dto.request;

import jakarta.validation.constraints.NotBlank;

public record MobileChangeVerifyRequest(
        @NotBlank String otpRefId,
        @NotBlank String otp,
        @NotBlank String mobile
) {}