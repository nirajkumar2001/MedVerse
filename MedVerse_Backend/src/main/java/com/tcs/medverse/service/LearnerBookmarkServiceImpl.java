package com.tcs.medverse.service;

import com.tcs.medverse.dto.response.LearnerBookmarkResponse;
import com.tcs.medverse.dto.response.PageResponse;
import com.tcs.medverse.entity.BookmarkEntity;
import com.tcs.medverse.entity.LearnerEntity;
import com.tcs.medverse.entity.PublishedCaseEntity;
import com.tcs.medverse.repository.BookmarkRepository;
import com.tcs.medverse.repository.PublishedCaseRepository;
import com.tcs.medverse.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LearnerBookmarkServiceImpl implements LearnerBookmarkService {

    private static final DateTimeFormatter SAVED_ON_FMT =
            DateTimeFormatter.ofPattern("dd MMMM yyyy");

    private final LearnerContextService learnerContextService;
    private final BookmarkRepository bookmarkRepository;
    private final PublishedCaseRepository publishedCaseRepository;

    @Override
    public PageResponse<LearnerBookmarkResponse> listMyBookmarks(String authRefId, int page, int size) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);

        Page<BookmarkEntity> result = bookmarkRepository.findByLearnerIdOrderByCreatedAtDesc(
                learner.getLearnerId(),
                PageRequest.of(page, size)
        );

        List<LearnerBookmarkResponse> content = result.getContent().stream()
                .map(b -> {
                    PublishedCaseEntity c = publishedCaseRepository.findById(b.getCaseId()).orElse(null);
                    return toResponse(b, c);
                })
                .toList();

        return new PageResponse<>(content, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }
    //@override
    public LearnerBookmarkResponse addBookmark(String authRefId, String caseId) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);
        PublishedCaseEntity publishedCase = publishedCaseRepository.findById(caseId)
                .orElseThrow(() -> new NotFoundException("Only published cases can be bookmarked"));

        BookmarkEntity existing = bookmarkRepository.findByLearnerIdAndCaseId(learner.getLearnerId(), caseId).orElse(null);
        if (existing != null) {
            return toResponse(existing, publishedCase);
        }

        BookmarkEntity entity = new BookmarkEntity();
        entity.setLearnerId(learner.getLearnerId());
        entity.setCaseId(caseId);
        entity.setCreatedAt(LocalDateTime.now());
        entity = bookmarkRepository.save(entity);

        return toResponse(entity, publishedCase);
    }

    private LearnerBookmarkResponse toResponse(BookmarkEntity entity, PublishedCaseEntity c) {
        return new LearnerBookmarkResponse(
                entity.getBookmarkId(),
                entity.getCaseId(),
                c == null ? null : c.getCaseTitle(),
                c == null ? null : c.getCaseDepartment(),
                c == null ? null : c.getCaseDescription(),
                c == null ? null : c.getCaseDoc(),
                entity.getCreatedAt() == null ? null : entity.getCreatedAt().format(SAVED_ON_FMT),
                entity.getCreatedAt() == null ? null : entity.getCreatedAt().toString()
        );
    }

    @Override
    public void removeBookmark(String authRefId, String caseId) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);

        BookmarkEntity existing = bookmarkRepository.findByLearnerIdAndCaseId(learner.getLearnerId(), caseId)
                .orElseThrow(() -> {
                    throw new NotFoundException("Bookmark not found");
                });

        bookmarkRepository.delete(existing);
    }

    @Override
    public boolean isBookmarked(String authRefId, String caseId) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);
        return bookmarkRepository.existsByLearnerIdAndCaseId(learner.getLearnerId(), caseId);
    }
}
