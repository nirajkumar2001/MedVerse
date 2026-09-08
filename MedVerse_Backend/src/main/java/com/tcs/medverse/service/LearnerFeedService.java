package com.tcs.medverse.service;

import com.tcs.medverse.dto.response.LearnerFeedItemResponse;
import com.tcs.medverse.dto.response.PageResponse;

import java.util.List;

public interface LearnerFeedService {
    PageResponse<LearnerFeedItemResponse> getFeed(String authRefId, String q, String disease, String department, int page, int size);
    LearnerFeedItemResponse getCaseById(String authRefId, String caseId);
    List<String> listDiseases();
}