package com.tcs.medverse.dto;

public class AccessNotificationResponse {

    private String sessionId;
    private String patientId;
    private String doctorId;
    private String doctorName;

    private String assignedDate;
    private String accessStatus;

    private String consentId;
    private String notificationType;
    private Boolean read;

    private String notifiedAt;
    private String requestMessage;

    private String respondedAt;
    private String rejectionReason;

    private Integer accessDurationDays;
    private String expiresAt;

    private String revokedAt;
    private String revokedBy;

    private Integer reminderCount;
    private String lastReminderSentAt;

    private Boolean canViewPreviousRecords;

    private String accessEndedAt;
    private String endedBy;
    private String endReason;

    public AccessNotificationResponse() {
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getAssignedDate() {
        return assignedDate;
    }

    public void setAssignedDate(String assignedDate) {
        this.assignedDate = assignedDate;
    }

    public String getAccessStatus() {
        return accessStatus;
    }

    public void setAccessStatus(String accessStatus) {
        this.accessStatus = accessStatus;
    }

    public String getConsentId() {
        return consentId;
    }

    public void setConsentId(String consentId) {
        this.consentId = consentId;
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

    public String getNotifiedAt() {
        return notifiedAt;
    }

    public void setNotifiedAt(String notifiedAt) {
        this.notifiedAt = notifiedAt;
    }

    public String getRequestMessage() {
        return requestMessage;
    }

    public void setRequestMessage(String requestMessage) {
        this.requestMessage = requestMessage;
    }

    public String getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(String respondedAt) {
        this.respondedAt = respondedAt;
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

    public String getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(String expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(String revokedAt) {
        this.revokedAt = revokedAt;
    }

    public String getRevokedBy() {
        return revokedBy;
    }

    public void setRevokedBy(String revokedBy) {
        this.revokedBy = revokedBy;
    }

    public Integer getReminderCount() {
        return reminderCount;
    }

    public void setReminderCount(Integer reminderCount) {
        this.reminderCount = reminderCount;
    }

    public String getLastReminderSentAt() {
        return lastReminderSentAt;
    }

    public void setLastReminderSentAt(String lastReminderSentAt) {
        this.lastReminderSentAt = lastReminderSentAt;
    }

    public Boolean getCanViewPreviousRecords() {
        return canViewPreviousRecords;
    }

    public void setCanViewPreviousRecords(Boolean canViewPreviousRecords) {
        this.canViewPreviousRecords = canViewPreviousRecords;
    }

    public String getAccessEndedAt() {
        return accessEndedAt;
    }

    public void setAccessEndedAt(String accessEndedAt) {
        this.accessEndedAt = accessEndedAt;
    }

    public String getEndedBy() {
        return endedBy;
    }

    public void setEndedBy(String endedBy) {
        this.endedBy = endedBy;
    }

    public String getEndReason() {
        return endReason;
    }

    public void setEndReason(String endReason) {
        this.endReason = endReason;
    }
}