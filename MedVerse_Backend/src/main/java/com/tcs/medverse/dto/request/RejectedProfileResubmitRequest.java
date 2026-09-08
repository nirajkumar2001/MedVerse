package com.tcs.medverse.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RejectedProfileResubmitRequest(
        @NotBlank String userId,
        @NotBlank String password,
        @NotBlank String documentName,
        @NotBlank String documentContentType,
        @NotBlank String documentData
) {}
