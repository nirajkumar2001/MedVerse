package com.tcs.medverse.repository;

import com.tcs.medverse.entity.BookmarkEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<BookmarkEntity, String> {
    Page<BookmarkEntity> findByLearnerIdOrderByCreatedAtDesc(String learnerId, Pageable pageable);
    boolean existsByLearnerIdAndCaseId(String learnerId, String caseId);
    Optional<BookmarkEntity> findByLearnerIdAndCaseId(String learnerId, String caseId);
    long countByLearnerId(String learnerId);
    long countByLearnerIdAndCreatedAtAfter(String learnerId, LocalDateTime createdAt);
    void deleteByCaseId(String caseId);
}
