package com.tcs.medverse.dto;

public record AdminSubmissionResponse(
        Long caseId,
        String learnerId,
        String caseTitle,
        String caseDisease,
        String caseDepartment,
        String approvalStatus,
        String submittedDate
) {}


