package com.tcs.medverse.repository;

import com.tcs.medverse.entity.AuditLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {}