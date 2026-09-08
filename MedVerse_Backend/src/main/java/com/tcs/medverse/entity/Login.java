package com.tcs.medverse.entity;

import com.tcs.medverse.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "login")
@Getter
@Setter
public class Login {

    @Id
    @Column(name = "login_id", nullable = false, updatable = false, length = 36)
    private String loginId;

    @Column(name = "user_id", nullable = false, length = 8)
    private String userId;

    @Column(name = "auth_ref_id", nullable = false, length = 80)
    private String authRefId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private Role role;

    @Column(name = "device_ref_id", length = 80)
    private String deviceRefId;

    @Column(name = "login_status", nullable = false, length = 30)
    private String loginStatus;

    @Column(name = "login_at", nullable = false)
    private LocalDateTime loginAt;

    public String getLoginId() {
        return loginId;
    }

    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getAuthRefId() {
        return authRefId;
    }

    public void setAuthRefId(String authRefId) {
        this.authRefId = authRefId;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getDeviceRefId() {
        return deviceRefId;
    }

    public void setDeviceRefId(String deviceRefId) {
        this.deviceRefId = deviceRefId;
    }

    public String getLoginStatus() {
        return loginStatus;
    }

    public void setLoginStatus(String loginStatus) {
        this.loginStatus = loginStatus;
    }

    public LocalDateTime getLoginAt() {
        return loginAt;
    }

    public void setLoginAt(LocalDateTime loginAt) {
        this.loginAt = loginAt;
    }

    @PrePersist
    void onCreate() {
        if (loginId == null || loginId.isBlank()) {
            loginId = UUID.randomUUID().toString();
        }
        if (loginAt == null) {
            loginAt = LocalDateTime.now();
        }
    }
}