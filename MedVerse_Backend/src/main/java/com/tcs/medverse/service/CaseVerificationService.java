package com.tcs.medverse.service;

import com.tcs.medverse.dto.CaseVerificationDto;
import com.tcs.medverse.entity.AuthenticationOfficerProfile;
import com.tcs.medverse.entity.CaseVerification;
import com.tcs.medverse.entity.PublishedCaseEntity;
import com.tcs.medverse.entity.SubmitNewCaseEntity;
import com.tcs.medverse.exception.InvalidRemarksException;
import com.tcs.medverse.exception.OfficerNotFoundException;
import com.tcs.medverse.exception.RecordNotFoundException;
import com.tcs.medverse.repository.AuthenticationOfficerProfileRepository;
import com.tcs.medverse.repository.CaseVerificationRepository;
import com.tcs.medverse.repository.PublishedCaseRepository;
import com.tcs.medverse.repository.SignupRepository;
import com.tcs.medverse.repository.SubmitNewCaseRepository;
import com.tcs.medverse.entity.Signup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class CaseVerificationService {

    private final CaseVerificationRepository repo;
    private final AuthenticationOfficerProfileRepository officerRepo;
    private final SubmitNewCaseRepository caseRepo;
    private final PublishedCaseRepository publishedCaseRepo;
    private final SignupRepository signupRepository;

    public CaseVerificationService(CaseVerificationRepository repo,
                                   AuthenticationOfficerProfileRepository officerRepo,
                                   SubmitNewCaseRepository caseRepo,
                                   PublishedCaseRepository publishedCaseRepo,
                                   SignupRepository signupRepository) {
        this.repo = repo;
        this.officerRepo = officerRepo;
        this.caseRepo = caseRepo;
        this.publishedCaseRepo = publishedCaseRepo;
        this.signupRepository = signupRepository;
    }

    @Transactional
    public void createVerification(CaseVerificationDto dto) {
        SubmitNewCaseEntity caseEntity = caseRepo.findById(dto.getCaseId())
                .orElseThrow(() -> new RuntimeException("Case not found"));

        AuthenticationOfficerProfile auth = officerRepo.findById(dto.getAuthId())
                .orElseThrow(() -> new RuntimeException("Officer not found"));

        CaseVerification verification = new CaseVerification();
        verification.setVerificationId(
                dto.getVerificationId() == null || dto.getVerificationId().isBlank()
                        ? generateVerificationId(caseEntity.getCaseId())
                        : dto.getVerificationId()
        );
        verification.setCaseEntity(caseEntity);
        verification.setAuth(auth);
        verification.setApprovalStatus(
                dto.getApprovalStatus() == null || dto.getApprovalStatus().isBlank()
                        ? "UNDER_REVIEW"
                        : dto.getApprovalStatus()
        );
        verification.setRemarks(dto.getRemarks());

        repo.save(verification);
    }

    @Transactional(rollbackFor = {
            RecordNotFoundException.class,
            OfficerNotFoundException.class,
            InvalidRemarksException.class
    })
    public void verifyCase(String id, String status, String remarks)
            throws RecordNotFoundException, OfficerNotFoundException, InvalidRemarksException {
        verifyCase(id, status, remarks, null);
    }

    @Transactional(rollbackFor = {
            RecordNotFoundException.class,
            OfficerNotFoundException.class,
            InvalidRemarksException.class
    })
    public void verifyCase(String id, String status, String remarks, String authRefId)
            throws RecordNotFoundException, OfficerNotFoundException, InvalidRemarksException {

        validateRemarks(remarks);

        CaseVerification cv = repo.findById(id)
                .or(() -> repo.findByCaseEntity_CaseId(id))
                .orElseThrow(() -> new RecordNotFoundException("Verification not found"));

        if (!officerRepo.existsById(cv.getAuth().getAuthId())) {
            throw new OfficerNotFoundException("Officer not found");
        }

        if (authRefId != null && !authRefId.isBlank()) {
            Signup signup = resolveSignup(authRefId)
                    .orElseThrow(() -> new OfficerNotFoundException("Officer login not found"));
            if (!cv.getAuth().getAuthId().equals(signup.getUserId())) {
                throw new OfficerNotFoundException("This case is assigned to another authentication officer");
            }
        }

        cv.verify(status, remarks);

        SubmitNewCaseEntity submittedCase = cv.getCaseEntity();
        submittedCase.setApprovalStatus(status);
        caseRepo.save(submittedCase);

        repo.save(cv);
    }

    public SubmitNewCaseEntity getCaseDetails(String caseId) throws RecordNotFoundException {
        return caseRepo.findById(caseId)
                .orElseThrow(() -> new RecordNotFoundException("Case not found"));
    }

    public Page<SubmitNewCaseEntity> getSubmittedCasesByStatus(String status, int page, int size) {
        return caseRepo.findByApprovalStatusIgnoreCaseOrderByCaseIdDesc(status, PageRequest.of(page, size));
    }

    public Page<SubmitNewCaseEntity> getAllSubmittedCases(int page, int size) {
        return caseRepo.findAllByOrderByCaseIdDesc(PageRequest.of(page, size));
    }

    public Page<SubmitNewCaseEntity> getSubmittedCasesForOfficer(String authRefId, String status, int page, int size) {
        Signup signup = resolveSignup(authRefId)
                .orElseThrow(() -> new RuntimeException("Officer login not found"));
        AuthenticationOfficerProfile officer = officerRepo.findById(signup.getUserId())
                .orElseThrow(() -> new RuntimeException("Officer profile not found"));

        if (status == null || status.isBlank()) {
            Page<CaseVerification> assigned = repo.findByAuth_AuthIdOrderByCaseEntity_CaseIdDesc(
                    officer.getAuthId(),
                    PageRequest.of(page, size)
            );
            return toSubmittedCasePage(assigned);
        }

        Page<CaseVerification> assigned = repo.findByAuth_AuthIdAndApprovalStatusIgnoreCaseOrderByCaseEntity_CaseIdDesc(
                officer.getAuthId(),
                status,
                PageRequest.of(page, size)
        );
        return toSubmittedCasePage(assigned);
    }

    private Page<SubmitNewCaseEntity> toSubmittedCasePage(Page<CaseVerification> verifications) {
        List<SubmitNewCaseEntity> cases = verifications.getContent().stream()
                .map(CaseVerification::getCaseEntity)
                .toList();
        return new PageImpl<>(cases, verifications.getPageable(), verifications.getTotalElements());
    }

    public CaseVerificationDto getVerificationById(String id) throws RecordNotFoundException {
        CaseVerification cv = repo.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Not found"));
        return toDTO(cv);
    }

    @Transactional
    public void deleteVerification(String id) throws RecordNotFoundException {
        if (!repo.existsById(id)) {
            throw new RecordNotFoundException("Not found");
        }
        repo.deleteById(id);
    }

    public List<CaseVerificationDto> getByCaseId(String caseId) {
        return repo.findAllByCaseEntity_CaseId(caseId).stream()
                .map(this::toDTO)
                .toList();
    }

    public List<CaseVerificationDto> getByStatus(String status) {
        return repo.findByApprovalStatus(status).stream()
                .map(this::toDTO)
                .toList();
    }

    private java.util.Optional<Signup> resolveSignup(String principal) {
        if (principal == null || principal.isBlank()) {
            return java.util.Optional.empty();
        }
        return signupRepository.findByAuthRefId(principal)
                .or(() -> signupRepository.findByUserId(principal));
    }

    private void publishApprovedCase(CaseVerification cv, SubmitNewCaseEntity submittedCase) {
        PublishedCaseEntity publishedCase = new PublishedCaseEntity();
        publishedCase.setCaseId(submittedCase.getCaseId());
        publishedCase.setLearnerId(submittedCase.getLearnerId());
        publishedCase.setAuthOfficerId(cv.getAuth().getAuthId());
        publishedCase.setCaseTitle(submittedCase.getCaseTitle());
        publishedCase.setCaseDisease(submittedCase.getCaseDisease());
        publishedCase.setCaseDepartment(submittedCase.getCaseDepartment());
        publishedCase.setCaseDescription(submittedCase.getCaseDescription());
        publishedCase.setCaseDoc(submittedCase.getCaseDocData());
        publishedCase.setCaseDocName(submittedCase.getCaseDocName());
        publishedCase.setCaseDocContentType(submittedCase.getCaseDocContentType());
        publishedCase.setVerificationId(cv.getVerificationId());
        publishedCase.setAuthOfficerRemarks(cv.getRemarks());
        publishedCase.setFeedbackId(generateFeedbackId(submittedCase.getCaseId()));
        publishedCase.setCaseReviewedDate(LocalDate.now());
        if (publishedCase.getCaseSubmissionDate() == null) {
            publishedCase.setCaseSubmissionDate(LocalDate.now());
        }

        publishedCaseRepo.saveAndFlush(publishedCase);
    }

    private CaseVerificationDto toDTO(CaseVerification cv) {
        CaseVerificationDto dto = new CaseVerificationDto();
        dto.setVerificationId(toPublicVerificationId(cv));
        dto.setCaseId(cv.getCaseEntity().getCaseId());
        dto.setAuthId(cv.getAuth().getAuthId());
        dto.setApprovalStatus(cv.getApprovalStatus());
        dto.setRemarks(cv.getRemarks());
        return dto;
    }

    private void validateRemarks(String remarks) throws InvalidRemarksException {
        if (remarks == null || remarks.trim().isEmpty()) {
            throw new InvalidRemarksException("Remarks cannot be empty");
        }
        if (remarks.trim().length() < 3) {
            throw new InvalidRemarksException("Please enter at least 3 characters in remarks");
        }
    }

    private String generateVerificationId(String caseId) {
        String suffix = caseId == null || caseId.isBlank()
                ? UUID.randomUUID().toString().substring(0, 8).toUpperCase()
                : caseId.replaceFirst("^CASE-", "");
        String candidate = "VER-" + suffix;
        return candidate.length() > 120 ? candidate.substring(0, 120) : candidate;
    }

    private String generateFeedbackId(String caseId) {
        String suffix = caseId == null || caseId.isBlank()
                ? UUID.randomUUID().toString().substring(0, 8).toUpperCase()
                : caseId.replaceFirst("^CASE-", "");
        String candidate = "FDBK-" + suffix;
        return candidate.length() > 50 ? candidate.substring(0, 50) : candidate;
    }

    private String toPublicVerificationId(CaseVerification cv) {
        if (cv == null) {
            return null;
        }
        String verificationId = cv.getVerificationId();
        if (verificationId == null
                || verificationId.isBlank()
                || verificationId.startsWith("VER_")
                || verificationId.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")) {
            return generateVerificationId(cv.getCaseEntity() == null ? null : cv.getCaseEntity().getCaseId());
        }
        return verificationId;
    }
}
