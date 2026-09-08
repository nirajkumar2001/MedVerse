package com.tcs.medverse.service;

import com.tcs.medverse.dto.AuthenticationOfficerProfileDTO;
import com.tcs.medverse.entity.AuthenticationOfficerProfile;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.exception.AuthenticationProfileValidationException;
import com.tcs.medverse.exception.NotFoundException;
import com.tcs.medverse.exception.OfficerNotFoundException;
import com.tcs.medverse.repository.AuthenticationOfficerProfileRepository;
import com.tcs.medverse.repository.SignupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthenticationOfficerProfileService {

    private final AuthenticationOfficerProfileRepository repository;
    private final SignupRepository signupRepository;

    public AuthenticationOfficerProfileService(AuthenticationOfficerProfileRepository repository,
                                               SignupRepository signupRepository) {
        this.repository = repository;
        this.signupRepository = signupRepository;
    }

    public AuthenticationOfficerProfileDTO getOfficerProfile(String authId)
            throws OfficerNotFoundException {
        AuthenticationOfficerProfile officer = repository.findById(authId)
                .orElseThrow(() -> new OfficerNotFoundException("Officer not found"));

        return toDto(officer, null);
    }

    public AuthenticationOfficerProfileDTO getCurrentOfficerProfile(String authRefId) {
        Signup signup = getSignup(authRefId);
        AuthenticationOfficerProfile officer = getOrCreateOfficer(signup);
        return toDto(officer, signup);
    }

    public AuthenticationOfficerProfileDTO updateCurrentOfficerProfile(String authRefId,
                                                                       AuthenticationOfficerProfileDTO dto)
            throws AuthenticationProfileValidationException {
        Signup signup = getSignup(authRefId);
        AuthenticationOfficerProfile officer = getOrCreateOfficer(signup);

        if (dto.getHospitalName() != null && !dto.getHospitalName().isBlank()) {
            validateTextField(dto.getHospitalName(), "Hospital name");
            officer.setHospitalName(dto.getHospitalName().trim());
        }
        if (dto.getSpecialization() != null && !dto.getSpecialization().isBlank()) {
            validateTextField(dto.getSpecialization(), "Specialization");
            officer.setSpecialization(dto.getSpecialization().trim());
        }
        if (dto.getContactNumber() != null && !dto.getContactNumber().isBlank()) {
            validateContactNumber(dto.getContactNumber());
            officer.setContactNumber(dto.getContactNumber());
        }
        validateExperienceYears(dto.getExperienceYears());
        officer.setExperienceYears(dto.getExperienceYears());
        if (dto.getProfileImage() != null) {
            officer.setProfileImage(dto.getProfileImage());
        }

        return toDto(repository.save(officer), signup);
    }

    public AuthenticationOfficerProfileDTO updateCurrentOfficerProfileImage(String authRefId, String profileImage) {
        Signup signup = getSignup(authRefId);
        AuthenticationOfficerProfile officer = getOrCreateOfficer(signup);
        officer.setProfileImage(profileImage);
        return toDto(repository.save(officer), signup);
    }

    public void updateOfficerProfile(String authId,
                                     String hospitalName,
                                     String specialization,
                                     String contactNumber,
                                     int experienceYears)
            throws OfficerNotFoundException, AuthenticationProfileValidationException {
        AuthenticationOfficerProfile officer = repository.findById(authId)
                .orElseThrow(() -> new OfficerNotFoundException("Officer not found"));

        validateTextField(hospitalName, "Hospital name");
        validateTextField(specialization, "Specialization");
        validateContactNumber(contactNumber);
        validateExperienceYears(experienceYears);

        officer.setHospitalName(hospitalName.trim());
        officer.setSpecialization(specialization.trim());
        officer.setContactNumber(contactNumber);
        officer.setExperienceYears(experienceYears);

        repository.save(officer);
    }

    private Signup getSignup(String authRefId) {
        return signupRepository.findByAuthRefId(authRefId)
                .orElseThrow(() -> new NotFoundException("Officer login not found"));
    }

    private AuthenticationOfficerProfile getOrCreateOfficer(Signup signup) {
        return repository.findById(signup.getUserId())
                .orElseGet(() -> {
                    AuthenticationOfficerProfile officer = new AuthenticationOfficerProfile();
                    officer.setAuthId(signup.getUserId());
                    officer.setName(signup.getName());
                    officer.setEmail(signup.getEmail());
                    officer.setHospitalName("");
                    officer.setSpecialization("");
                    officer.setContactNumber("");
                    officer.setExperienceYears(0);
                    return repository.save(officer);
                });
    }

    private AuthenticationOfficerProfileDTO toDto(AuthenticationOfficerProfile officer, Signup signup) {
        AuthenticationOfficerProfileDTO dto = new AuthenticationOfficerProfileDTO(
                officer.getAuthId(),
                officer.getName(),
                officer.getEmail(),
                officer.getHospitalName(),
                officer.getSpecialization(),
                officer.getContactNumber(),
                officer.getExperienceYears()
        );
        dto.setProfileImage(officer.getProfileImage());
        if (signup != null && signup.getAuthStatus() != null) {
            dto.setStatus(signup.getAuthStatus().name());
        }
        return dto;
    }

    private void validateTextField(String value, String fieldName)
            throws AuthenticationProfileValidationException {
        if (value == null || value.trim().isEmpty()) {
            throw new AuthenticationProfileValidationException(fieldName + " cannot be null or empty");
        }

        String trimmed = value.trim();
        if (trimmed.contains("  ")) {
            throw new AuthenticationProfileValidationException(fieldName + " should not contain consecutive spaces");
        }

        if (!trimmed.matches("[A-Za-z0-9 &'().,-]+")) {
            throw new AuthenticationProfileValidationException(fieldName + " contains unsupported characters");
        }
    }

    private void validateContactNumber(String contactNumber)
            throws AuthenticationProfileValidationException {
        if (contactNumber == null || contactNumber.isEmpty()) {
            throw new AuthenticationProfileValidationException("Contact number cannot be null or empty");
        }

        if (contactNumber.length() != 10) {
            throw new AuthenticationProfileValidationException("Contact number must be 10 digits");
        }

        if (contactNumber.charAt(0) < '6' || contactNumber.charAt(0) > '9') {
            throw new AuthenticationProfileValidationException("Contact number must start with 6-9");
        }

        for (char ch : contactNumber.toCharArray()) {
            if (!Character.isDigit(ch)) {
                throw new AuthenticationProfileValidationException("Contact number must contain digits only");
            }
        }
    }

    private void validateExperienceYears(int experienceYears)
            throws AuthenticationProfileValidationException {
        if (experienceYears < 0 || experienceYears > 90) {
            throw new AuthenticationProfileValidationException("Experience must be between 0 and 90");
        }
    }
}
