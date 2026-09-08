package com.tcs.medverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "published_case_feedback")
@Data
public class PublishedCaseFeedbackEntity {

    @Id
    @Column(name = "feedback_id")
    private String feedbackId;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "comment")
    private String comment;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "case_id")
    private String caseId;

    @Column(name = "learner_id")
    private String learnerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", referencedColumnName = "case_id", insertable = false, updatable = false)
    @JsonIgnore
    private PublishedCaseEntity publishedCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", referencedColumnName = "learner_id", insertable = false, updatable = false)
    @JsonIgnore
    private LearnerEntity learner;

    @PrePersist
    void ensureDefaults() {
        if (feedbackId == null || feedbackId.isBlank()) {
            feedbackId = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDate.now();
        }
    }
}