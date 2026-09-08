package com.tcs.medverse.repository;

import com.tcs.medverse.entity.SubmitNewCaseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubmitNewCaseRepository extends JpaRepository<SubmitNewCaseEntity,String> {
    Page<SubmitNewCaseEntity> findByLearnerIdOrderByCaseIdDesc(String learnerId, Pageable pageable);

    long countByLearnerId(String learnerId);
    long countByLearnerIdAndApprovalStatusIgnoreCase(String learnerId, String approvalStatus);

    long countByApprovalStatusIgnoreCase(String approvalStatus);
    //String findById(String caseId);

    Page<SubmitNewCaseEntity> findByApprovalStatusIgnoreCaseOrderByCaseIdDesc(String approvalStatus, Pageable pageable);

    Page<SubmitNewCaseEntity> findAllByOrderByCaseIdDesc(Pageable pageable);

    Page<SubmitNewCaseEntity> findByCaseDepartmentIgnoreCaseOrderByCaseIdDesc(String caseDepartment, Pageable pageable);

    Page<SubmitNewCaseEntity> findByCaseDepartmentIgnoreCaseAndApprovalStatusIgnoreCaseOrderByCaseIdDesc(
            String caseDepartment,
            String approvalStatus,
            Pageable pageable
    );

}
