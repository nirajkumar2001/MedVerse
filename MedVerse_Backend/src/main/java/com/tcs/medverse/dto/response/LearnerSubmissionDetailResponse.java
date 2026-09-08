package com.tcs.medverse.dto.response;

public record LearnerSubmissionDetailResponse(
        String caseId,
        String caseTitle,
        String caseDescription,
        String caseDisease,
        String caseDepartment,
        String approvalStatus,
        String submittedDate,
        byte[] caseDocBase64,
        String caseDocName,
        String caseDocContentType,
        String remarks,
        boolean published,
        String verificationId,
        String assignedOfficerId,
        String assignedOfficerName,
        String assignedOfficerDepartment
) {}
