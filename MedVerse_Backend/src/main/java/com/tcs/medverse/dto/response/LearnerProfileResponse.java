package com.tcs.medverse.dto.response;

public record LearnerProfileResponse(
        String learnerId,
        String name,
        String email,
        String institution,
        String department,
        String role,
        String memberSince,
        String profileImage
) {}
