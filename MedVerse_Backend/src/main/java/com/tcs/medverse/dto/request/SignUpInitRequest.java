package com.tcs.medverse.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tcs.medverse.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SignUpInitRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8)
        String password,

        @NotNull(message = "Role is required")
        Role role,

        String documentName,

        String documentContentType,

        String documentData,

        String otpRefId
) {}
