package com.tcs.medverse.dto;

import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;

import java.time.LocalDateTime;

public record AdminUserResponse(
        String id,
        String userId,
        String authRefId,
        String name,
        String email,
        Role role,
        AuthStatus authStatus,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String documentName,
        String documentContentType,
        String documentData,
        String reviewRemark,
        LocalDateTime reviewedAt,
        String profileImage
) {}
