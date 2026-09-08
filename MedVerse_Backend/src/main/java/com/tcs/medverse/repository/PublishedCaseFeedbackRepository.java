package com.tcs.medverse.repository;

import com.tcs.medverse.entity.PublishedCaseFeedbackEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PublishedCaseFeedbackRepository extends JpaRepository<PublishedCaseFeedbackEntity, String> {
    List<PublishedCaseFeedbackEntity> findByCaseIdOrderByCreatedAtDesc(String caseId);
    List<PublishedCaseFeedbackEntity> findByLearnerIdOrderByCreatedAtDesc(String learnerId);
    void deleteByCaseId(String caseId);
}
