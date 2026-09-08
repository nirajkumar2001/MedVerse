package com.tcs.medverse.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

import com.tcs.medverse.entity.DeviceInfoEntity;

public interface DeviceInfoRepository extends JpaRepository<DeviceInfoEntity, Long> {
    Optional<DeviceInfoEntity> findByDeviceRefId(String deviceRefId);
    Optional<DeviceInfoEntity> findByDeviceId(String deviceId);
    long countByAuth_Id(String authId);
    boolean existsByDeviceRefIdAndAuth_AuthRefId(String deviceRefId, String authRefId);

    // Device cleanup methods
    void deleteByDeviceRefId(String deviceRefId);
    void deleteByAuth_IdAndDeviceRefId(String authId, String deviceRefId);

    // Find all devices for a user
    List<DeviceInfoEntity> findByAuth_Id(String authId);
}



// These are the main “DB function types” you can use:

// Category	Prefix
// Read	findBy, getBy, readBy, queryBy
// Count	countBy
// Exists	existsBy
// Delete	deleteBy, removeBy

// findByDeviceRefId(String ref)
// countByAuth_Id(Long authId)
// existsByMobile(String mobile)
// deleteByAuth_Id(Long authId)

// countByAuth_Id(Long authId) - SELECT COUNT(*) FROM device_info WHERE auth_id = ? -- auth is coulumn referencing AuthDetailsEntity and id is its primary key

// findByAuth_Mobile(String mobile)
// findByAuth_Status(AuthStatus status)