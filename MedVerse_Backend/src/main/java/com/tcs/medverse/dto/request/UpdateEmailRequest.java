package com.tcs.medverse.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UpdateEmailRequest(
        @NotBlank
        @Email(message = "Invalid email address")
        String email
) {}