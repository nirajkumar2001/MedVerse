package com.tcs.medverse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LearnerChangePasswordRequest(
        @NotBlank
        String currentPassword,

        @NotBlank
        @Size(min = 8)
        String newPassword,

        @NotBlank
        @Size(min = 8)
        String confirmPassword
) {}