package com.tcs.medverse.dto.response;

public record LearnerProfileStatsResponse(
        long bookmarksCount,
        long submissionsCount,
        long approvedSubmissions,
        long pendingSubmissions,
        long rejectedSubmissions
) {}