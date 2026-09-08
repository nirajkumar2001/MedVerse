package com.tcs.medverse.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LearnerProfileUpdateRequest(
        @Size(max = 150)
        String name,
        @Size(max = 150)
        String institution,
        @Size(max = 150)
        String department,
        String profileImage,
        String profileImageData
) {}
