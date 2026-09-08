package com.tcs.medverse.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

import com.tcs.medverse.enums.Role;

@Entity
@Table(name = "auth_tokens")
@Data
public class AuthTokenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Signup auth;

    private String deviceRefId;
    private String refreshTokenHash;
    private LocalDateTime expiresAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Signup getAuth() {
        return auth;
    }

    public void setAuth(Signup auth) {
        this.auth = auth;
    }

    public String getDeviceRefId() {
        return deviceRefId;
    }

    public void setDeviceRefId(String deviceRefId) {
        this.deviceRefId = deviceRefId;
    }

    public String getRefreshTokenHash() {
        return refreshTokenHash;
    }

    public void setRefreshTokenHash(String refreshTokenHash) {
        this.refreshTokenHash = refreshTokenHash;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private Role role;
}