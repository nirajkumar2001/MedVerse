package com.tcs.medverse.service;

import com.tcs.medverse.dto.request.LearnerSubmitCaseRequest;
import com.tcs.medverse.dto.response.LearnerSubmissionDetailResponse;
import com.tcs.medverse.dto.response.LearnerSubmissionResponse;
import com.tcs.medverse.dto.response.PageResponse;

public interface LearnerCaseService {
    LearnerSubmissionDetailResponse submitCase(String authRefId, LearnerSubmitCaseRequest request);
    PageResponse<LearnerSubmissionResponse> listMySubmissions(String authRefId, int page, int size);
    LearnerSubmissionDetailResponse getMySubmission(String authRefId, String caseId);

    LearnerSubmissionDetailResponse resubmitCase(String authRefId, String caseId, LearnerSubmitCaseRequest request);
    void deletePendingSubmission(String authRefId, String caseId);
    LearnerSubmissionDetailResponse publishApprovedSubmission(String authRefId, String caseId);
    String getSubmissionStatus(String authRefId, String caseId);
}
