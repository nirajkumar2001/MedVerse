package com.tcs.medverse.dto.request;

import jakarta.validation.constraints.NotNull;

public record LearnerBookmarkRequest(
        @NotNull
        Long caseId
) {}