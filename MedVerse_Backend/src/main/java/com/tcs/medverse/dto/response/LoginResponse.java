package com.tcs.medverse.dto.response;
import com.fasterxml.jackson.annotation.JsonInclude;

import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(
        String status,
        String authToken,
        String refreshToken,
        String userId,
        String authRefId,
        String name,
        String email,
        Role role,
        AuthStatus authStatus,
        String deviceRefId,
        String tempToken,
        String reviewRemark,
        List<DeviceResponse> activeDevices
) {}
