package com.tcs.medverse.repository;
import java.util.*;
import com.tcs.medverse.entity.CaseVerification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseVerificationRepository
        extends JpaRepository<CaseVerification, String> {

    List<CaseVerification> findByApprovalStatus(String status);

    Page<CaseVerification> findByAuth_AuthIdOrderByCaseEntity_CaseIdDesc(String authId, Pageable pageable);

    Page<CaseVerification> findByAuth_AuthIdAndApprovalStatusIgnoreCaseOrderByCaseEntity_CaseIdDesc(
            String authId,
            String approvalStatus,
            Pageable pageable
    );

    List<CaseVerification> findAllByCaseEntity_CaseId(String caseId);

    Optional<CaseVerification> findByCaseEntity_CaseId(String caseId);

    Optional<CaseVerification> findByCaseEntity_CaseIdAndAuth_AuthId(String caseId, String authId);

    void deleteByCaseEntity_CaseId(String caseId);
}
