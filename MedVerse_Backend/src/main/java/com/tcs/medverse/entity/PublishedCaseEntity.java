package com.tcs.medverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table( name = "published_case")
@Data
public class PublishedCaseEntity {

    @Id
    @Column(name = "case_id")
    private String caseId;

    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
    }

    public String getLearnerId() {
        return learnerId;
    }

    public void setLearnerId(String learnerId) {
        this.learnerId = learnerId;
    }

    public String getAuthOfficerId() {
        return authOfficerId;
    }

    public void setAuthOfficerId(String authOfficerId) {
        this.authOfficerId = authOfficerId;
    }

    public String getCaseTitle() {
        return caseTitle;
    }

    public void setCaseTitle(String caseTitle) {
        this.caseTitle = caseTitle;
    }

    public String getCaseDisease() {
        return caseDisease;
    }

    public void setCaseDisease(String caseDisease) {
        this.caseDisease = caseDisease;
    }

    public String getCaseDepartment() {
        return caseDepartment;
    }

    public void setCaseDepartment(String caseDepartment) {
        this.caseDepartment = caseDepartment;
    }

    public String getCaseDescription() {
        return caseDescription;
    }

    public void setCaseDescription(String caseDescription) {
        this.caseDescription = caseDescription;
    }

    public String getCaseDoc() {
        return caseDoc;
    }

    public void setCaseDoc(String caseDoc) {
        this.caseDoc = caseDoc;
    }

    public LocalDate getCaseSubmissionDate() {
        return caseSubmissionDate;
    }

    public void setCaseSubmissionDate(LocalDate caseSubmissionDate) {
        this.caseSubmissionDate = caseSubmissionDate;
    }

    public LocalDate getCaseReviewedDate() {
        return caseReviewedDate;
    }

    public SubmitNewCaseEntity getSubmittedCase() {
        return submittedCase;
    }

    public void setSubmittedCase(SubmitNewCaseEntity submittedCase) {
        this.submittedCase = submittedCase;
    }

    public LearnerEntity getLearner() {
        return learner;
    }

    public void setLearner(LearnerEntity learner) {
        this.learner = learner;
    }

    public AuthenticationOfficerProfile getAuthenticationOfficer() {
        return authenticationOfficer;
    }

    public void setAuthenticationOfficer(AuthenticationOfficerProfile authenticationOfficer) {
        this.authenticationOfficer = authenticationOfficer;
    }

    public List<PublishedCaseFeedbackEntity> getFeedbacks() {
        return feedbacks;
    }

    public void setFeedbacks(List<PublishedCaseFeedbackEntity> feedbacks) {
        this.feedbacks = feedbacks;
    }

    public List<BookmarkEntity> getBookmarks() {
        return bookmarks;
    }

    public void setBookmarks(List<BookmarkEntity> bookmarks) {
        this.bookmarks = bookmarks;
    }

    public void setCaseReviewedDate(LocalDate caseReviewedDate) {
        this.caseReviewedDate = caseReviewedDate;
    }

    public String getFeedbackId() {
        return feedbackId;
    }

    public void setFeedbackId(String feedbackId) {
        this.feedbackId = feedbackId;
    }

    public String getCaseDocName() {
        return caseDocName;
    }

    public void setCaseDocName(String caseDocName) {
        this.caseDocName = caseDocName;
    }

    public String getCaseDocContentType() {
        return caseDocContentType;
    }

    public void setCaseDocContentType(String caseDocContentType) {
        this.caseDocContentType = caseDocContentType;
    }

    public String getVerificationId() {
        return verificationId;
    }

    public void setVerificationId(String verificationId) {
        this.verificationId = verificationId;
    }

    public String getAuthOfficerRemarks() {
        return authOfficerRemarks;
    }

    public void setAuthOfficerRemarks(String authOfficerRemarks) {
        this.authOfficerRemarks = authOfficerRemarks;
    }

    @Column(name = "learner_id")
    private String learnerId;

    @Column(name = "auth_officer_id")
    private String authOfficerId;

    @Column(name = "case_title", length = 255)
    private String caseTitle;

    @Column(name = "case_disease", length = 100)
    private String caseDisease;

    @Column(name = "case_department", length = 100)
    private String caseDepartment;

    @Column(name = "case_description")
    private String caseDescription;

    @Column(name = "case_doc", columnDefinition = "TEXT")
    private String caseDoc;

    @Column(name = "case_doc_name", length = 255)
    private String caseDocName;

    @Column(name = "case_doc_content_type", length = 100)
    private String caseDocContentType;

    @Column(name = "case_submission_date")
    private LocalDate caseSubmissionDate;

    @Column(name = "case_reviewed_date")
    private LocalDate caseReviewedDate;

    @Column(name = "feedback_id", length = 50)
    private String feedbackId;

    @Column(name = "verification_id", length = 120)
    private String verificationId;

    @Column(name = "auth_officer_remarks", columnDefinition = "TEXT")
    private String authOfficerRemarks;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", referencedColumnName = "case_id", insertable = false, updatable = false)
    @JsonIgnore
    private SubmitNewCaseEntity submittedCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", referencedColumnName = "learner_id", insertable = false, updatable = false)
    @JsonIgnore
    private LearnerEntity learner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auth_officer_id", referencedColumnName = "auth_id", insertable = false, updatable = false)
    @JsonIgnore
    private AuthenticationOfficerProfile authenticationOfficer;

    @OneToMany(mappedBy = "publishedCase", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PublishedCaseFeedbackEntity> feedbacks;

    @OneToMany(mappedBy = "publishedCase", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BookmarkEntity> bookmarks;

}
