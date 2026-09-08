package com.tcs.medverse.dto.response;

import java.time.LocalDate;

public record DiseaseRepositoryItemResponse(
        long repoId,
        String title,
        String description,
        boolean recommended,
        boolean popular,
        LocalDate createdAt
) {}