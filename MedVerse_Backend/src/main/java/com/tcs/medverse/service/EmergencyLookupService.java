package com.tcs.medverse.service;

import com.tcs.medverse.dto.EmergencyLookupSearchResponseDto;
import com.tcs.medverse.dto.PatientDetailsResponseDto;
import com.tcs.medverse.dto.PatientSummaryResponseDto;
import com.tcs.medverse.entity.Patient;
import com.tcs.medverse.entity.PatientMedicalProfile;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.exception.BadRequestException;
import com.tcs.medverse.exception.ResourceNotFoundException;
import com.tcs.medverse.repository.PatientMedicalProfileRepository;
import com.tcs.medverse.repository.PatientRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EmergencyLookupService {

    private final PatientRepository patientRepository;
    private final PatientMedicalProfileRepository patientMedicalProfileRepository;
    private final HealthcareSecurityService healthcareSecurityService;

    public EmergencyLookupService(
            PatientRepository patientRepository,
            PatientMedicalProfileRepository patientMedicalProfileRepository,
            HealthcareSecurityService healthcareSecurityService) {
        this.patientRepository = patientRepository;
        this.patientMedicalProfileRepository = patientMedicalProfileRepository;
        this.healthcareSecurityService = healthcareSecurityService;
    }

    @Transactional(readOnly = true)
    public EmergencyLookupSearchResponseDto searchPatients(
            Authentication authentication,
            String query) {

        healthcareSecurityService.currentApprovedUser(authentication, Role.DOCTOR);

        String normalizedQuery = normalizeQuery(query);

        Optional<Patient> exactPatient = patientRepository.findById(normalizedQuery);

        if (exactPatient.isPresent()) {
            PatientDetailsResponseDto patientDetails = toPatientDetails(exactPatient.get());

            return EmergencyLookupSearchResponseDto.single(
                    normalizedQuery,
                    patientDetails,
                    "One matching patient found.");
        }

        List<Patient> matches = patientRepository.searchForEmergencyLookup(normalizedQuery);

        if (matches == null || matches.isEmpty()) {
            return EmergencyLookupSearchResponseDto.none(
                    normalizedQuery,
                    "No matching patient found.");
        }

        if (matches.size() == 1) {
            PatientDetailsResponseDto patientDetails = toPatientDetails(matches.get(0));

            return EmergencyLookupSearchResponseDto.single(
                    normalizedQuery,
                    patientDetails,
                    "One matching patient found.");
        }

        List<PatientSummaryResponseDto> summaries = matches
                .stream()
                .map(this::toPatientSummary)
                .toList();

        return EmergencyLookupSearchResponseDto.multiple(
                normalizedQuery,
                summaries,
                matches.size() + " matching patients found. Select a patient to view emergency details.");
    }

    @Transactional(readOnly = true)
    public PatientDetailsResponseDto getPatientDetails(
            Authentication authentication,
            String patientId) {

        healthcareSecurityService.currentApprovedUser(authentication, Role.DOCTOR);

        String normalizedPatientId = normalizeQuery(patientId);

        Patient patient = patientRepository.findById(normalizedPatientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Patient not found with patientId: " + normalizedPatientId));

        return toPatientDetails(patient);
    }

    @Transactional(readOnly = true)
    public PatientDetailsResponseDto getMyEmergencyDetails(Authentication authentication) {
        com.tcs.medverse.entity.Signup patientSignup =
                healthcareSecurityService.currentApprovedUser(authentication, Role.PATIENT);

        Patient patient = patientRepository.findById(patientSignup.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Patient not found with patientId: " + patientSignup.getUserId()));

        return toPatientDetails(patient);
    }

    private PatientSummaryResponseDto toPatientSummary(Patient patient) {
        PatientSummaryResponseDto dto = new PatientSummaryResponseDto();

        dto.setPatientId(readString(patient, "getPatientId", "getUserId", "getId"));
        dto.setFullName(readString(patient, "getFullName", "getName", "getPatientName"));
        dto.setAge(readInteger(patient, "getAge"));
        dto.setGender(readString(patient, "getGender"));
        dto.setBloodGroup(readString(patient, "getBloodGroup"));
        dto.setEmergencyContact(
                readString(patient, "getEmergencyContact", "getContactNumber", "getPhoneNumber", "getMobileNumber"));
        dto.setContactNumber(
                readString(patient, "getContactNumber", "getEmergencyContact", "getPhoneNumber", "getMobileNumber"));
        dto.setAddress(readString(patient, "getAddress"));
        dto.setDistrict(readString(patient, "getDistrict"));
        dto.setState(readString(patient, "getState"));
        dto.setPincode(readObjectAsString(patient, "getPincode"));
        dto.setPhotoUrl(readString(patient, "getPhotoUrl", "getProfilePhotoUrl", "getImageUrl"));

        PatientMedicalProfile profile = findProfile(dto.getPatientId()).orElse(null);

        if (isBlank(dto.getBloodGroup()) && profile != null) {
            dto.setBloodGroup(readString(profile, "getBloodGroup"));
        }

        return dto;
    }

    private PatientDetailsResponseDto toPatientDetails(Patient patient) {
        PatientSummaryResponseDto summary = toPatientSummary(patient);

        PatientDetailsResponseDto dto = new PatientDetailsResponseDto();

        dto.setPatientId(summary.getPatientId());
        dto.setFullName(summary.getFullName());
        dto.setAge(summary.getAge());
        dto.setGender(summary.getGender());
        dto.setBloodGroup(summary.getBloodGroup());
        dto.setEmergencyContact(summary.getEmergencyContact());
        dto.setContactNumber(summary.getContactNumber());
        dto.setAddress(summary.getAddress());
        dto.setDistrict(summary.getDistrict());
        dto.setState(summary.getState());
        dto.setPincode(summary.getPincode());
        dto.setPhotoUrl(summary.getPhotoUrl());

        PatientMedicalProfile profile = findProfile(summary.getPatientId()).orElse(null);

        if (profile != null) {
            dto.setBloodGroup(firstNonBlank(
                    dto.getBloodGroup(),
                    readString(profile, "getBloodGroup")));

            dto.setAllergies(readString(profile, "getAllergies"));
            dto.setChronicConditions(readString(profile, "getChronicConditions"));
            dto.setCurrentMedication(readString(profile, "getCurrentMedication", "getCurrentMedications"));

            dto.setHeightCm(readDouble(profile, "getHeightCm"));
            dto.setWeightKg(readDouble(profile, "getWeightKg"));
            dto.setBmi(readDouble(profile, "getBmi"));

            LocalDateTime lastUpdatedAt = readLocalDateTime(profile, "getLastUpdatedAt", "getUpdatedAt");
            dto.setLastUpdatedAt(lastUpdatedAt != null ? lastUpdatedAt.toString() : null);
        }

        return dto;
    }

    private Optional<PatientMedicalProfile> findProfile(String patientId) {
        if (isBlank(patientId)) {
            return Optional.empty();
        }

        return patientMedicalProfileRepository.findByPatientId(patientId);
    }

    private String normalizeQuery(String query) {
        if (query == null || query.trim().isBlank()) {
            throw new BadRequestException("Search query is required");
        }

        return query.trim();
    }

    private String readString(Object source, String... getterNames) {
        Object value = readValue(source, getterNames);
        return value != null ? String.valueOf(value) : null;
    }

    private String readObjectAsString(Object source, String... getterNames) {
        Object value = readValue(source, getterNames);
        return value != null ? String.valueOf(value) : null;
    }

    private Integer readInteger(Object source, String... getterNames) {
        Object value = readValue(source, getterNames);

        if (value == null) {
            return null;
        }

        if (value instanceof Number number) {
            return number.intValue();
        }

        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Double readDouble(Object source, String... getterNames) {
        Object value = readValue(source, getterNames);

        if (value == null) {
            return null;
        }

        if (value instanceof Number number) {
            return number.doubleValue();
        }

        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private LocalDateTime readLocalDateTime(Object source, String... getterNames) {
        Object value = readValue(source, getterNames);

        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime;
        }

        return null;
    }

    private Object readValue(Object source, String... getterNames) {
        if (source == null || getterNames == null) {
            return null;
        }

        for (String getterName : getterNames) {
            try {
                Method method = source.getClass().getMethod(getterName);
                Object value = method.invoke(source);

                if (value != null) {
                    return value;
                }
            } catch (Exception ignored) {
                // Try next possible getter name.
            }
        }

        return null;
    }

    private String firstNonBlank(String first, String second) {
        return !isBlank(first) ? first : second;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isBlank();
    }
}