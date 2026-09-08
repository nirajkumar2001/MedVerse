package com.tcs.medverse.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LearnerForgotPasswordRequest(
        @NotBlank
        @Email
        String email
) {}