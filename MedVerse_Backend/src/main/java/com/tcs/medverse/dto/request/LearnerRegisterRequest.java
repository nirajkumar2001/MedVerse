package com.tcs.medverse.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LearnerRegisterRequest(
        @NotBlank
        @Size(max = 150)
        String name,

        @NotBlank
        @Email
        @Size(max = 150)
        String email,

        @NotBlank
        @Size(min = 8, max = 255)
        String password,

        @NotBlank
        @Size(max = 150)
        String institution,

        // Optional for now (not present in current SQL schema)
        String specialization
) {}
