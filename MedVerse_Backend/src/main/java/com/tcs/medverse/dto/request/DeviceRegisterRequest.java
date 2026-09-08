package com.tcs.medverse.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;

import com.tcs.medverse.enums.LocationPermission;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeviceRegisterRequest(
        String deviceId,
        String deviceType,
        String deviceModel,
        String osVersion,
        String appVersion,
        LocationPermission locationPermission,
        Double latitude,
        Double longitude,
        String ipAddress
) {}