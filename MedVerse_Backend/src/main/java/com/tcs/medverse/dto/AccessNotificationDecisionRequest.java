package com.tcs.medverse.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class AccessNotificationDecisionRequest {

    @NotBlank(message = "Decision is required")
    private String decision;

    @JsonAlias({
            "canViewPreviousRecords",
            "allowPrevious",
            "allowPreviousRecords"
    })
    private Boolean allowPreviousMedicalRecords;

    private String rejectionReason;

    public AccessNotificationDecisionRequest() {
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public Boolean getAllowPreviousMedicalRecords() {
        return allowPreviousMedicalRecords;
    }

    public void setAllowPreviousMedicalRecords(Boolean allowPreviousMedicalRecords) {
        this.allowPreviousMedicalRecords = allowPreviousMedicalRecords;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}