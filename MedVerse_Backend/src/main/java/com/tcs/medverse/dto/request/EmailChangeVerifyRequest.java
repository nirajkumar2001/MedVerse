package com.tcs.medverse.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record EmailChangeVerifyRequest(
        @NotBlank String otpRefId,
        @NotBlank
        @Pattern(regexp = "^\\d{6}$", message = "OTP must be 6 digits")
        String otp,
        @NotBlank
        @Email(message = "Invalid email address")
        String email
) {}