package com.tcs.medverse.service;

import com.tcs.medverse.dto.request.LearnerSubmitCaseRequest;
import com.tcs.medverse.dto.response.LearnerSubmissionDetailResponse;
import com.tcs.medverse.dto.response.LearnerSubmissionResponse;
import com.tcs.medverse.dto.response.PageResponse;
import com.tcs.medverse.entity.LearnerEntity;
import com.tcs.medverse.entity.AuthenticationOfficerProfile;
import com.tcs.medverse.entity.CaseVerification;
import com.tcs.medverse.entity.PublishedCaseEntity;
import com.tcs.medverse.entity.SubmitNewCaseEntity;
import com.tcs.medverse.repository.AuthenticationOfficerProfileRepository;
import com.tcs.medverse.repository.BookmarkRepository;
import com.tcs.medverse.repository.CaseVerificationRepository;
import com.tcs.medverse.repository.PublishedCaseFeedbackRepository;
import com.tcs.medverse.repository.PublishedCaseRepository;
import com.tcs.medverse.repository.SubmitNewCaseRepository;
import com.tcs.medverse.exception.ForbiddenException;
import com.tcs.medverse.exception.BadRequestException;
import com.tcs.medverse.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LearnerCaseServiceImpl implements LearnerCaseService {

    private static final DateTimeFormatter SUBMITTED_DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private static final DateTimeFormatter CASE_ID_TS_FMT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final LearnerContextService learnerContextService;
    private final SubmitNewCaseRepository submitNewCaseRepository;
    private final AuthenticationOfficerProfileRepository officerRepository;
    private final CaseVerificationRepository caseVerificationRepository;
    private final PublishedCaseRepository publishedCaseRepository;
    private final BookmarkRepository bookmarkRepository;
    private final PublishedCaseFeedbackRepository feedbackRepository;

    private static final Map<String, String> DEPARTMENTS = new LinkedHashMap<>();
    private static final Random RANDOM = new Random();

    static {
        DEPARTMENTS.put("cardiology", "Cardiology");
        DEPARTMENTS.put("pulmonology", "Pulmonology");
        DEPARTMENTS.put("neurology", "Neurology");
        DEPARTMENTS.put("gastroenterology", "Gastroenterology");
        DEPARTMENTS.put("dermatology", "Dermatology");
        DEPARTMENTS.put("pediatrics", "Pediatrics");
        DEPARTMENTS.put("orthopedics", "Orthopedics");
        DEPARTMENTS.put("oncology", "Oncology");
        DEPARTMENTS.put("general", "General Medicine");
        DEPARTMENTS.put("endocrinology", "Endocrinology");
        DEPARTMENTS.put("nephrology", "Nephrology");
        DEPARTMENTS.put("gynecology", "Gynecology");
        DEPARTMENTS.put("psychiatry", "Psychiatry");
        DEPARTMENTS.put("ent", "ENT (Ear, Nose & Throat)");
        DEPARTMENTS.put("ophthalmology", "Ophthalmology");
    }

    @Override
    @Transactional
    public LearnerSubmissionDetailResponse submitCase(String authRefId, LearnerSubmitCaseRequest request) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);
        String department = normalizeDepartment(request.caseDepartment());

        SubmitNewCaseEntity entity = new SubmitNewCaseEntity();
        entity.setCaseId(generateCaseId(learner.getLearnerId()));
        entity.setLearnerId(learner.getLearnerId());
        entity.setCaseTitle(fit(request.caseTitle(), 255));
        entity.setCaseDescription(request.caseDescription());
        entity.setCaseDepartment(department);
        entity.setCaseDisease(fit(request.caseDisease(), 100));
        entity.setCaseDoc(request.caseDocBase64());
        entity.setCaseDocName(fit(request.caseDocName(), 255));
        entity.setCaseDocContentType(fit(normalizeContentType(request.caseDocContentType()), 100));
        entity.setApprovalStatus("UNDER_REVIEW");
        entity.setSubmittedDate(LocalDateTime.now().format(SUBMITTED_DATE_FMT));

        entity = submitNewCaseRepository.save(entity);
        CaseVerification verification = assignDepartmentOfficer(entity);

        return new LearnerSubmissionDetailResponse(
                entity.getCaseId(),
                entity.getCaseTitle(),
                entity.getCaseDescription(),
                entity.getCaseDisease(),
                entity.getCaseDepartment(),
                entity.getApprovalStatus(),
                entity.getSubmittedDate(),
                entity.getCaseDoc(),
                entity.getCaseDocName(),
                entity.getCaseDocContentType(),
                getLatestRemarks(entity.getCaseId()),
                isPublished(entity.getCaseId()),
                toPublicVerificationId(verification, entity.getCaseId()),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getAuthId(),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getName(),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getSpecialization()
        );
    }

    private CaseVerification assignDepartmentOfficer(SubmitNewCaseEntity submittedCase) {
        if (submittedCase.getCaseDepartment() == null || submittedCase.getCaseDepartment().isBlank()) {
            return null;
        }

        List<String> variants = departmentVariants(submittedCase.getCaseDepartment());
        List<AuthenticationOfficerProfile> officers =
                officerRepository.findApprovedOfficersByDepartmentVariants(variants);
        if (officers.isEmpty()) {
            // Fallback to tolerant in-memory match for specializations like
            // "Department of Cardiology", "Cardiology Unit", etc.
            officers = officerRepository.findAllApprovedOfficers().stream()
                    .filter(officer -> matchesDepartment(officer.getSpecialization(), variants))
                    .toList();
        }
        if (officers.isEmpty()) {
            throw new BadRequestException("No approved authentication officer is available for " + submittedCase.getCaseDepartment());
        }

        var existingVerification = caseVerificationRepository.findByCaseEntity_CaseId(submittedCase.getCaseId());
        if (existingVerification.isPresent()) {
            CaseVerification existing = existingVerification.get();
            if (existing.getAuth() != null) {
                submittedCase.setAssignedOfficerId(existing.getAuth().getAuthId());
                submittedCase.setAssignedOfficerName(existing.getAuth().getName());
                submittedCase.setAssignedOfficerDepartment(existing.getAuth().getSpecialization());
                submitNewCaseRepository.save(submittedCase);
            }
            return existing;
        }

        AuthenticationOfficerProfile officer = officers.get(RANDOM.nextInt(officers.size()));
        submittedCase.setAssignedOfficerId(officer.getAuthId());
        submittedCase.setAssignedOfficerName(officer.getName());
        submittedCase.setAssignedOfficerDepartment(officer.getSpecialization());
        submitNewCaseRepository.save(submittedCase);

        CaseVerification verification = new CaseVerification();
        verification.setVerificationId(generateVerificationId(submittedCase.getCaseId()));
        verification.setCaseEntity(submittedCase);
        verification.setAuth(officer);
        verification.setApprovalStatus("UNDER_REVIEW");
        verification.setRemarks(null);
        return caseVerificationRepository.save(verification);
    }

    private boolean matchesDepartment(String specialization, List<String> variants) {
        if (specialization == null || specialization.isBlank()) {
            return false;
        }
        String normalizedSpecialization = normalizeKey(specialization);
        String lowercaseSpecialization = specialization.trim().toLowerCase(Locale.ROOT);
        for (String variant : variants) {
            if (normalizedSpecialization.equals(variant)
                    || lowercaseSpecialization.equals(variant)
                    || lowercaseSpecialization.contains(variant)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public PageResponse<LearnerSubmissionResponse> listMySubmissions(String authRefId, int page, int size) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);

        Page<SubmitNewCaseEntity> result = submitNewCaseRepository.findByLearnerIdOrderByCaseIdDesc(
                learner.getLearnerId(),
                PageRequest.of(page, size)
        );

        List<LearnerSubmissionResponse> content = result.getContent().stream()
                .map(c -> {
                    CaseVerification verification = caseVerificationRepository.findByCaseEntity_CaseId(c.getCaseId()).orElse(null);
                    return new LearnerSubmissionResponse(
                            c.getCaseId(),
                            c.getCaseTitle(),
                            c.getCaseDisease(),
                            c.getCaseDepartment(),
                            c.getApprovalStatus(),
                            c.getSubmittedDate(),
                            verification == null ? "" : safeString(verification.getRemarks()),
                            isPublished(c.getCaseId()),
                            toPublicVerificationId(verification, c.getCaseId())
                    );
                })
                .toList();

        return new PageResponse<>(content, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Override
    public LearnerSubmissionDetailResponse getMySubmission(String authRefId, String caseId) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);

        SubmitNewCaseEntity entity = submitNewCaseRepository.findById(caseId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));

        if (!learner.getLearnerId().equals(entity.getLearnerId())) {
            throw new ForbiddenException("Not your submission");
        }

        CaseVerification verification = caseVerificationRepository.findByCaseEntity_CaseId(entity.getCaseId()).orElse(null);
        return new LearnerSubmissionDetailResponse(
                entity.getCaseId(),
                entity.getCaseTitle(),
                entity.getCaseDescription(),
                entity.getCaseDisease(),
                entity.getCaseDepartment(),
                entity.getApprovalStatus(),
                entity.getSubmittedDate(),
                entity.getCaseDoc(),
                entity.getCaseDocName(),
                entity.getCaseDocContentType(),
                getLatestRemarks(entity.getCaseId()),
                isPublished(entity.getCaseId()),
                toPublicVerificationId(verification, entity.getCaseId()),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getAuthId(),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getName(),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getSpecialization()
        );
    }

    @Override
    @Transactional
    public LearnerSubmissionDetailResponse resubmitCase(String authRefId, String caseId, LearnerSubmitCaseRequest request) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);
        String department = normalizeDepartment(request.caseDepartment());

        SubmitNewCaseEntity entity = submitNewCaseRepository.findById(caseId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));


        if (!learner.getLearnerId().equals(entity.getLearnerId())) {
            throw new ForbiddenException("Not your submission");
        }

        if (entity.getApprovalStatus() == null || !entity.getApprovalStatus().equalsIgnoreCase("REJECTED")) {
            throw new BadRequestException("Only REJECTED submissions can be edited & resubmitted");
        }

        entity.setCaseTitle(fit(request.caseTitle(), 255));
        entity.setCaseDescription(request.caseDescription());
        entity.setCaseDepartment(department);
        entity.setCaseDisease(fit(request.caseDisease(), 100));
        if (request.caseDocBase64() != null) {
            entity.setCaseDoc(request.caseDocBase64());
            entity.setCaseDocName(fit(request.caseDocName(), 255));
            entity.setCaseDocContentType(fit(normalizeContentType(request.caseDocContentType()), 100));
        }
        entity.setApprovalStatus("UNDER_REVIEW");
        entity.setSubmittedDate(LocalDateTime.now().format(SUBMITTED_DATE_FMT));

        entity = submitNewCaseRepository.save(entity);
        resetVerificationForResubmission(entity);
        CaseVerification verification = assignDepartmentOfficer(entity);

        return new LearnerSubmissionDetailResponse(
                entity.getCaseId(),
                entity.getCaseTitle(),
                entity.getCaseDescription(),
                entity.getCaseDisease(),
                entity.getCaseDepartment(),
                entity.getApprovalStatus(),
                entity.getSubmittedDate(),
                entity.getCaseDoc(),
                entity.getCaseDocName(),
                entity.getCaseDocContentType(),
                getLatestRemarks(entity.getCaseId()),
                isPublished(entity.getCaseId()),
                toPublicVerificationId(verification, entity.getCaseId()),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getAuthId(),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getName(),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getSpecialization()
        );
    }

    @Override
    @Transactional
    public void deletePendingSubmission(String authRefId, String caseId) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);

        SubmitNewCaseEntity entity = submitNewCaseRepository.findById(caseId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));

        if (!learner.getLearnerId().equals(entity.getLearnerId())) {
            throw new ForbiddenException("Not your submission");
        }

        if (publishedCaseRepository.existsById(entity.getCaseId())) {
            feedbackRepository.deleteByCaseId(entity.getCaseId());
            bookmarkRepository.deleteByCaseId(entity.getCaseId());
            publishedCaseRepository.deleteById(entity.getCaseId());
        }

        caseVerificationRepository.deleteByCaseEntity_CaseId(entity.getCaseId());
        submitNewCaseRepository.delete(entity);
    }

    @Override
    @Transactional
    public LearnerSubmissionDetailResponse publishApprovedSubmission(String authRefId, String caseId) {
        LearnerEntity learner = learnerContextService.getOrCreateLearnerForAuth(authRefId);

        SubmitNewCaseEntity entity = submitNewCaseRepository.findById(caseId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));

        if (!learner.getLearnerId().equals(entity.getLearnerId())) {
            throw new ForbiddenException("Not your submission");
        }

        CaseVerification verification = caseVerificationRepository.findByCaseEntity_CaseId(entity.getCaseId()).orElse(null);
        if ((entity.getApprovalStatus() == null || !entity.getApprovalStatus().equalsIgnoreCase("APPROVED"))
                && verification != null
                && verification.getApprovalStatus() != null
                && verification.getApprovalStatus().equalsIgnoreCase("APPROVED")) {
            entity.setApprovalStatus("APPROVED");
            entity = submitNewCaseRepository.save(entity);
        }

        if (entity.getApprovalStatus() == null || !entity.getApprovalStatus().equalsIgnoreCase("APPROVED")) {
            throw new BadRequestException("Only APPROVED submissions can be published");
        }

        publishApprovedCase(verification, entity);

        return new LearnerSubmissionDetailResponse(
                entity.getCaseId(),
                entity.getCaseTitle(),
                entity.getCaseDescription(),
                entity.getCaseDisease(),
                entity.getCaseDepartment(),
                entity.getApprovalStatus(),
                entity.getSubmittedDate(),
                entity.getCaseDoc(),
                entity.getCaseDocName(),
                entity.getCaseDocContentType(),
                getLatestRemarks(entity.getCaseId()),
                isPublished(entity.getCaseId()),
                toPublicVerificationId(verification, entity.getCaseId()),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getAuthId(),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getName(),
                verification == null || verification.getAuth() == null ? null : verification.getAuth().getSpecialization()
        );
    }

    @Override
    public String getSubmissionStatus(String authRefId, String caseId) {
        LearnerSubmissionDetailResponse detail = getMySubmission(authRefId, caseId);
        return detail.approvalStatus();
    }

    private String getLatestRemarks(String caseId) {
        return caseVerificationRepository.findByCaseEntity_CaseId(caseId)
                .map(CaseVerification::getRemarks)
                .orElse("");
    }

    private boolean isPublished(String caseId) {
        return publishedCaseRepository.existsById(caseId);
    }

    private void resetVerificationForResubmission(SubmitNewCaseEntity entity) {
        caseVerificationRepository.findByCaseEntity_CaseId(entity.getCaseId()).ifPresent(verification -> {
            verification.setApprovalStatus("UNDER_REVIEW");
            verification.setRemarks(null);
            verification.setVerifiedDate(null);
            if (!departmentVariants(entity.getCaseDepartment()).contains(normalizeKey(verification.getAuth().getSpecialization()))) {
                caseVerificationRepository.delete(verification);
                entity.setAssignedOfficerId(null);
                entity.setAssignedOfficerName(null);
                entity.setAssignedOfficerDepartment(null);
                submitNewCaseRepository.save(entity);
                return;
            }
            entity.setAssignedOfficerId(verification.getAuth().getAuthId());
            entity.setAssignedOfficerName(verification.getAuth().getName());
            entity.setAssignedOfficerDepartment(verification.getAuth().getSpecialization());
            submitNewCaseRepository.save(entity);
            caseVerificationRepository.save(verification);
        });
    }

    private void publishApprovedCase(CaseVerification verification, SubmitNewCaseEntity submittedCase) {
        if (verification != null && isLegacyVerificationId(verification.getVerificationId())) {
            verification.setVerificationId(generateVerificationId(submittedCase.getCaseId()));
            caseVerificationRepository.save(verification);
        }

        PublishedCaseEntity publishedCase = new PublishedCaseEntity();
        publishedCase.setCaseId(submittedCase.getCaseId());
        publishedCase.setLearnerId(submittedCase.getLearnerId());
        publishedCase.setAuthOfficerId(
                verification == null || verification.getAuth() == null
                        ? submittedCase.getAssignedOfficerId()
                        : verification.getAuth().getAuthId()
        );
        publishedCase.setCaseTitle(submittedCase.getCaseTitle());
        publishedCase.setCaseDisease(submittedCase.getCaseDisease());
        publishedCase.setCaseDepartment(submittedCase.getCaseDepartment());
        publishedCase.setCaseDescription(submittedCase.getCaseDescription());
        publishedCase.setCaseDoc(cleanDocumentData(submittedCase.getCaseDocData()));
        publishedCase.setCaseDocName(submittedCase.getCaseDocName());
        publishedCase.setCaseDocContentType(submittedCase.getCaseDocContentType());
        publishedCase.setVerificationId(toPublicVerificationId(verification, submittedCase.getCaseId()));
        publishedCase.setAuthOfficerRemarks(verification == null ? null : verification.getRemarks());
        publishedCase.setFeedbackId(generateFeedbackId(submittedCase.getCaseId()));
        publishedCase.setCaseReviewedDate(LocalDate.now());
        if (publishedCase.getCaseSubmissionDate() == null) {
            publishedCase.setCaseSubmissionDate(LocalDate.now());
        }

        publishedCaseRepository.saveAndFlush(publishedCase);
    }

    private String cleanDocumentData(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        int commaIndex = value.indexOf(',');
        if (value.startsWith("data:") && commaIndex >= 0) {
            return value.substring(commaIndex + 1);
        }

        return value;
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }

    private String normalizeContentType(String value) {
        return value == null || value.isBlank() ? "application/pdf" : value;
    }

    private String fit(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength);
    }

    private String generateCaseId(String learnerId) {
        // Public case IDs stay short and learner-neutral; ownership remains in learner_id.
        for (int attempt = 0; attempt < 8; attempt++) {
            String timestamp = LocalDateTime.now().format(CASE_ID_TS_FMT);
            int randomSuffix = 1000 + RANDOM.nextInt(9000);
            String candidate = "CASE-" + timestamp + "-" + randomSuffix;
            if (candidate.length() > 120) {
                candidate = candidate.substring(0, 120);
            }
            if (!submitNewCaseRepository.existsById(candidate)) {
                return candidate;
            }
        }
        String fallback = "CASE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        return fallback.length() > 120 ? fallback.substring(0, 120) : fallback;
    }

    private String generateVerificationId(String caseId) {
        String suffix = caseId == null || caseId.isBlank()
                ? UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT)
                : caseId.replaceFirst("^CASE-", "");
        String candidate = "VER-" + suffix;
        return candidate.length() > 120 ? candidate.substring(0, 120) : candidate;
    }

    private String generateFeedbackId(String caseId) {
        String suffix = caseId == null || caseId.isBlank()
                ? UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT)
                : caseId.replaceFirst("^CASE-", "");
        String candidate = "FDBK-" + suffix;
        return candidate.length() > 50 ? candidate.substring(0, 50) : candidate;
    }

    private String toPublicVerificationId(CaseVerification verification, String caseId) {
        if (verification == null) {
            return null;
        }
        if (isLegacyVerificationId(verification.getVerificationId())) {
            return generateVerificationId(caseId);
        }
        return verification.getVerificationId();
    }

    private boolean isLegacyVerificationId(String verificationId) {
        return verificationId == null
                || verificationId.isBlank()
                || verificationId.startsWith("VER_")
                || verificationId.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    }

    private String normalizeDepartment(String value) {
        String key = normalizeKey(value);
        String label = DEPARTMENTS.get(key);
        if (label != null) {
            return label;
        }
        throw new BadRequestException("Please select a valid department");
    }

    private List<String> departmentVariants(String value) {
        String key = normalizeKey(value);
        String label = DEPARTMENTS.getOrDefault(key, value == null ? "" : value.trim());
        List<String> variants = new ArrayList<>();
        variants.add(key.toLowerCase(Locale.ROOT));
        variants.add(label.toLowerCase(Locale.ROOT));
        return variants.stream().distinct().toList();
    }

    private String normalizeKey(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        for (Map.Entry<String, String> entry : DEPARTMENTS.entrySet()) {
            if (entry.getKey().equals(normalized) || entry.getValue().toLowerCase(Locale.ROOT).equals(normalized)) {
                return entry.getKey();
            }
        }
        return normalized;
    }
}
