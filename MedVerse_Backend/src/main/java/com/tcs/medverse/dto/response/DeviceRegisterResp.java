package com.tcs.medverse.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeviceRegisterResp(String deviceRefId) {}