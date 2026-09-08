package com.tcs.medverse.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;



@Entity
@Table(name = "audit_logs")
@Data
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAuthRefId() {
        return authRefId;
    }

    public void setAuthRefId(String authRefId) {
        this.authRefId = authRefId;
    }

    public String getDeviceRefId() {
        return deviceRefId;
    }

    public void setDeviceRefId(String deviceRefId) {
        this.deviceRefId = deviceRefId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    private String authRefId;
    private String deviceRefId;
    private String action;
    private LocalDateTime createdAt;
}