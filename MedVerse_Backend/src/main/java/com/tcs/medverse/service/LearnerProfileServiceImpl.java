package com.tcs.medverse.service;

import com.tcs.medverse.dto.request.LearnerProfileUpdateRequest;
import com.tcs.medverse.dto.response.LearnerProfileResponse;
import com.tcs.medverse.dto.response.LearnerProfileStatsResponse;
import com.tcs.medverse.entity.LearnerEntity;
import com.tcs.medverse.entity.ProfileManage;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.repository.BookmarkRepository;
import com.tcs.medverse.repository.LearnerRepository;
import com.tcs.medverse.repository.ProfileManageRepository;
import com.tcs.medverse.repository.SubmitNewCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class LearnerProfileServiceImpl implements LearnerProfileService {

    private final LearnerContextService learnerContextService;
    private final LearnerRepository learnerRepository;
    private final SubmitNewCaseRepository submitNewCaseRepository;
    private final BookmarkRepository bookmarkRepository;
    private final ProfileManageRepository profileManageRepository;
    private static final DateTimeFormatter MEMBER_SINCE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    @Override
    public LearnerProfileResponse getMyProfile(String authRefId) {
        Signup auth = learnerContextService.getAuthOrThrow(authRefId);
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);
        return toResponse(learner, auth);
    }

    @Override
    public LearnerProfileResponse updateMyProfile(String authRefId, LearnerProfileUpdateRequest request) {
        Signup auth = learnerContextService.getAuthOrThrow(authRefId);
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);

        if (request.name() != null) {
            learner.setName(request.name());
        }
        if (request.institution() != null) {
            learner.setInstitution(request.institution());
        }
        if (request.department() != null) {
            learner.setDepartment(request.department());
        }
        String profileImage = request.profileImage() != null ? request.profileImage() : request.profileImageData();
        if (profileImage != null) {
            learner.setProfileImage(profileImage);
        }

        learner = learnerRepository.save(learner);
        return toResponse(learner, auth);
    }

    @Override
    public LearnerProfileResponse updateMyProfileImage(String authRefId, String profileImage) {
        Signup auth = learnerContextService.getAuthOrThrow(authRefId);
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);
        learner.setProfileImage(profileImage);
        return toResponse(learnerRepository.save(learner), auth);
    }

    @Override
    public LearnerProfileStatsResponse getMyStats(String authRefId) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);

        long bookmarksCount = bookmarkRepository.countByLearnerId(learner.getLearnerId());
        long submissionsCount = submitNewCaseRepository.countByLearnerId(learner.getLearnerId());
        long approved = submitNewCaseRepository.countByLearnerIdAndApprovalStatusIgnoreCase(learner.getLearnerId(), "APPROVED");
        long pending = submitNewCaseRepository.countByLearnerIdAndApprovalStatusIgnoreCase(learner.getLearnerId(), "UNDER_REVIEW")
                + submitNewCaseRepository.countByLearnerIdAndApprovalStatusIgnoreCase(learner.getLearnerId(), "PENDING");
        long rejected = submitNewCaseRepository.countByLearnerIdAndApprovalStatusIgnoreCase(learner.getLearnerId(), "REJECTED");

        return new LearnerProfileStatsResponse(bookmarksCount, submissionsCount, approved, pending, rejected);
    }

    private LearnerProfileResponse toResponse(LearnerEntity learner, Signup auth) {
        LocalDateTime memberSinceDate = getApprovedAt(auth);
        if (memberSinceDate == null) {
            memberSinceDate = learner.getCreatedDate();
        }

        String memberSince = memberSinceDate == null
                ? null
                : memberSinceDate.toLocalDate().format(MEMBER_SINCE_FORMAT);

        return new LearnerProfileResponse(
                learner.getLearnerId(),
                learner.getName(),
                learner.getEmail(),
                learner.getInstitution(),
                learner.getDepartment(),
                "Medical Student",
                memberSince,
                learner.getProfileImage()
        );
    }

    private LocalDateTime getApprovedAt(Signup auth) {
        if (auth == null || auth.getAuthStatus() != AuthStatus.APPROVED) {
            return null;
        }

        return profileManageRepository.findById(auth.getUserId())
                .map(ProfileManage::getReviewedAt)
                .orElse(auth.getUpdatedAt());
    }
}
