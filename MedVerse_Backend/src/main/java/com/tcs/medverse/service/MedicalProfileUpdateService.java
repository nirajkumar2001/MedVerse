package com.tcs.medverse.service;

import com.tcs.medverse.dto.AccessNotificationResponse;
import com.tcs.medverse.dto.MedicalProfileUpdateCreateRequest;
import com.tcs.medverse.dto.MedicalProfileUpdateResponse;
import com.tcs.medverse.dto.MedicalProfileUpdateUpdateRequest;
import com.tcs.medverse.dto.PatientMedicalProfileResponse;
import com.tcs.medverse.dto.PatientMedicalRecordResponse;
import com.tcs.medverse.event.DomainEventPublisher;
import com.tcs.medverse.event.MedicalRecordUpdatedEvent;
import com.tcs.medverse.entity.AccessNotification;
import com.tcs.medverse.entity.MedicalProfileUpdate;
import com.tcs.medverse.entity.PatientMedicalProfile;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.exception.BadRequestException;
import com.tcs.medverse.exception.ForbiddenException;
import com.tcs.medverse.exception.ResourceNotFoundException;
import com.tcs.medverse.repository.AccessNotificationRepository;
import com.tcs.medverse.repository.MedicalProfileUpdateRepository;
import com.tcs.medverse.repository.PatientMedicalProfileRepository;
import com.tcs.medverse.repository.SignupRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class MedicalProfileUpdateService {

    private final MedicalProfileUpdateRepository medicalProfileUpdateRepository;
    private final PatientMedicalProfileRepository patientMedicalProfileRepository;
    private final AccessNotificationRepository accessNotificationRepository;
    private final HealthcareSecurityService healthcareSecurityService;
    private final SignupRepository signupRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final DomainEventPublisher domainEventPublisher;

    public MedicalProfileUpdateService(
            MedicalProfileUpdateRepository medicalProfileUpdateRepository,
            PatientMedicalProfileRepository patientMedicalProfileRepository,
            AccessNotificationRepository accessNotificationRepository,
            HealthcareSecurityService healthcareSecurityService,
            SignupRepository signupRepository,
            SimpMessagingTemplate messagingTemplate,
            DomainEventPublisher domainEventPublisher) {
        this.medicalProfileUpdateRepository = medicalProfileUpdateRepository;
        this.patientMedicalProfileRepository = patientMedicalProfileRepository;
        this.accessNotificationRepository = accessNotificationRepository;
        this.healthcareSecurityService = healthcareSecurityService;
        this.signupRepository = signupRepository;
        this.messagingTemplate = messagingTemplate;
        this.domainEventPublisher = domainEventPublisher;
    }

    @Transactional(readOnly = true)
    public PatientMedicalRecordResponse getCompleteRecordForDoctor(
            Authentication authentication,
            String patientId,
            String sessionId) {

        Signup doctor = healthcareSecurityService.currentApprovedUser(authentication, Role.DOCTOR);

        AccessNotification session = findSession(sessionId);

        if (!Objects.equals(session.getDoctorId(), doctor.getUserId())) {
            throw new ForbiddenException("Doctors can only view their own approved patient sessions");
        }

        if (!Objects.equals(session.getPatientId(), patientId)) {
            throw new BadRequestException("Session does not belong to this patient");
        }

        if (!"APPROVED".equalsIgnoreCase(session.getAccessStatus())
                && !"COMPLETED".equalsIgnoreCase(session.getAccessStatus())) {
            throw new BadRequestException("Patient profile can be viewed only after patient approval");
        }

        if (!Boolean.TRUE.equals(session.getCanViewPreviousRecords())) {
            throw new BadRequestException("Access to previous medical records was not granted");
        }

        PatientMedicalProfile profile = getOrCreatePatientMedicalProfile(patientId);

        List<MedicalProfileUpdateResponse> previousRecords = Boolean.TRUE.equals(session.getCanViewPreviousRecords())
                ? medicalProfileUpdateRepository
                        .findByPatientIdOrderByDateOfUpdateDesc(patientId)
                        .stream()
                        .map(this::toUpdateResponse)
                        .toList()
                : List.of();

        return toMedicalRecordResponse(profile, previousRecords);
    }

    @Transactional(readOnly = true)
    public PatientMedicalRecordResponse getMyMedicalRecord(Authentication authentication) {
        Signup patient = healthcareSecurityService.currentApprovedUser(authentication, Role.PATIENT);

        PatientMedicalProfile profile = getOrCreatePatientMedicalProfile(patient.getUserId());

        List<MedicalProfileUpdateResponse> previousRecords = medicalProfileUpdateRepository
                .findByPatientIdOrderByDateOfUpdateDesc(patient.getUserId())
                .stream()
                .map(this::toUpdateResponse)
                .toList();

        return toMedicalRecordResponse(profile, previousRecords);
    }

    @Transactional(readOnly = true)
    public List<MedicalProfileUpdateResponse> getSessionUpdates(
            Authentication authentication,
            String sessionId) {

        AccessNotification session = findSession(sessionId);
        assertParticipant(authentication, session);

        return medicalProfileUpdateRepository
                .findBySessionIdOrderByDateOfUpdateDesc(sessionId)
                .stream()
                .map(this::toUpdateResponse)
                .toList();
    }

    @Transactional
    public MedicalProfileUpdateResponse createUpdate(
            Authentication authentication,
            MedicalProfileUpdateCreateRequest request) {

        Signup doctor = healthcareSecurityService.currentApprovedUser(authentication, Role.DOCTOR);

        if (request.getSessionId() == null || request.getSessionId().trim().isBlank()) {
            throw new BadRequestException("Session ID is required");
        }

        if (request.getPatientId() == null || request.getPatientId().trim().isBlank()) {
            throw new BadRequestException("Patient ID is required");
        }

        if (request.getDisease() == null || request.getDisease().trim().isBlank()) {
            throw new BadRequestException("Disease / chief concern is required");
        }

        if (request.getFindings() == null || request.getFindings().trim().isBlank()) {
            throw new BadRequestException("Doctor findings are required");
        }

        AccessNotification session = findSession(request.getSessionId());

        if (!Objects.equals(session.getDoctorId(), doctor.getUserId())) {
            throw new ForbiddenException("Doctors can only update their own approved patient sessions");
        }

        if (!Objects.equals(session.getPatientId(), request.getPatientId())) {
            throw new BadRequestException("Session does not belong to this patient");
        }

        if (!"APPROVED".equalsIgnoreCase(session.getAccessStatus())) {
            throw new BadRequestException("Medical profile can be edited only for active approved sessions");
        }

        if (session.getAccessEndedAt() != null) {
            throw new BadRequestException("This access session has already ended");
        }

        LocalDateTime now = LocalDateTime.now();

        PatientMedicalProfile profile = getOrCreatePatientMedicalProfile(request.getPatientId());

        patchCurrentProfile(profile, request, doctor.getUserId(), now);
        PatientMedicalProfile savedProfile = patientMedicalProfileRepository.save(profile);

        MedicalProfileUpdate update = new MedicalProfileUpdate();

        update.setSessionId(request.getSessionId());
        update.setPatientId(request.getPatientId());
        update.setDoctorId(doctor.getUserId());
        update.setDateOfUpdate(now);
        update.setCreatedAt(now);

        update.setBloodGroup(savedProfile.getBloodGroup());
        update.setAllergies(savedProfile.getAllergies());
        update.setChronicConditions(savedProfile.getChronicConditions());
        update.setCurrentMedication(savedProfile.getCurrentMedication());

        update.setDisease(cleanText(request.getDisease()));
        update.setMedicalReports(cleanText(request.getMedicalReports()));
        update.setFindings(cleanText(request.getFindings()));
        update.setPrescription(cleanText(request.getPrescription()));

        update.setHeightCm(savedProfile.getHeightCm());
        update.setWeightKg(savedProfile.getWeightKg());
        update.setBmi(savedProfile.getBmi());
        update.setBloodPressure(savedProfile.getBloodPressure());
        update.setBodyTemperature(savedProfile.getBodyTemperature());

        MedicalProfileUpdate savedUpdate = medicalProfileUpdateRepository.save(update);

        session.setAccessStatus("COMPLETED");
        session.setAccessEndedAt(now);
        session.setEndedBy(doctor.getUserId());
        session.setEndReason("Medical profile update completed by doctor");
        session.setRead(false);

        AccessNotification savedSession = accessNotificationRepository.save(session);

        publishAccessNotificationToBothSides(savedSession);
        publishMedicalUpdateToPatient(savedSession, savedUpdate);
        domainEventPublisher.publishMedicalRecordUpdated(new MedicalRecordUpdatedEvent(
                savedUpdate.getUpdateId(),
            savedUpdate.getPatientId(),
            savedUpdate.getDoctorId(),
            savedUpdate.getSessionId(),
            now));

        return toUpdateResponse(savedUpdate);
    }

    @Transactional
    public MedicalProfileUpdateResponse updateExisting(
            Authentication authentication,
            Long updateId,
            MedicalProfileUpdateUpdateRequest request) {

        Signup doctor = healthcareSecurityService.currentApprovedUser(authentication, Role.DOCTOR);

        MedicalProfileUpdate existing = medicalProfileUpdateRepository.findById(updateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Medical profile update not found with id: " + updateId));

        if (!Objects.equals(existing.getDoctorId(), doctor.getUserId())) {
            throw new ForbiddenException("Doctors can only edit their own medical updates");
        }

        if (request.getDisease() != null) {
            existing.setDisease(cleanText(request.getDisease()));
        }

        if (request.getMedicalReports() != null) {
            existing.setMedicalReports(cleanText(request.getMedicalReports()));
        }

        if (request.getFindings() != null) {
            existing.setFindings(cleanText(request.getFindings()));
        }

        if (request.getPrescription() != null) {
            existing.setPrescription(cleanText(request.getPrescription()));
        }

        if (request.getBloodGroup() != null) {
            existing.setBloodGroup(cleanText(request.getBloodGroup()));
        }

        if (request.getAllergies() != null) {
            existing.setAllergies(cleanText(request.getAllergies()));
        }

        if (request.getChronicConditions() != null) {
            existing.setChronicConditions(cleanText(request.getChronicConditions()));
        }

        if (request.getCurrentMedication() != null) {
            existing.setCurrentMedication(cleanText(request.getCurrentMedication()));
        }

        if (request.getHeightCm() != null) {
            existing.setHeightCm(request.getHeightCm());
        }

        if (request.getWeightKg() != null) {
            existing.setWeightKg(request.getWeightKg());
        }

        if (request.getBmi() != null) {
            existing.setBmi(request.getBmi());
        }

        if (request.getBloodPressure() != null) {
            existing.setBloodPressure(cleanText(request.getBloodPressure()));
        }

        if (request.getBodyTemperature() != null) {
            existing.setBodyTemperature(cleanText(request.getBodyTemperature()));
        }

        MedicalProfileUpdate saved = medicalProfileUpdateRepository.save(existing);

        return toUpdateResponse(saved);
    }

    private void patchCurrentProfile(
            PatientMedicalProfile profile,
            MedicalProfileUpdateCreateRequest request,
            String doctorId,
            LocalDateTime now) {

        if (profile.getCreatedAt() == null) {
            profile.setCreatedAt(now);
        }

        if (request.getBloodGroup() != null) {
            profile.setBloodGroup(cleanText(request.getBloodGroup()));
        }

        if (request.getAllergies() != null) {
            profile.setAllergies(cleanText(request.getAllergies()));
        }

        if (request.getChronicConditions() != null) {
            profile.setChronicConditions(cleanText(request.getChronicConditions()));
        }

        if (request.getCurrentMedication() != null) {
            profile.setCurrentMedication(cleanText(request.getCurrentMedication()));
        }

        profile.setLastDisease(cleanText(request.getDisease()));
        profile.setLastFindings(cleanText(request.getFindings()));
        profile.setLastPrescription(cleanText(request.getPrescription()));

        profile.setHeightCm(request.getHeightCm());
        profile.setWeightKg(request.getWeightKg());
        profile.setBmi(request.getBmi());
        profile.setBloodPressure(cleanText(request.getBloodPressure()));
        profile.setBodyTemperature(cleanText(request.getBodyTemperature()));

        profile.setLastUpdatedByDoctorId(doctorId);
        profile.setLastUpdatedAt(now);
    }

    private PatientMedicalProfile getOrCreatePatientMedicalProfile(String patientId) {
        return patientMedicalProfileRepository
                .findByPatientId(patientId)
                .orElseGet(() -> {
                    PatientMedicalProfile profile = new PatientMedicalProfile();

                    profile.setPatientId(patientId);
                    profile.setCreatedAt(LocalDateTime.now());

                    profile.setBloodGroup("");
                    profile.setAllergies("");
                    profile.setChronicConditions("");
                    profile.setCurrentMedication("");

                    profile.setLastUpdatedAt(null);

                    return profile;
                });
    }

    private AccessNotification findSession(String sessionId) {
        return accessNotificationRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Access session not found with sessionId: " + sessionId));
    }

    private void assertParticipant(Authentication authentication, AccessNotification session) {
        Signup user = healthcareSecurityService.currentUser(authentication);

        if (user.getAuthStatus() != AuthStatus.APPROVED) {
            throw new ForbiddenException("Your account is not approved by admin yet");
        }

        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (user.getRole() == Role.DOCTOR && Objects.equals(user.getUserId(), session.getDoctorId())) {
            return;
        }

        if (user.getRole() == Role.PATIENT && Objects.equals(user.getUserId(), session.getPatientId())) {
            return;
        }

        throw new ForbiddenException("You are not allowed to access this medical profile update");
    }

    private PatientMedicalRecordResponse toMedicalRecordResponse(
            PatientMedicalProfile profile,
            List<MedicalProfileUpdateResponse> previousRecords) {

        PatientMedicalRecordResponse response = new PatientMedicalRecordResponse();

        response.setPatientId(profile.getPatientId());
        response.setCurrentProfile(toProfileResponse(profile));
        response.setPreviousRecords(previousRecords);

        return response;
    }

    private PatientMedicalProfileResponse toProfileResponse(PatientMedicalProfile profile) {
        PatientMedicalProfileResponse response = new PatientMedicalProfileResponse();

        response.setPatientId(profile.getPatientId());

        response.setBloodGroup(profile.getBloodGroup());
        response.setAllergies(profile.getAllergies());
        response.setChronicConditions(profile.getChronicConditions());
        response.setCurrentMedication(profile.getCurrentMedication());

        response.setHeightCm(profile.getHeightCm());
        response.setWeightKg(profile.getWeightKg());
        response.setBmi(profile.getBmi());
        response.setBloodPressure(profile.getBloodPressure());
        response.setBodyTemperature(profile.getBodyTemperature());

        response.setLastDisease(profile.getLastDisease());
        response.setLastFindings(profile.getLastFindings());
        response.setLastPrescription(profile.getLastPrescription());

        response.setLastUpdatedByDoctorId(profile.getLastUpdatedByDoctorId());
        response.setLastUpdatedAt(toString(profile.getLastUpdatedAt()));

        return response;
    }

    private MedicalProfileUpdateResponse toUpdateResponse(MedicalProfileUpdate update) {
        MedicalProfileUpdateResponse response = new MedicalProfileUpdateResponse();

        response.setUpdateId(
                update.getUpdateId() != null
                        ? Long.valueOf(update.getUpdateId())
                        : null);

        response.setSessionId(update.getSessionId());
        response.setPatientId(update.getPatientId());
        response.setDoctorId(update.getDoctorId());
        response.setDoctorName(resolveDoctorName(update.getDoctorId()));

        response.setDateOfUpdate(toString(update.getDateOfUpdate()));
        response.setCreatedAt(
                update.getCreatedAt() != null
                        ? toString(update.getCreatedAt())
                        : toString(update.getDateOfUpdate()));

        response.setBloodGroup(update.getBloodGroup());
        response.setAllergies(update.getAllergies());
        response.setChronicConditions(update.getChronicConditions());
        response.setCurrentMedication(update.getCurrentMedication());

        response.setDisease(update.getDisease());
        response.setMedicalReports(update.getMedicalReports());
        response.setFindings(update.getFindings());
        response.setPrescription(update.getPrescription());

        response.setHeightCm(update.getHeightCm());
        response.setWeightKg(update.getWeightKg());
        response.setBmi(update.getBmi());
        response.setBloodPressure(update.getBloodPressure());
        response.setBodyTemperature(update.getBodyTemperature());

        return response;
    }

    private void publishAccessNotificationToBothSides(AccessNotification entity) {
        AccessNotificationResponse response = toAccessNotificationResponse(entity);

        publishToUser(entity.getPatientId(), "/queue/access-notifications", response);
        publishToUser(entity.getDoctorId(), "/queue/access-notifications", response);
    }

    private void publishMedicalUpdateToPatient(
            AccessNotification session,
            MedicalProfileUpdate update) {

        MedicalProfileUpdateResponse response = toUpdateResponse(update);

        publishToUser(session.getPatientId(), "/queue/medical-profile-updates", response);
        publishToUser(session.getDoctorId(), "/queue/medical-profile-updates", response);
    }

    private void publishToUser(String userId, String destination, Object payload) {
        signupRepository.findByUserId(userId)
                .ifPresent(signup -> messagingTemplate.convertAndSendToUser(
                        signup.getAuthRefId(),
                        destination,
                        payload));
    }

    private AccessNotificationResponse toAccessNotificationResponse(AccessNotification entity) {
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

    private String resolveDoctorName(String doctorId) {
        if (doctorId == null || doctorId.trim().isBlank()) {
            return null;
        }

        return signupRepository.findByUserId(doctorId)
                .map(Signup::getName)
                .orElse(doctorId);
    }

    private String cleanText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private String toString(LocalDateTime value) {
        return value != null ? value.toString() : null;
    }
}