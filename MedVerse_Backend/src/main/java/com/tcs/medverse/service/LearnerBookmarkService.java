package com.tcs.medverse.service;

import com.tcs.medverse.dto.response.LearnerBookmarkResponse;
import com.tcs.medverse.dto.response.PageResponse;

public interface LearnerBookmarkService {
    PageResponse<LearnerBookmarkResponse> listMyBookmarks(String authRefId, int page, int size);
    LearnerBookmarkResponse addBookmark(String authRefId, String caseId);
    void removeBookmark(String authRefId, String caseId);
    boolean isBookmarked(String authRefId, String caseId);
}