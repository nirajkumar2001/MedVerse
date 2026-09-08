package com.tcs.medverse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LearnerResetPasswordRequest(
        @NotBlank
        String resetToken,

        @NotBlank
        @Size(min = 8)
        String newPassword,

        @NotBlank
        @Size(min = 8)
        String confirmPassword
) {}