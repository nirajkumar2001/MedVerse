package com.tcs.medverse.service;

import com.tcs.medverse.entity.AuditLogEntity;
import com.tcs.medverse.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;



@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repo;

    public void log(String authRefId, String deviceRefId, String action) {
        AuditLogEntity log = new AuditLogEntity();
        log.setAuthRefId(authRefId);
        log.setDeviceRefId(deviceRefId);
        log.setAction(action);
        log.setCreatedAt(LocalDateTime.now());
        repo.save(log);
    }
}