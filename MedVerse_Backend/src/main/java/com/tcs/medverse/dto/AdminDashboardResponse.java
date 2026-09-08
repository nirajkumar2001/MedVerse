package com.tcs.medverse.dto;

public record AdminDashboardResponse(
        long totalUsers,
        long totalLearners,
        long totalAdmins,
        long totalPublishedCases,
        long totalSubmissions,
        long pendingSubmissions,
        long rejectedSubmissions
) {}