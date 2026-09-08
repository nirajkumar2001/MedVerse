package com.tcs.medverse.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OtpResponse(String otpRefId, String otp) {
    public OtpResponse(String otpRefId) {
        this(otpRefId, null);
    }
}
