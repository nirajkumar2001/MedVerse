package com.tcs.medverse.entity;

import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "profile_manage")
public class ProfileManage {

    @Id
    @Column(name = "user_id", nullable = false, length = 8)
    private String userId;

    @Column(name = "signup_id", nullable = false, length = 36)
    private String signupId;

    @Column(name = "auth_ref_id", nullable = false, length = 80)
    private String authRefId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private AuthStatus status;

    @Column(name = "document_name", length = 255)
    private String documentName;

    @Column(name = "document_content_type", length = 100)
    private String documentContentType;

    @Column(name = "document_data", columnDefinition = "TEXT")
    private String documentData;

    @Column(name = "review_remark", length = 1000)
    private String reviewRemark;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_count", nullable = false, columnDefinition = "integer default 0")
    private int rejectionCount;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
        updatedAt = submittedAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getSignupId() { return signupId; }
    public void setSignupId(String signupId) { this.signupId = signupId; }
    public String getAuthRefId() { return authRefId; }
    public void setAuthRefId(String authRefId) { this.authRefId = authRefId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public AuthStatus getStatus() { return status; }
    public void setStatus(AuthStatus status) { this.status = status; }
    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }
    public String getDocumentContentType() { return documentContentType; }
    public void setDocumentContentType(String documentContentType) { this.documentContentType = documentContentType; }
    public String getDocumentData() { return documentData; }
    public void setDocumentData(String documentData) { this.documentData = documentData; }
    public String getReviewRemark() { return reviewRemark; }
    public void setReviewRemark(String reviewRemark) { this.reviewRemark = reviewRemark; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public int getRejectionCount() { return rejectionCount; }
    public void setRejectionCount(int rejectionCount) { this.rejectionCount = rejectionCount; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
