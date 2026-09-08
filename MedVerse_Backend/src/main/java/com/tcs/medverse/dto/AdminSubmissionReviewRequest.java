package com.tcs.medverse.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminSubmissionReviewRequest(
        @NotBlank
        String status,
        String feedbackId
) {}
