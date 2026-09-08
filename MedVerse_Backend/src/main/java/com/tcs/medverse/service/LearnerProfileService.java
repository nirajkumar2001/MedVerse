package com.tcs.medverse.service;

import com.tcs.medverse.dto.request.LearnerProfileUpdateRequest;
import com.tcs.medverse.dto.response.LearnerProfileResponse;
import com.tcs.medverse.dto.response.LearnerProfileStatsResponse;

public interface LearnerProfileService {
    LearnerProfileResponse getMyProfile(String authRefId);
    LearnerProfileResponse updateMyProfile(String authRefId, LearnerProfileUpdateRequest request);
    LearnerProfileResponse updateMyProfileImage(String authRefId, String profileImage);
    LearnerProfileStatsResponse getMyStats(String authRefId);
}
