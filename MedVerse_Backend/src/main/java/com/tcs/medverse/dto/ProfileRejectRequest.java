package com.tcs.medverse.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileRejectRequest {
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}