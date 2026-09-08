package com.tcs.medverse.dto.response;

public record LearnerSubmissionResponse(
        String caseId,
        String caseTitle,
        String caseDisease,
        String caseDepartment,
        String approvalStatus,
        String submittedDate,
        String remarks,
        boolean published,
        String verificationId
) {}
