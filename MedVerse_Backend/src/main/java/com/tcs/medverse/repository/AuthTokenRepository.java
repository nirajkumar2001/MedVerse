package com.tcs.medverse.repository;

import com.tcs.medverse.entity.AuthTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthTokenEntity, Long> {

    Optional<AuthTokenEntity> findByRefreshTokenHash(String hash);

    List<AuthTokenEntity> findByExpiresAtAfter(LocalDateTime now);

    void deleteByAuth_AuthRefIdAndDeviceRefId(String authRefId, String deviceRefId);
}