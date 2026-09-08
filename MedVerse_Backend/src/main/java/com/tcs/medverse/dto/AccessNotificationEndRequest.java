package com.tcs.medverse.dto;

public class AccessNotificationEndRequest {

    private String endedBy;
    private String endReason;

    public AccessNotificationEndRequest() {
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
