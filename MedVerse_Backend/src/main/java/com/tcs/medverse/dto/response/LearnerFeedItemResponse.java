package com.tcs.medverse.dto.response;

import java.time.LocalDate;

public record LearnerFeedItemResponse(
        String caseId,
        String caseTitle,
        String caseDescription,
        String caseDisease,
        String caseDepartment,
        String learnerId,
        String learnerName,
        LocalDate reviewedDate,
        boolean bookmarked,
        String caseDoc,
        String caseDocName,
        String caseDocContentType,
        String verificationId,
        String authOfficerRemarks,
        String authOfficerId
) {}
