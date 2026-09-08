package com.tcs.medverse.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "access_notification")
public class AccessNotification {

    @Id
    @Column(name = "session_id", length = 50)
    private String sessionId;

    @Column(name = "patient_id")
    private String patientId;

    @Column(name = "doctor_id")
    private String doctorId;

    @Column(name = "doctor_name", length = 100)
    private String doctorName;

    @Column(name = "assigned_date")
    private LocalDateTime assignedDate;

    @Column(name = "access_status", length = 50)
    private String accessStatus;

    @Column(name = "consent_id", length = 50)
    private String consentId;

    @Column(name = "notification_type", length = 50)
    private String notificationType;

    @Column(name = "is_read")
    private Boolean read;

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    @Column(name = "request_message", columnDefinition = "TEXT")
    private String requestMessage;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "access_duration_days")
    private Integer accessDurationDays;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "revoked_by", length = 50)
    private String revokedBy;

    @Column(name = "reminder_count")
    private Integer reminderCount;

    @Column(name = "last_reminder_sent_at")
    private LocalDateTime lastReminderSentAt;

    @Column(name = "can_view_previous_records")
    private Boolean canViewPreviousRecords;

    @Column(name = "access_ended_at")
    private LocalDateTime accessEndedAt;

    @Column(name = "ended_by", length = 50)
    private String endedBy;

    @Column(name = "end_reason", columnDefinition = "TEXT")
    private String endReason;

    public AccessNotification() {
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

    public LocalDateTime getAssignedDate() {
        return assignedDate;
    }

    public void setAssignedDate(LocalDateTime assignedDate) {
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

    public LocalDateTime getNotifiedAt() {
        return notifiedAt;
    }

    public void setNotifiedAt(LocalDateTime notifiedAt) {
        this.notifiedAt = notifiedAt;
    }

    public String getRequestMessage() {
        return requestMessage;
    }

    public void setRequestMessage(String requestMessage) {
        this.requestMessage = requestMessage;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
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

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(LocalDateTime revokedAt) {
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

    public LocalDateTime getLastReminderSentAt() {
        return lastReminderSentAt;
    }

    public void setLastReminderSentAt(LocalDateTime lastReminderSentAt) {
        this.lastReminderSentAt = lastReminderSentAt;
    }

    public Boolean getCanViewPreviousRecords() {
        return canViewPreviousRecords;
    }

    public void setCanViewPreviousRecords(Boolean canViewPreviousRecords) {
        this.canViewPreviousRecords = canViewPreviousRecords;
    }

    public LocalDateTime getAccessEndedAt() {
        return accessEndedAt;
    }

    public void setAccessEndedAt(LocalDateTime accessEndedAt) {
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