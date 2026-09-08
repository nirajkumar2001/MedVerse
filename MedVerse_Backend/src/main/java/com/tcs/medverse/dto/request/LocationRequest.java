package com.tcs.medverse.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LocationRequest(
        String location,
        Double latitude,
        Double longitude,
        String pinCode,
        Integer serviceRadius // in kilometers, default 15
) {}