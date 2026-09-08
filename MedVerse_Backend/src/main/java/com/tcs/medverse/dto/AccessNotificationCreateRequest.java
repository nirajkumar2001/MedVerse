package com.tcs.medverse.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class AccessNotificationCreateRequest {

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    private String consentId;

    private String requestMessage;

    @Positive(message = "Access duration must be positive")
    private Integer accessDurationDays;

    private Boolean canViewPreviousRecords;

    public AccessNotificationCreateRequest() {
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getConsentId() {
        return consentId;
    }

    public void setConsentId(String consentId) {
        this.consentId = consentId;
    }

    public String getRequestMessage() {
        return requestMessage;
    }

    public void setRequestMessage(String requestMessage) {
        this.requestMessage = requestMessage;
    }

    public Integer getAccessDurationDays() {
        return accessDurationDays;
    }

    public void setAccessDurationDays(Integer accessDurationDays) {
        this.accessDurationDays = accessDurationDays;
    }

    public Boolean getCanViewPreviousRecords() {
        return canViewPreviousRecords;
    }

    public void setCanViewPreviousRecords(Boolean canViewPreviousRecords) {
        this.canViewPreviousRecords = canViewPreviousRecords;
    }
}