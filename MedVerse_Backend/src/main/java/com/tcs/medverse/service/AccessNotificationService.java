package com.tcs.medverse.service;

import com.tcs.medverse.dto.AccessNotificationCreateRequest;
import com.tcs.medverse.dto.AccessNotificationDecisionRequest;
import com.tcs.medverse.dto.AccessNotificationEndRequest;
import com.tcs.medverse.dto.AccessNotificationResponse;
import com.tcs.medverse.dto.AccessNotificationUpdateRequest;
import com.tcs.medverse.entity.AccessNotification;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.exception.BadRequestException;
import com.tcs.medverse.exception.ForbiddenException;
import com.tcs.medverse.exception.ResourceNotFoundException;
import com.tcs.medverse.repository.AccessNotificationRepository;
import com.tcs.medverse.repository.DoctorRepository;
import com.tcs.medverse.repository.PatientRepository;
import com.tcs.medverse.repository.SignupRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class AccessNotificationService {

    private final AccessNotificationRepository repository;
    private final SignupRepository signupRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final HealthcareSecurityService healthcareSecurityService;
    private final SimpMessagingTemplate messagingTemplate;

    public AccessNotificationService(
            AccessNotificationRepository repository,
            SignupRepository signupRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            HealthcareSecurityService healthcareSecurityService,
            SimpMessagingTemplate messagingTemplate) {
        this.repository = repository;
        this.signupRepository = signupRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.healthcareSecurityService = healthcareSecurityService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public AccessNotificationResponse create(
            Authentication authentication,
            AccessNotificationCreateRequest request) {

        Signup doctorSignup = healthcareSecurityService.currentApprovedUser(authentication, Role.DOCTOR);

        String doctorId = doctorSignup.getUserId();
        String patientId = request.getPatientId();

        if (!doctorRepository.existsById(doctorId)) {
            throw new BadRequestException("Doctor profile is not created yet");
        }

        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient profile not found with patientId: " + patientId);
        }

        repository.findFirstByPatientIdAndDoctorIdAndAccessStatusAndAccessEndedAtIsNull(
                patientId,
                doctorId,
                "PENDING").ifPresent(existing -> {
                    throw new BadRequestException("A pending access request already exists for this patient");
                });

        repository.findFirstByPatientIdAndDoctorIdAndAccessStatusAndAccessEndedAtIsNull(
                patientId,
                doctorId,
                "APPROVED").ifPresent(existing -> {
                    throw new BadRequestException("An active approved access session already exists for this patient");
                });

        LocalDateTime now = LocalDateTime.now();

        int durationDays = request.getAccessDurationDays() != null
                ? request.getAccessDurationDays()
                : 1;

        AccessNotification entity = new AccessNotification();

        entity.setSessionId(generateSessionId());
        entity.setPatientId(patientId);
        entity.setDoctorId(doctorId);
        entity.setDoctorName(doctorSignup.getName());

        entity.setAssignedDate(now);
        entity.setAccessStatus("PENDING");
        entity.setConsentId(request.getConsentId());
        entity.setNotificationType("ACCESS_REQUEST");
        entity.setRead(false);
        entity.setNotifiedAt(now);

        entity.setRequestMessage(request.getRequestMessage());
        entity.setRespondedAt(null);
        entity.setRejectionReason(null);

        entity.setAccessDurationDays(durationDays);
        entity.setExpiresAt(now.plusDays(durationDays));

        entity.setRevokedAt(null);
        entity.setRevokedBy(null);

        entity.setReminderCount(0);
        entity.setLastReminderSentAt(null);

        entity.setCanViewPreviousRecords(false);

        entity.setAccessEndedAt(null);
        entity.setEndedBy(null);
        entity.setEndReason(null);

        AccessNotification saved = repository.save(entity);
        AccessNotificationResponse response = mapToResponse(saved);

        publishToBothSides(saved, response);

        return response;
    }

    @Transactional(readOnly = true)
    public List<AccessNotificationResponse> getAll(Authentication authentication) {
        healthcareSecurityService.currentApprovedUser(authentication, Role.ADMIN);

        return repository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AccessNotificationResponse getBySessionId(Authentication authentication, String sessionId) {
        AccessNotification entity = findEntityBySessionId(sessionId);
        assertParticipantOrAdmin(authentication, entity);

        return mapToResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<AccessNotificationResponse> getForCurrentDoctor(
            Authentication authentication,
            boolean unreadOnly) {

        Signup doctor = healthcareSecurityService.currentApprovedUser(authentication, Role.DOCTOR);

        return getByDoctorIdInternal(doctor.getUserId(), unreadOnly);
    }

    @Transactional(readOnly = true)
    public List<AccessNotificationResponse> getForCurrentPatient(
            Authentication authentication,
            boolean unreadOnly) {

        Signup patient = healthcareSecurityService.currentApprovedUser(authentication, Role.PATIENT);

        return getByPatientIdInternal(patient.getUserId(), unreadOnly);
    }

    @Transactional(readOnly = true)
    public List<AccessNotificationResponse> getByDoctorId(
            Authentication authentication,
            String doctorId,
            boolean unreadOnly) {

        Signup doctor = healthcareSecurityService.currentApprovedUser(authentication, Role.DOCTOR);

        if (!Objects.equals(doctor.getUserId(), doctorId)) {
            throw new ForbiddenException("Doctors can only view their own access notifications");
        }

        return getByDoctorIdInternal(doctorId, unreadOnly);
    }

    @Transactional(readOnly = true)
    public List<AccessNotificationResponse> getByPatientId(
            Authentication authentication,
            String patientId,
            boolean unreadOnly) {

        Signup patient = healthcareSecurityService.currentApprovedUser(authentication, Role.PATIENT);

        if (!Objects.equals(patient.getUserId(), patientId)) {
            throw new ForbiddenException("Patients can only view their own access notifications");
        }

        return getByPatientIdInternal(patientId, unreadOnly);
    }

    @Transactional
    public AccessNotificationResponse decide(
            Authentication authentication,
            String sessionId,
            AccessNotificationDecisionRequest request) {

        Signup patient = healthcareSecurityService.currentApprovedUser(authentication, Role.PATIENT);
        AccessNotification existing = findEntityBySessionId(sessionId);

        if (!Objects.equals(existing.getPatientId(), patient.getUserId())) {
            throw new ForbiddenException("Only the concerned patient can decide this request");
        }

        if (!"PENDING".equalsIgnoreCase(existing.getAccessStatus())) {
            throw new BadRequestException("Only pending requests can be decided");
        }

        if (existing.getExpiresAt() != null && existing.getExpiresAt().isBefore(LocalDateTime.now())) {
            existing.setAccessStatus("EXPIRED");
            existing.setRead(false);
            repository.save(existing);

            throw new BadRequestException("Access request has expired");
        }

        String decision = request.getDecision() != null
                ? request.getDecision().trim().toUpperCase()
                : "";

        if ("APPROVE".equals(decision) || "ACCEPT".equals(decision)) {
            existing.setAccessStatus("APPROVED");
            existing.setCanViewPreviousRecords(Boolean.TRUE.equals(request.getAllowPreviousMedicalRecords()));
            existing.setRejectionReason(null);
            existing.setEndReason(null);
            existing.setEndedBy(null);
            existing.setAccessEndedAt(null);
        } else if ("DENY".equals(decision) || "REJECT".equals(decision)) {
            existing.setAccessStatus("REJECTED");
            existing.setCanViewPreviousRecords(false);
            existing.setRejectionReason(request.getRejectionReason());
            existing.setEndReason("Patient rejected the access request");
            existing.setEndedBy(patient.getUserId());
            existing.setAccessEndedAt(LocalDateTime.now());
        } else {
            throw new BadRequestException("Decision must be APPROVE or DENY");
        }

        existing.setRespondedAt(LocalDateTime.now());

        /*
         * Keep it unread so the other side gets a visible state update.
         * The frontend can mark it read later when the user views it.
         */
        existing.setRead(false);

        AccessNotification saved = repository.save(existing);
        AccessNotificationResponse response = mapToResponse(saved);

        publishToBothSides(saved, response);

        return response;
    }

    @Transactional
    public AccessNotificationResponse update(
            Authentication authentication,
            String sessionId,
            AccessNotificationUpdateRequest request) {

        healthcareSecurityService.currentApprovedUser(authentication, Role.ADMIN);

        AccessNotification existing = findEntityBySessionId(sessionId);

        if (request.getAccessStatus() != null) {
            String status = request.getAccessStatus().toUpperCase();

            if (!isValidStatus(status)) {
                throw new BadRequestException(
                        "Invalid access status. Allowed values: PENDING, APPROVED, REJECTED, REVOKED, EXPIRED, COMPLETED");
            }

            existing.setAccessStatus(status);

            if (status.equals("APPROVED") || status.equals("REJECTED")) {
                existing.setRespondedAt(LocalDateTime.now());
            }

            if (status.equals("COMPLETED") && existing.getAccessEndedAt() == null) {
                existing.setAccessEndedAt(LocalDateTime.now());
            }
        }

        if (request.getNotificationType() != null) {
            existing.setNotificationType(request.getNotificationType().toUpperCase());
        }

        if (request.getRead() != null) {
            existing.setRead(request.getRead());
        }

        if (request.getRequestMessage() != null) {
            existing.setRequestMessage(request.getRequestMessage());
        }

        if (request.getRejectionReason() != null) {
            existing.setRejectionReason(request.getRejectionReason());
        }

        if (request.getAccessDurationDays() != null) {
            existing.setAccessDurationDays(request.getAccessDurationDays());

            LocalDateTime baseDate = existing.getAssignedDate() != null
                    ? existing.getAssignedDate()
                    : LocalDateTime.now();

            existing.setExpiresAt(baseDate.plusDays(request.getAccessDurationDays()));
        }

        if (request.getRevokedBy() != null && !request.getRevokedBy().isBlank()) {
            existing.setRevokedBy(request.getRevokedBy());
            existing.setRevokedAt(LocalDateTime.now());
            existing.setAccessStatus("REVOKED");
            existing.setAccessEndedAt(LocalDateTime.now());
        }

        if (request.getCanViewPreviousRecords() != null) {
            existing.setCanViewPreviousRecords(request.getCanViewPreviousRecords());
        }

        AccessNotification saved = repository.save(existing);
        AccessNotificationResponse response = mapToResponse(saved);

        publishToBothSides(saved, response);

        return response;
    }

    @Transactional
    public AccessNotificationResponse markAsRead(Authentication authentication, String sessionId) {
        AccessNotification existing = findEntityBySessionId(sessionId);

        assertParticipantOrAdmin(authentication, existing);

        existing.setRead(true);

        AccessNotification saved = repository.save(existing);
        AccessNotificationResponse response = mapToResponse(saved);

        publishToBothSides(saved, response);

        return response;
    }

    @Transactional
    public AccessNotificationResponse sendReminder(Authentication authentication, String sessionId) {
        Signup doctor = healthcareSecurityService.currentApprovedUser(authentication, Role.DOCTOR);
        AccessNotification existing = findEntityBySessionId(sessionId);

        if (!Objects.equals(existing.getDoctorId(), doctor.getUserId())) {
            throw new ForbiddenException("Doctors can only remind patients for their own requests");
        }

        if (!"PENDING".equalsIgnoreCase(existing.getAccessStatus())) {
            throw new BadRequestException("Only pending requests can receive reminders");
        }

        int count = existing.getReminderCount() != null
                ? existing.getReminderCount()
                : 0;

        existing.setReminderCount(count + 1);
        existing.setLastReminderSentAt(LocalDateTime.now());
        existing.setRead(false);

        AccessNotification saved = repository.save(existing);
        AccessNotificationResponse response = mapToResponse(saved);

        publishToBothSides(saved, response);

        return response;
    }

    @Transactional
    public AccessNotificationResponse endSession(
            Authentication authentication,
            String sessionId,
            AccessNotificationEndRequest request) {

        Signup currentUser = healthcareSecurityService.currentUser(authentication);

        if (currentUser.getAuthStatus() != AuthStatus.APPROVED) {
            throw new ForbiddenException("Your account is not approved by admin yet");
        }

        AccessNotification existing = findEntityBySessionId(sessionId);

        boolean isDoctor = currentUser.getRole() == Role.DOCTOR
                && Objects.equals(currentUser.getUserId(), existing.getDoctorId());

        boolean isPatient = currentUser.getRole() == Role.PATIENT
                && Objects.equals(currentUser.getUserId(), existing.getPatientId());

        if (!isDoctor && !isPatient) {
            throw new ForbiddenException("Only the concerned doctor or patient can end this access session");
        }

        if (!"APPROVED".equalsIgnoreCase(existing.getAccessStatus())) {
            throw new BadRequestException("Only active approved access sessions can be ended");
        }

        if (existing.getAccessEndedAt() != null) {
            throw new BadRequestException("This access session has already ended");
        }

        LocalDateTime now = LocalDateTime.now();

        existing.setAccessStatus("COMPLETED");
        existing.setAccessEndedAt(now);
        existing.setEndedBy(currentUser.getUserId());

        String reason = request != null ? request.getEndReason() : null;

        if (reason != null && !reason.trim().isBlank()) {
            existing.setEndReason(reason.trim());
        } else if (isPatient) {
            existing.setEndReason("Patient dismissed the approved access session");
        } else {
            existing.setEndReason("Doctor ended approved access session");
        }

        /*
         * Keep the completed update unread so both notification panels move
         * the card into the correct state immediately.
         */
        existing.setRead(false);

        AccessNotification saved = repository.save(existing);
        AccessNotificationResponse response = mapToResponse(saved);

        publishToBothSides(saved, response);

        return response;
    }

    @Transactional
    public void delete(Authentication authentication, String sessionId) {
        healthcareSecurityService.currentApprovedUser(authentication, Role.ADMIN);

        repository.delete(findEntityBySessionId(sessionId));
    }

    private List<AccessNotificationResponse> getByDoctorIdInternal(String doctorId, boolean unreadOnly) {
        List<AccessNotification> list = unreadOnly
                ? repository.findByDoctorIdAndReadFalseOrderByNotifiedAtDesc(doctorId)
                : repository.findByDoctorIdOrderByNotifiedAtDesc(doctorId);

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private List<AccessNotificationResponse> getByPatientIdInternal(String patientId, boolean unreadOnly) {
        List<AccessNotification> list = unreadOnly
                ? repository.findByPatientIdAndReadFalseOrderByNotifiedAtDesc(patientId)
                : repository.findByPatientIdOrderByNotifiedAtDesc(patientId);

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void assertParticipantOrAdmin(Authentication authentication, AccessNotification entity) {
        Signup signup = healthcareSecurityService.currentUser(authentication);

        if (signup.getRole() == Role.ADMIN) {
            return;
        }

        if (signup.getAuthStatus() != AuthStatus.APPROVED) {
            throw new ForbiddenException("Your account is not approved by admin yet");
        }

        if (signup.getRole() == Role.DOCTOR && Objects.equals(signup.getUserId(), entity.getDoctorId())) {
            return;
        }

        if (signup.getRole() == Role.PATIENT && Objects.equals(signup.getUserId(), entity.getPatientId())) {
            return;
        }

        throw new ForbiddenException("You are not allowed to access this notification");
    }

    private void publishToBothSides(AccessNotification entity, AccessNotificationResponse response) {
        publishToPatient(entity.getPatientId(), response);
        publishToDoctor(entity.getDoctorId(), response);
    }

    private void publishToPatient(String patientId, AccessNotificationResponse response) {
        signupRepository.findByUserId(patientId)
                .ifPresent(signup -> {
                    String destinationUser = signup.getAuthRefId();

                    if (destinationUser == null || destinationUser.trim().isBlank()) {
                        destinationUser = signup.getUserId();
                    }

                    if (destinationUser != null && !destinationUser.trim().isBlank()) {
                        messagingTemplate.convertAndSendToUser(
                                destinationUser,
                                "/queue/access-notifications",
                                response);
                    }
                });
    }

    private void publishToDoctor(String doctorId, AccessNotificationResponse response) {
        signupRepository.findByUserId(doctorId)
                .ifPresent(signup -> {
                    String destinationUser = signup.getAuthRefId();

                    if (destinationUser == null || destinationUser.trim().isBlank()) {
                        destinationUser = signup.getUserId();
                    }

                    if (destinationUser != null && !destinationUser.trim().isBlank()) {
                        messagingTemplate.convertAndSendToUser(
                                destinationUser,
                                "/queue/access-notifications",
                                response);
                    }
                });
    }

    private AccessNotification findEntityBySessionId(String sessionId) {
        return repository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Access notification not found with sessionId: " + sessionId));
    }

    private boolean isValidStatus(String status) {
        return status.equals("PENDING")
                || status.equals("APPROVED")
                || status.equals("REJECTED")
                || status.equals("REVOKED")
                || status.equals("EXPIRED")
                || status.equals("COMPLETED");
    }

    private String generateSessionId() {
        return UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 32);
    }

    private AccessNotificationResponse mapToResponse(AccessNotification entity) {
        AccessNotificationResponse response = new AccessNotificationResponse();

        response.setSessionId(entity.getSessionId());
        response.setPatientId(entity.getPatientId());
        response.setDoctorId(entity.getDoctorId());
        response.setDoctorName(entity.getDoctorName());

        response.setAssignedDate(toString(entity.getAssignedDate()));
        response.setAccessStatus(entity.getAccessStatus());

        response.setConsentId(entity.getConsentId());
        response.setNotificationType(entity.getNotificationType());
        response.setRead(entity.getRead());

        response.setNotifiedAt(toString(entity.getNotifiedAt()));
        response.setRequestMessage(entity.getRequestMessage());

        response.setRespondedAt(toString(entity.getRespondedAt()));
        response.setRejectionReason(entity.getRejectionReason());

        response.setAccessDurationDays(entity.getAccessDurationDays());
        response.setExpiresAt(toString(entity.getExpiresAt()));

        response.setRevokedAt(toString(entity.getRevokedAt()));
        response.setRevokedBy(entity.getRevokedBy());

        response.setReminderCount(entity.getReminderCount());
        response.setLastReminderSentAt(toString(entity.getLastReminderSentAt()));

        response.setCanViewPreviousRecords(entity.getCanViewPreviousRecords());

        response.setAccessEndedAt(toString(entity.getAccessEndedAt()));
        response.setEndedBy(entity.getEndedBy());
        response.setEndReason(entity.getEndReason());

        return response;
    }

    private String toString(LocalDateTime value) {
        return value != null ? value.toString() : null;
    }
}