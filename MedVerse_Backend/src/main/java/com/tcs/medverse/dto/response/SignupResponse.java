package com.tcs.medverse.dto.response;

import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;

public record SignupResponse(
        String id,
        String userId,
        String authRefId,
        String name,
        String email,
        Role role,
        AuthStatus authStatus,
        boolean active
) {}