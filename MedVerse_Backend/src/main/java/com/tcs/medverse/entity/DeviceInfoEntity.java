package com.tcs.medverse.entity;

import com.tcs.medverse.enums.LocationPermission;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "device_info")
@Data
public class DeviceInfoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDeviceRefId() {
        return deviceRefId;
    }

    public void setDeviceRefId(String deviceRefId) {
        this.deviceRefId = deviceRefId;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }

    public String getDeviceModel() {
        return deviceModel;
    }

    public void setDeviceModel(String deviceModel) {
        this.deviceModel = deviceModel;
    }

    public String getOsVersion() {
        return osVersion;
    }

    public void setOsVersion(String osVersion) {
        this.osVersion = osVersion;
    }

    public String getAppVersion() {
        return appVersion;
    }

    public void setAppVersion(String appVersion) {
        this.appVersion = appVersion;
    }

    public LocationPermission getLocationPermission() {
        return locationPermission;
    }

    public void setLocationPermission(LocationPermission locationPermission) {
        this.locationPermission = locationPermission;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public Signup getAuth() {
        return auth;
    }

    public void setAuth(Signup auth) {
        this.auth = auth;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Column(unique = true)
    private String deviceRefId;

    @Column(unique = true)
    private String deviceId;

    private String deviceType;
    private String deviceModel;
    private String osVersion;
    private String appVersion;

    @Enumerated(EnumType.STRING)
    private LocationPermission locationPermission;

    private Double latitude;
    private Double longitude;
    private String ipAddress;

    @ManyToOne
    private Signup auth;

    private LocalDateTime createdAt;
}