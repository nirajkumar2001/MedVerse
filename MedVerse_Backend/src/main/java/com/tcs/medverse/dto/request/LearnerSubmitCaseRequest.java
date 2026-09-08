package com.tcs.medverse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LearnerSubmitCaseRequest(
        @NotBlank
        @Size(max = 255)
        String caseTitle,

        @NotBlank
        String caseDescription,

        @NotBlank
        @Size(max = 100)
        String caseDepartment,

        @NotBlank
        @Size(max = 100)
        String caseDisease,

        // Optional: base64 (or data-url) representation of the PDF/doc
        byte[] caseDocBase64,

        @Size(max = 255)
        String caseDocName,

        @Size(max = 100)
        String caseDocContentType
) {}
