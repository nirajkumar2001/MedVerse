package com.tcs.medverse.service;


import com.tcs.medverse.dto.*;
import com.tcs.medverse.exception.*;
import com.tcs.medverse.dto.response.*;
import com.tcs.medverse.dto.request.*;
import com.tcs.medverse.service.*;
import com.tcs.medverse.repository.*;
import com.tcs.medverse.entity.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DoctorProfileService {

    private final DoctorRepository doctorRepository;
    private final SignupRepository signupRepository;
    private final HealthcareSecurityService healthcareSecurityService;
    private final ProfileImageService profileImageService;

    public DoctorProfileService(
            DoctorRepository doctorRepository,
            SignupRepository signupRepository,
            HealthcareSecurityService healthcareSecurityService,
            ProfileImageService profileImageService
    ) {
        this.doctorRepository = doctorRepository;
        this.signupRepository = signupRepository;
        this.healthcareSecurityService = healthcareSecurityService;
        this.profileImageService = profileImageService;
    }

    @Transactional
    public DoctorProfileDto create(Authentication authentication) {

        Signup signup = healthcareSecurityService.currentUser(authentication, com.tcs.medverse.enums.Role.DOCTOR);
        String doctorId = signup.getUserId();

        if (doctorRepository.existsById(doctorId)) {
            throw new BadRequestException("Doctor profile already exists with doctorId: " + doctorId);
        }

        Doctor doctor = new Doctor();
        doctor.setDoctorId(doctorId);

        Doctor saved = doctorRepository.save(doctor);

        return mapToResponse(saved, signup);
    }

    @Transactional
    public DoctorProfileDto getMe(Authentication authentication) {

        Signup signup = healthcareSecurityService.currentUser(authentication, com.tcs.medverse.enums.Role.DOCTOR);
        String doctorId = signup.getUserId();

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseGet(() -> {
                    Doctor created = new Doctor();
                    created.setDoctorId(doctorId);
                    return doctorRepository.save(created);
                });

        return mapToResponse(doctor, signup);
    }

    @Transactional
    public DoctorProfileDto update(Authentication authentication, DoctorProfileDto request) {

        Signup signup = healthcareSecurityService.currentUser(authentication, com.tcs.medverse.enums.Role.DOCTOR);
        String doctorId = signup.getUserId();

        if (request.getDoctorId() != null
                || request.getEmail() != null
                || request.getFullName() != null) {
            throw new BadRequestException("doctorId, email and fullName cannot be updated");
        }

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseGet(() -> {
                    Doctor created = new Doctor();
                    created.setDoctorId(doctorId);
                    return created;
                });

        doctor.setDesignation(request.getDesignation());
        doctor.setDepartment(request.getDepartment());
        doctor.setPhoneNumber(request.getPhoneNumber());
        doctor.setYearsOfExperience(request.getYearsOfExperience());
        doctor.setHospitalName(request.getHospitalName());
        doctor.setProfileImage(request.getProfileImage());

        Doctor updated = doctorRepository.save(doctor);

        return mapToResponse(updated, signup);
    }

    @Transactional
    public DoctorProfileDto updateProfileImage(Authentication authentication, MultipartFile file) {
        Signup signup = healthcareSecurityService.currentUser(authentication, com.tcs.medverse.enums.Role.DOCTOR);
        String doctorId = signup.getUserId();

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseGet(() -> {
                    Doctor created = new Doctor();
                    created.setDoctorId(doctorId);
                    return created;
                });

        doctor.setProfileImage(profileImageService.toDataUrl(file));

        return mapToResponse(doctorRepository.save(doctor), signup);
    }

    @Transactional
    public DoctorProfileDto removeProfileImage(Authentication authentication) {
        Signup signup = healthcareSecurityService.currentUser(authentication, com.tcs.medverse.enums.Role.DOCTOR);
        String doctorId = signup.getUserId();

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseGet(() -> {
                    Doctor created = new Doctor();
                    created.setDoctorId(doctorId);
                    return created;
                });

        doctor.setProfileImage("");

        return mapToResponse(doctorRepository.save(doctor), signup);
    }

    private Doctor findDoctorById(String doctorId) {

        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Doctor profile not found with doctorId: " + doctorId
                ));
    }

    private DoctorProfileDto mapToResponse(Doctor doctor, Signup signup) {

        DoctorProfileDto response = new DoctorProfileDto();

        response.setDoctorId(doctor.getDoctorId());
        response.setEmail(signup.getEmail());
        response.setFullName(signup.getName());

        response.setDesignation(doctor.getDesignation());
        response.setDepartment(doctor.getDepartment());
        response.setPhoneNumber(doctor.getPhoneNumber());
        response.setYearsOfExperience(doctor.getYearsOfExperience());
        response.setHospitalName(doctor.getHospitalName());
        response.setProfileImage(doctor.getProfileImage());

        return response;
    }

    private void validateDoctorId(String value) {

        if (value == null || !value.matches("DOC\\d{5}")) {
            throw new BadRequestException("Doctor ID must match DOC + 5 digits");
        }
    }
}
