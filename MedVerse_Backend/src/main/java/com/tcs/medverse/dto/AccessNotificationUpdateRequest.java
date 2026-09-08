package com.tcs.medverse.dto;

public class AccessNotificationUpdateRequest {

    private String accessStatus;

    private String notificationType;

    private Boolean read;

    private String requestMessage;

    private String rejectionReason;

    private Integer accessDurationDays;

    private String revokedBy;

    private Boolean canViewPreviousRecords;

    public AccessNotificationUpdateRequest() {
    }

    public String getAccessStatus() {
        return accessStatus;
    }

    public void setAccessStatus(String accessStatus) {
        this.accessStatus = accessStatus;
    }

    public String getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(String notificationType) {
        this.notificationType = notificationType;
    }

    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
    }

    public String getRequestMessage() {
        return requestMessage;
    }

    public void setRequestMessage(String requestMessage) {
        this.requestMessage = requestMessage;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Integer getAccessDurationDays() {
        return accessDurationDays;
    }

    public void setAccessDurationDays(Integer accessDurationDays) {
        this.accessDurationDays = accessDurationDays;
    }

    public String getRevokedBy() {
        return revokedBy;
    }

    public void setRevokedBy(String revokedBy) {
        this.revokedBy = revokedBy;
    }

    public Boolean getCanViewPreviousRecords() {
        return canViewPreviousRecords;
    }

    public void setCanViewPreviousRecords(Boolean canViewPreviousRecords) {
        this.canViewPreviousRecords = canViewPreviousRecords;
    }
}