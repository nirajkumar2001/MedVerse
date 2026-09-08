package com.tcs.medverse.dto.response;

public record LearnerBookmarkResponse(
        String bookmarkId,
        String caseId,
        String title,
        String category,
        String description,
        String pdfBase64,
        String savedOn,
        String savedAt
) {}
