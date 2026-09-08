package com.tcs.medverse.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "case_verification")
public class CaseVerification {

    @Id
    @Column(name = "verification_id")
    private String verificationId;

    // ✅ Relation with SubmitNewCase
    @OneToOne
    @JoinColumn(name = "case_id", referencedColumnName = "case_id", nullable = false)
    private SubmitNewCaseEntity caseEntity;

    // ✅ Relation with AuthenticationOfficer
    @ManyToOne
    @JoinColumn(name = "auth_id", referencedColumnName = "auth_id", nullable = false)
    private AuthenticationOfficerProfile auth;

    @Column(name = "approval_status")
    private String approvalStatus = "PENDING";

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "verified_date")
    private LocalDateTime verifiedDate;

    // ✅ Business logic
    public void verify(String status, String remarks) {
        this.approvalStatus = status;
        this.remarks = remarks;
        this.verifiedDate = LocalDateTime.now();
    }

    // ✅ Getters
    public String getVerificationId() { return verificationId; }
    public SubmitNewCaseEntity getCaseEntity() { return caseEntity; }
    public AuthenticationOfficerProfile getAuth() { return auth; }
    public String getApprovalStatus() { return approvalStatus; }
    public String getRemarks() { return remarks; }
    public LocalDateTime getVerifiedDate() { return verifiedDate; }

    // ✅ Setters
    public void setVerificationId(String verificationId) { this.verificationId = verificationId; }
    public void setCaseEntity(SubmitNewCaseEntity caseEntity) { this.caseEntity = caseEntity; }
    public void setAuth(AuthenticationOfficerProfile auth) { this.auth = auth; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public void setVerifiedDate(LocalDateTime verifiedDate) { this.verifiedDate = verifiedDate; }
}