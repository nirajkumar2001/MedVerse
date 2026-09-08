package com.tcs.medverse.service;

import com.tcs.medverse.dto.response.LearnerFeedItemResponse;
import com.tcs.medverse.dto.response.PageResponse;
import com.tcs.medverse.entity.LearnerEntity;
import com.tcs.medverse.entity.PublishedCaseEntity;
import com.tcs.medverse.exception.NotFoundException;
import com.tcs.medverse.repository.BookmarkRepository;
import com.tcs.medverse.repository.LearnerRepository;
import com.tcs.medverse.repository.PublishedCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LearnerFeedServiceImpl implements LearnerFeedService {

    private final LearnerContextService learnerContextService;
    private final PublishedCaseRepository publishedCaseRepository;
    private final BookmarkRepository bookmarkRepository;
    private final LearnerRepository learnerRepository;

    @Override
    public PageResponse<LearnerFeedItemResponse> getFeed(
            String authRefId,
            String q,
            String disease,
            String department,
            int page,
            int size
    ) {

        LearnerEntity learner =
                learnerContextService.getOrCreateLearnerForAuth(authRefId);

        // ✅ fetch all from DB (NO FILTER in SQL)
        Page<PublishedCaseEntity> dbResult =
                publishedCaseRepository.findAllCases(PageRequest.of(page, size));

        // ✅ filter in JAVA (safe)
        List<PublishedCaseEntity> filtered = dbResult.getContent()
                .stream()
                .filter(c -> matches(c, q, disease, department))
                .toList();

        // ✅ convert to response
        List<LearnerFeedItemResponse> content = filtered.stream()
                .map(c -> new LearnerFeedItemResponse(
                        c.getCaseId(),
                        c.getCaseTitle(),
                        c.getCaseDescription(),
                        c.getCaseDisease(),
                        c.getCaseDepartment(),
                        c.getLearnerId(),
                        resolveLearnerName(c.getLearnerId()),
                        c.getCaseReviewedDate(),
                        bookmarkRepository.existsByLearnerIdAndCaseId(
                                learner.getLearnerId(),
                                c.getCaseId()
                        ),
                        c.getCaseDoc(),
                        c.getCaseDocName(),
                        c.getCaseDocContentType(),
                        c.getVerificationId(),
                        c.getAuthOfficerRemarks(),
                        c.getAuthOfficerId()
                ))
                .toList();

        return new PageResponse<>(
                content,
                page,
                size,
                filtered.size(),
                dbResult.getTotalPages()
        );
    }

    @Override
    public List<String> listDiseases() {
        return publishedCaseRepository.findDistinctDiseases();
    }

    @Override




    public LearnerFeedItemResponse getCaseById(String authRefId, String caseId) {

        LearnerEntity learner =
                learnerContextService.getOrCreateLearnerForAuth(authRefId);

        PublishedCaseEntity c = publishedCaseRepository.findById(caseId)
                .orElseThrow(() -> new NotFoundException("Case not found"));

        return new LearnerFeedItemResponse(
                c.getCaseId(),
                c.getCaseTitle(),
                c.getCaseDescription(),
                c.getCaseDisease(),
                c.getCaseDepartment(),
                c.getLearnerId(),
                resolveLearnerName(c.getLearnerId()),
                c.getCaseReviewedDate(),
                bookmarkRepository.existsByLearnerIdAndCaseId(
                        learner.getLearnerId(),
                        c.getCaseId()
                ),
                c.getCaseDoc(),
                c.getCaseDocName(),
                c.getCaseDocContentType(),
                c.getVerificationId(),
                c.getAuthOfficerRemarks(),
                c.getAuthOfficerId()
        );
    }

    // ✅ SAFE FILTER LOGIC (NO DB FUNCTION)
    private boolean matches(
            PublishedCaseEntity c,
            String q,
            String disease,
            String department
    ) {

        boolean matchQ = true;
        boolean matchDisease = true;
        boolean matchDepartment = true;

        if (q != null && !q.isBlank()) {
            String search = q.toLowerCase();

            matchQ =
                    safe(c.getCaseTitle()).contains(search) ||
                            safe(c.getCaseDescription()).contains(search) ||
                            safe(c.getCaseDisease()).contains(search) ||
                            safe(c.getCaseDepartment()).contains(search);
        }

        if (disease != null && !disease.isBlank()) {
            matchDisease =
                    safe(c.getCaseDisease()).equals(disease.toLowerCase());
        }

        if (department != null && !department.isBlank()) {
            matchDepartment =
                    safe(c.getCaseDepartment()).equals(department.toLowerCase());
        }

        return matchQ && matchDisease && matchDepartment;
    }

    private String safe(String val) {
        return val == null ? "" : val.toLowerCase();
    }

    private String resolveLearnerName(String learnerId) {
        if (learnerId == null || learnerId.isBlank()) {
            return "Learner";
        }
        return learnerRepository.findById(learnerId)
                .map(LearnerEntity::getName)
                .filter(name -> name != null && !name.isBlank())
                .orElse("Learner " + learnerId);
    }
}
