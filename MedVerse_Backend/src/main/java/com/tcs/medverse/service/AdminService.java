package com.tcs.medverse.service;

import com.tcs.medverse.entity.*;
import com.tcs.medverse.dto.*;
import com.tcs.medverse.repository.*;
import com.tcs.medverse.exception.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ProfileRepository profileRepository;
    private final AlertRepository alertRepository;
    private final AdminRepository adminRepository;
    private final SignupRepository signupRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final ProfileManageRepository profileManageRepository;
    private final LearnerRepository learnerRepository;
    private final AuthenticationOfficerProfileRepository authenticationOfficerProfileRepository;
    private final LoginRepository loginRepository;

    /* ================= DASHBOARD ================= */

    public DashboardStatsDto getDashboardStats() {

        syncProfileManageFromSignups();

        long totalProfiles = profileManageRepository.count();
        long pendingProfiles = profileManageRepository.countByStatus(com.tcs.medverse.enums.AuthStatus.PENDING);
        long approvedProfiles = profileManageRepository.countByStatus(com.tcs.medverse.enums.AuthStatus.APPROVED);
        long rejectedProfiles = profileManageRepository.countByStatus(com.tcs.medverse.enums.AuthStatus.REJECTED);
        long doctors = profileManageRepository.countByRole(com.tcs.medverse.enums.Role.DOCTOR);
        long alerts = alertRepository.count();
        double approvalRate = totalProfiles == 0 ? 0.0 : Math.round((approvedProfiles * 10000.0) / totalProfiles) / 100.0;

        return new DashboardStatsDto(
                totalProfiles,
                approvedProfiles,
                doctors,
                alerts,
                rejectedProfiles,
                approvalRate,
                pendingProfiles,
                0
        );
    }

    /* ================= PROFILE ================= */

    public List<ProfileApprovalDto> getAllProfiles(String status) {

        List<Profile> list = "all".equalsIgnoreCase(status)
                ? profileRepository.findAll()
                : profileRepository.findByStatus(status.toUpperCase());

        return list.stream()
                .map(this::mapToProfileApprovalDto)
                .collect(Collectors.toList());
    }

    public ProfileDetailDto getProfileDetails(Integer userId) {

        Profile p = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        return mapToProfileDetailDto(p);
    }

    public String approveProfile(Integer userId) {

        Profile p = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if ("APPROVED".equalsIgnoreCase(p.getStatus())) {
            return "Profile already approved";
        }

        p.setStatus("APPROVED");
        profileRepository.save(p);

        return "✅ Profile approved successfully";
    }

    public String rejectProfile(Integer userId, String reason) {

        Profile p = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if ("REJECTED".equalsIgnoreCase(p.getStatus())) {
            return "Profile already rejected";
        }

        p.setStatus("REJECTED");
        profileRepository.save(p);

        return "❌ Profile rejected: " + (reason != null ? reason : "No reason provided");
    }

    /* ================= SIGNUP USERS ================= */

    public List<AdminUserResponse> getSignupUsers(String status) {
        syncProfileManageFromSignups();

        List<ProfileManage> profiles = profileManageRepository.findAll();
        if (status != null && !"all".equalsIgnoreCase(status)) {
            profiles = profiles.stream()
                    .filter(profile -> profile.getStatus() != null
                            && profile.getStatus().name().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }
        return profiles.stream()
                .map(this::mapToAdminUserResponse)
                .collect(Collectors.toList());
    }

    public AdminUserResponse getSignupUser(String userId) {
        syncProfileManageFromSignups();
        ProfileManage profile = profileManageRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile manage record not found"));
        return mapToAdminUserResponse(profile);
    }

    public String approveSignupUser(String userId, String reason) {
        Signup signup = signupRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Signup user not found"));
        signup.setAuthStatus(com.tcs.medverse.enums.AuthStatus.APPROVED);
        signupRepository.save(signup);
        ProfileManage profile = ensureProfileManage(signup);
        profile.setStatus(com.tcs.medverse.enums.AuthStatus.APPROVED);
        profile.setReviewRemark(reason);
        profile.setReviewedAt(LocalDateTime.now());
        profileManageRepository.save(profile);
        createHealthcareProfileIfRequired(signup);
        return "Signup user approved successfully";
    }

    public String rejectSignupUser(String userId, String reason) {
        Signup signup = signupRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Signup user not found"));
        ProfileManage profile = ensureProfileManage(signup);
        int rejectionCount = profile.getRejectionCount() + 1;
        profile.setRejectionCount(rejectionCount);
        if (rejectionCount >= 3) {
            signup.setAuthStatus(com.tcs.medverse.enums.AuthStatus.SUSPENDED);
            signup.setActive(false);
            profile.setStatus(com.tcs.medverse.enums.AuthStatus.SUSPENDED);
        } else {
            signup.setAuthStatus(com.tcs.medverse.enums.AuthStatus.REJECTED);
            profile.setStatus(com.tcs.medverse.enums.AuthStatus.REJECTED);
        }
        signupRepository.save(signup);
        profile.setReviewRemark(reason);
        profile.setReviewedAt(LocalDateTime.now());
        profileManageRepository.save(profile);
        if (rejectionCount >= 3) {
            return "Signup user disabled after 3 rejected verification attempts";
        }
        return "Signup user rejected" + (reason != null && !reason.isBlank() ? ": " + reason : "");
    }

    /* ================= ALERT ================= */

    public AdminAlertPageResponse getAlerts(String status, int page, int size) {
        String normalized = status == null ? "all" : status.trim().toLowerCase();
        int safeSize = Math.min(Math.max(size, 1), 30);
        int safePage = Math.max(page, 0);
        List<AlertDto> filtered = loginRepository.findTop200ByOrderByLoginAtDesc().stream()
                .map(this::mapLoginActivityToAlert)
                .filter(alert -> !"all".equals(normalized)
                        ? normalized.equals(alert.getStatus().toLowerCase())
                        : true)
                .collect(Collectors.toList());
        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());
        List<AlertDto> items = filtered.subList(fromIndex, toIndex);
        int totalPages = filtered.isEmpty() ? 0 : (int) Math.ceil(filtered.size() / (double) safeSize);
        return new AdminAlertPageResponse(items, safePage, safeSize, filtered.size(), totalPages, safePage + 1 < totalPages);
    }

    public String resolveAlert(String id) {

        Login activity = loginRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (isFailureStatus(activity.getLoginStatus())) {
            activity.setLoginStatus("MANUALLY_RESOLVED_" + activity.getLoginStatus());
            loginRepository.save(activity);
        }

        return "✅ Alert resolved";
    }

    public String deleteAlert(String id) {

        if (!loginRepository.existsById(id)) {
            throw new ResourceNotFoundException("Activity not found");
        }

        loginRepository.deleteById(id);
        return "🗑️ Alert deleted";
    }

    /* ================= MAPPERS ================= */

    private ProfileApprovalDto mapToProfileApprovalDto(Profile p) {

        ProfileApprovalDto dto = new ProfileApprovalDto();
        dto.setUserId(p.getUserId());
        dto.setName(p.getName());
        dto.setId("ID-" + p.getUserId());
        dto.setRole(p.getRoleType());
        dto.setStatus(p.getStatus());
        dto.setSubmittedAt(p.getSubmittedAt());

        return dto;
    }

    private ProfileDetailDto mapToProfileDetailDto(Profile p) {

        ProfileDetailDto dto = new ProfileDetailDto();
        dto.setUserId(p.getUserId());
        dto.setName(p.getName());
        dto.setEmail(p.getEmail());
        dto.setRole(p.getRoleType());
        dto.setStatus(p.getStatus());
        dto.setDocumentUrl(p.getDocument());
        dto.setSubmittedAt(
                p.getSubmittedAt() != null ? p.getSubmittedAt().toString() : ""
        );

        return dto;
    }

    private AdminUserResponse mapToAdminUserResponse(ProfileManage profile) {
        Signup signup = signupRepository.findByUserId(profile.getUserId()).orElse(null);
        return new AdminUserResponse(
                profile.getSignupId(),
                profile.getUserId(),
                profile.getAuthRefId(),
                profile.getName(),
                profile.getEmail(),
                profile.getRole(),
                profile.getStatus(),
                signup == null || signup.isActive(),
                profile.getSubmittedAt(),
                findProfileUpdatedAt(profile),
                profile.getDocumentName(),
                profile.getDocumentContentType(),
                profile.getDocumentData(),
                profile.getReviewRemark(),
                profile.getReviewedAt(),
                findProfileImage(profile)
        );
    }

    private String findProfileImage(ProfileManage profile) {
        if (profile.getRole() == com.tcs.medverse.enums.Role.LEARNER) {
            return learnerRepository.findById(profile.getUserId())
                    .map(LearnerEntity::getProfileImage)
                    .orElse("");
        }
        if (profile.getRole() == com.tcs.medverse.enums.Role.AUTHOFFICER) {
            return authenticationOfficerProfileRepository.findById(profile.getUserId())
                    .map(AuthenticationOfficerProfile::getProfileImage)
                    .orElse("");
        }
        if (profile.getRole() == com.tcs.medverse.enums.Role.PATIENT) {
            return patientRepository.findById(profile.getUserId())
                    .map(Patient::getProfileImage)
                    .orElse("");
        }
        if (profile.getRole() == com.tcs.medverse.enums.Role.DOCTOR) {
            return doctorRepository.findById(profile.getUserId())
                    .map(Doctor::getProfileImage)
                    .orElse("");
        }
        return "";
    }

    private LocalDateTime findProfileUpdatedAt(ProfileManage profile) {
        if (profile.getRole() == com.tcs.medverse.enums.Role.PATIENT) {
            return patientRepository.findById(profile.getUserId())
                    .map(Patient::getProfileUpdatedAt)
                    .orElse(profile.getUpdatedAt());
        }
        return profile.getUpdatedAt();
    }

    private void syncProfileManageFromSignups() {
        signupRepository.findAll().forEach(this::ensureProfileManage);
    }

    private ProfileManage ensureProfileManage(Signup signup) {
        return profileManageRepository.findById(signup.getUserId())
                .orElseGet(() -> {
                    ProfileManage profile = new ProfileManage();
                    profile.setUserId(signup.getUserId());
                    profile.setSignupId(signup.getId());
                    profile.setAuthRefId(signup.getAuthRefId());
                    profile.setName(signup.getName());
                    profile.setEmail(signup.getEmail());
                    profile.setRole(signup.getRole());
                    profile.setStatus(signup.getAuthStatus());
                    return profileManageRepository.save(profile);
                });
    }

    private void createHealthcareProfileIfRequired(Signup signup) {
        if (signup.getRole() == com.tcs.medverse.enums.Role.DOCTOR
                && !doctorRepository.existsById(signup.getUserId())) {
            Doctor doctor = new Doctor();
            doctor.setDoctorId(signup.getUserId());
            doctorRepository.save(doctor);
            return;
        }

        if (signup.getRole() == com.tcs.medverse.enums.Role.PATIENT
                && !patientRepository.existsById(signup.getUserId())) {
            Patient patient = new Patient();
            patient.setPatientId(signup.getUserId());
            patient.setEmail(signup.getEmail());
            patient.setName(signup.getName());
            patientRepository.save(patient);
        }
    }

    private AlertDto mapToAlertDto(Alert a) {

        AlertDto dto = new AlertDto();
        dto.setId(String.valueOf(a.getAlertId()));
        dto.setType(a.getType());
        dto.setSeverity(a.getSeverity());
        dto.setDate(a.getDate());
        dto.setStatus(a.getStatus());
        dto.setMessage(a.getMessage());

        return dto;
    }

    private AlertDto mapLoginActivityToAlert(Login login) {
        AlertDto dto = new AlertDto();
        dto.setId(login.getLoginId());
        dto.setType("Authentication Activity");
        dto.setSeverity(isFailureStatus(login.getLoginStatus()) ? "HIGH" : "INFO");
        dto.setDate(login.getLoginAt());
        dto.setStatus(isFailureStatus(login.getLoginStatus()) ? "FAILED" : "SUCCESS");
        dto.setMessage(buildAuthActivityMessage(login));
        return dto;
    }

    private boolean isFailureStatus(String status) {
        if (status == null) {
            return false;
        }
        return status.contains("FAILED")
                || status.contains("REJECTED")
                || status.contains("SUSPENDED")
                || status.contains("EXCEEDED")
                || status.contains("PENDING");
    }

    private String buildAuthActivityMessage(Login login) {
        String userId = login.getUserId() != null ? login.getUserId() : "Unknown User";
        String status = login.getLoginStatus() == null ? "UNKNOWN" : login.getLoginStatus();

        return switch (status) {
            case "SUCCESS" -> userId + " logged in successfully.";
            case "FAILED_INVALID_PASSWORD" -> userId + " attempted login with incorrect password.";
            case "PROFILE_PENDING" -> userId + " attempted login while profile was pending approval.";
            case "PROFILE_REJECTED" -> userId + " attempted login while profile was rejected.";
            case "ACCOUNT_SUSPENDED", "DISABLED" -> userId + " attempted login on a suspended account.";
            case "DEVICE_LIMIT_EXCEEDED" -> userId + " attempted login but reached device limit.";
            case "PASSWORD_RESET_REQUESTED" -> userId + " requested password reset OTP.";
            case "FORGOT_PASSWORD_SUCCESS" -> userId + " successfully requested forgot-password OTP.";
            case "PASSWORD_RESET_SUCCESS" -> userId + " reset password successfully.";
            case "PASSWORD_RESET_FAILED" -> userId + " failed password reset attempt.";
            case "VERIFY_OTP_SUCCESS" -> userId + " completed OTP verification successfully.";
            case "VERIFY_OTP_FAILED" -> userId + " failed OTP verification.";
            case "CHANGE_PASSWORD_SUCCESS" -> userId + " changed password successfully.";
            case "CHANGE_PASSWORD_FAILED" -> userId + " failed to change password.";
            case "LOGOUT_SUCCESS" -> userId + " logged out successfully.";
            case "FAILED_INVALID_USER" -> userId + " attempted login with invalid user ID.";
            default -> userId + " authentication activity: " + status + ".";
        };
    }
}
