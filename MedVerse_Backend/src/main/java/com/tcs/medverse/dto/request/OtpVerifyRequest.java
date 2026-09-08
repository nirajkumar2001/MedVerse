package com.tcs.medverse.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OtpVerifyRequest(
        String otpRefId,
        String otp,
        String identifier,
        String deviceId,
        String deviceType,
        String deviceModel,
        String osVersion,
        String appVersion
) {}