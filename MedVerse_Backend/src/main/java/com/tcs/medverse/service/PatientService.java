package com.tcs.medverse.service;

import com.tcs.medverse.dto.PatientRequestDTO;
import com.tcs.medverse.dto.PatientResponseDTO;
import com.tcs.medverse.entity.Patient;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.exception.ResourceNotFoundException;
import com.tcs.medverse.repository.PatientRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final HealthcareSecurityService healthcareSecurityService;

    public PatientService(
            PatientRepository patientRepository,
            HealthcareSecurityService healthcareSecurityService) {
        this.patientRepository = patientRepository;
        this.healthcareSecurityService = healthcareSecurityService;
    }

    @Transactional(readOnly = true)
    public PatientResponseDTO getMyProfile(Authentication authentication) {
        Signup patientSignup = healthcareSecurityService.currentApprovedUser(authentication, Role.PATIENT);

        Patient patient = patientRepository.findById(patientSignup.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Patient profile not found with patientId: " + patientSignup.getUserId()));

        return mapToResponse(patient, patientSignup);
    }

    @Transactional
    public PatientResponseDTO updateMyProfile(
            Authentication authentication,
            PatientRequestDTO request) {

        Signup patientSignup = healthcareSecurityService.currentApprovedUser(authentication, Role.PATIENT);

        Patient patient = patientRepository.findById(patientSignup.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Patient profile not found with patientId: " + patientSignup.getUserId()));

        if (request.getName() != null) {
            patient.setName(cleanText(request.getName()));
        }

        if (request.getAge() != null) {
            patient.setAge(request.getAge());
        }

        if (request.getGender() != null) {
            patient.setGender(cleanText(request.getGender()));
        }

        /*
         * Current project logic:
         * contactNumber is used as emergency contact number.
         * Frontend may send either emergencyContact or contactNumber.
         */
        String emergencyContact = firstNonBlank(
                request.getEmergencyContact(),
                request.getContactNumber());

        if (emergencyContact != null) {
            patient.setContactNumber(emergencyContact);
        }

        if (request.getAddress() != null) {
            patient.setAddress(cleanText(request.getAddress()));
        }

        if (request.getDistrict() != null) {
            patient.setDistrict(cleanText(request.getDistrict()));
        }

        if (request.getState() != null) {
            patient.setState(cleanText(request.getState()));
        }

        if (request.getPincode() != null) {
            patient.setPincode(toIntegerOrNull(request.getPincode()));
        }

        if (request.getHeight() != null) {
            patient.setHeight(request.getHeight());
        }

        if (request.getWeight() != null) {
            patient.setWeight(request.getWeight());
        }

        if (request.getProfileImage() != null || request.getPhotoUrl() != null) {
            String profileImage = cleanText(request.getProfileImage());
            String photoUrl = cleanText(request.getPhotoUrl());

            /*
             * photoUrl is a TEXT/Lob field and can safely store a data URL.
             * profileImage is kept as a short URL/path field, so we must not copy
             * long base64 data URLs into it.
             */
            if (photoUrl != null && photoUrl.startsWith("data:image/")) {
                patient.setPhotoUrl(photoUrl);
                patient.setProfileImage(profileImage != null && !profileImage.startsWith("data:image/")
                        ? profileImage
                        : null);
            } else {
                String imageReference = firstNonBlank(profileImage, photoUrl);
                patient.setProfileImage(imageReference);
                patient.setPhotoUrl(imageReference);
            }

            patient.setProfileUpdatedAt(LocalDateTime.now());
        }

        Patient saved = patientRepository.save(patient);

        return mapToResponse(saved, patientSignup);
    }

    private PatientResponseDTO mapToResponse(Patient patient, Signup signup) {
        PatientResponseDTO response = new PatientResponseDTO();

        response.setPatientId(patient.getPatientId());
        response.setUserId(patient.getPatientId());

        response.setName(patient.getName());
        response.setFullName(patient.getName());

        response.setEmail(patient.getEmail() != null ? patient.getEmail() : signup.getEmail());

        response.setAge(patient.getAge());
        response.setGender(patient.getGender());

        response.setContactNumber(patient.getContactNumber());
        response.setEmergencyContact(patient.getContactNumber());

        response.setAddress(patient.getAddress());
        response.setDistrict(patient.getDistrict());
        response.setState(patient.getState());
        response.setPincode(patient.getPincode());
        response.setHeight(patient.getHeight());
        response.setWeight(patient.getWeight());
        response.setProfileImage(patient.getProfileImage());

        response.setPhotoUrl(firstNonBlank(patient.getPhotoUrl(), patient.getProfileImage()));

        return response;
    }

    private String cleanText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonBlank(String first, String second) {
        String firstClean = cleanText(first);

        if (firstClean != null) {
            return firstClean;
        }

        return cleanText(second);
    }

    private Integer toIntegerOrNull(String value) {
        String cleaned = cleanText(value);

        if (cleaned == null) {
            return null;
        }

        try {
            return Integer.parseInt(cleaned);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
