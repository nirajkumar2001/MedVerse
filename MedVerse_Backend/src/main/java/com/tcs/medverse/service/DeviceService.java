package com.tcs.medverse.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import com.tcs.medverse.dto.response.DeviceRegisterResp;
import com.tcs.medverse.dto.request.DeviceRegisterRequest;
import com.tcs.medverse.entity.DeviceInfoEntity;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.repository.DeviceInfoRepository;
import com.tcs.medverse.exception.DeviceLimitExceededException;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceInfoRepository repo;

    public DeviceRegisterResp register(DeviceRegisterRequest r) {

        DeviceInfoEntity d = repo.findByDeviceId(r.deviceId()).orElse(new DeviceInfoEntity());

        if(r.deviceId().equals(d.getDeviceId())){
            return new DeviceRegisterResp(d.getDeviceRefId());
        }

        d.setDeviceRefId("DEVICE_" + UUID.randomUUID());
        d.setDeviceId(r.deviceId());
        d.setDeviceType(r.deviceType());
        d.setDeviceModel(r.deviceModel());
        d.setOsVersion(r.osVersion());
        d.setAppVersion(r.appVersion());
        d.setLocationPermission(r.locationPermission());
        d.setLatitude(r.latitude());
        d.setLongitude(r.longitude());
        d.setIpAddress(r.ipAddress());
        d.setCreatedAt(LocalDateTime.now());
        repo.save(d);

        return new DeviceRegisterResp(d.getDeviceRefId());
    }

    public DeviceRegisterResp registerWithAuth(DeviceRegisterRequest r, Signup auth) {
        // Check device limit

        long currentDeviceCount = repo.countByAuth_Id((auth.getId()));
        System.out.println("[DeviceService] Current device count for auth " + auth.getId() + ": " + currentDeviceCount);
        System.out.println("[DeviceService] Attempting to register deviceId: " + r.deviceId());

        DeviceInfoEntity existingDevice = repo.findByDeviceId(r.deviceId()).orElse(null);
        System.out.println("[DeviceService] Existing device found: " + (existingDevice != null));

        // If device exists and already associated with this user, return existing
        if (existingDevice != null && existingDevice.getAuth() != null
                && existingDevice.getAuth().getId().equals(auth.getId())) {
            System.out.println("[DeviceService] Device already associated with this user, returning existing");
            return new DeviceRegisterResp(existingDevice.getDeviceRefId());
        }

        // If device exists but associated with different user, remove old association
        if (existingDevice != null && existingDevice.getAuth() != null) {
            System.out.println("[DeviceService] Device associated with different user, removing old association");
            existingDevice.setAuth(null);
            repo.save(existingDevice);
            currentDeviceCount--;
        }

        // Check device limit for new association (max 3 devices)
        if (existingDevice == null || existingDevice.getAuth() == null) {
            System.out.println("[DeviceService] Checking device limit. Current count: " + currentDeviceCount);
            if (currentDeviceCount >= 3) {
                System.out.println("[DeviceService] DEVICE LIMIT EXCEEDED! Throwing exception");
                // Throw a special exception type for device limit
                throw new DeviceLimitExceededException(
                        "Maximum 3 devices allowed per user",
                        "Please logout from another device to continue"
                );
            }
        }

        // Create or update device
        DeviceInfoEntity device = existingDevice != null ? existingDevice : new DeviceInfoEntity();

        if (device.getDeviceRefId() == null) {
            device.setDeviceRefId("DEVICE_" + UUID.randomUUID());
        }

        device.setDeviceId(r.deviceId());
        device.setDeviceType(r.deviceType());
        device.setDeviceModel(r.deviceModel());
        device.setOsVersion(r.osVersion());
        device.setAppVersion(r.appVersion());
        device.setLocationPermission(r.locationPermission());
        device.setLatitude(r.latitude());
        device.setLongitude(r.longitude());
        device.setIpAddress(r.ipAddress());
        device.setAuth(auth);
        device.setCreatedAt(device.getCreatedAt() != null ? device.getCreatedAt() : LocalDateTime.now());

        repo.save(device);

        return new DeviceRegisterResp(device.getDeviceRefId());
    }

    public boolean isValidDevice(String authRefId, String deviceRefId) {
        return repo.existsByDeviceRefIdAndAuth_AuthRefId(deviceRefId, authRefId);
    }

    @Transactional
    public void deleteDeviceByRefId(String deviceRefId) {
        repo.deleteByDeviceRefId(deviceRefId);
    }
}