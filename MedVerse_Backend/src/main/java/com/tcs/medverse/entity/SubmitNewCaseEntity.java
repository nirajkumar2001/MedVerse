package com.tcs.medverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

import java.util.Base64;
import java.util.UUID;

@Entity
@Table( name = "submit_new_case")
@Data
public class SubmitNewCaseEntity {

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

    public String getCaseTitle() {
        return caseTitle;
    }

    public void setCaseTitle(String caseTitle) {
        this.caseTitle = caseTitle;
    }

    public String getCaseDescription() {
        return caseDescription;
    }

    public void setCaseDescription(String caseDescription) {
        this.caseDescription = caseDescription;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getSubmittedDate() {
        return submittedDate;
    }

    public void setSubmittedDate(String submittedDate) {
        this.submittedDate = submittedDate;
    }

    public String getCaseDepartment() {
        return caseDepartment;
    }

    public void setCaseDepartment(String caseDepartment) {
        this.caseDepartment = caseDepartment;
    }

    public String getCaseDisease() {
        return caseDisease;
    }

    public void setCaseDisease(String caseDisease) {
        this.caseDisease = caseDisease;
    }

    public byte[] getCaseDoc() {
        if (caseDoc == null || caseDoc.isBlank()) {
            return null;
        }
        String raw = caseDoc;
        int commaIndex = raw.indexOf(',');
        if (raw.startsWith("data:") && commaIndex >= 0) {
            raw = raw.substring(commaIndex + 1);
        }
        return Base64.getDecoder().decode(raw);
    }

    public String getCaseDocData() {
        return caseDoc;
    }

    public void setCaseDoc(byte[] caseDoc) {
        this.caseDoc = caseDoc == null ? null : Base64.getEncoder().encodeToString(caseDoc);
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

    public String getAssignedOfficerId() {
        return assignedOfficerId;
    }

    public void setAssignedOfficerId(String assignedOfficerId) {
        this.assignedOfficerId = assignedOfficerId;
    }

    public String getAssignedOfficerName() {
        return assignedOfficerName;
    }

    public void setAssignedOfficerName(String assignedOfficerName) {
        this.assignedOfficerName = assignedOfficerName;
    }

    public String getAssignedOfficerDepartment() {
        return assignedOfficerDepartment;
    }

    public void setAssignedOfficerDepartment(String assignedOfficerDepartment) {
        this.assignedOfficerDepartment = assignedOfficerDepartment;
    }

    @Id
    @Column(name = "case_id")
    private String caseId;

    @Column(name = "learner_id")
    private String learnerId;

    @Column(name = "case_title", length = 255)
    private String caseTitle;

    @Column(name = "case_description")
    private String caseDescription;

    @Column(name = "approval_status", length = 50)
    private String approvalStatus;

    @Column(name = "submitted_date", length = 50)
    private String submittedDate;

    @Column(name = "case_department", length = 100)
    private String caseDepartment;

    @Column(name = "case_disease", length = 100)
    private String caseDisease;

    @Column(name = "case_doc", columnDefinition = "TEXT")
    private String caseDoc;

    @Column(name = "case_doc_name", length = 255)
    private String caseDocName;

    @Column(name = "case_doc_content_type", length = 100)
    private String caseDocContentType;

    @Column(name = "assigned_officer_id", length = 50)
    private String assignedOfficerId;

    @Column(name = "assigned_officer_name", length = 150)
    private String assignedOfficerName;

    @Column(name = "assigned_officer_department", length = 150)
    private String assignedOfficerDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", referencedColumnName = "learner_id", insertable = false, updatable = false)
    @JsonIgnore
    private LearnerEntity learner;

    @OneToOne(mappedBy = "submittedCase", fetch = FetchType.LAZY)
    @JsonIgnore
    private PublishedCaseEntity publishedCase;

    @PrePersist
    void ensureIds() {
        if (caseId == null || caseId.isBlank()) {
            caseId = UUID.randomUUID().toString();
        }
    }
}
