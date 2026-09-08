package com.tcs.medverse.dto.response;

import java.time.LocalDateTime;

public record DeviceResponse(
        String deviceRefId,
        String deviceType,
        String deviceModel,
        String osVersion,
        LocalDateTime createdAt,
        boolean isCurrentDevice
) {
    @Override
    public String deviceRefId() {
        return deviceRefId;
    }

    @Override
    public String deviceType() {
        return deviceType;
    }

    @Override
    public String deviceModel() {
        return deviceModel;
    }

    @Override
    public String osVersion() {
        return osVersion;
    }

    @Override
    public LocalDateTime createdAt() {
        return createdAt;
    }

    @Override
    public boolean isCurrentDevice() {
        return isCurrentDevice;
    }
}