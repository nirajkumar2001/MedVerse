package com.tcs.medverse.controller;

import com.tcs.medverse.dto.AuthenticationOfficerProfileDTO;
import com.tcs.medverse.dto.CaseVerificationDto;
import com.tcs.medverse.entity.CaseVerification;
import com.tcs.medverse.entity.SubmitNewCaseEntity;
import com.tcs.medverse.exception.AuthenticationProfileValidationException;
import com.tcs.medverse.exception.InvalidRemarksException;
import com.tcs.medverse.exception.OfficerNotFoundException;
import com.tcs.medverse.exception.RecordNotFoundException;
import com.tcs.medverse.service.AuthenticationOfficerProfileService;
import com.tcs.medverse.service.CaseVerificationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/v1/authofficer")
public class AuthenticationOfficerController {

    private final CaseVerificationService caseService;
    private final AuthenticationOfficerProfileService officerService;

    @Autowired
    public AuthenticationOfficerController(CaseVerificationService caseService,
                                           AuthenticationOfficerProfileService officerService) {
        this.caseService = caseService;
        this.officerService = officerService;
    }

    /* =========================================================
       ✅ CASE VERIFICATION APIs (DTO BASED)
    ========================================================= */

    // ✅ 1. Create Verification
    @PostMapping("/verifications")
    public ResponseEntity<String> createVerification(
            @RequestBody CaseVerificationDto dto) {

        caseService.createVerification(dto); // ✅ just call service

        return ResponseEntity.ok("Verification created successfully");
    }
    @GetMapping("/case/{caseId}")
    public ResponseEntity<Map<String, Object>> getCaseDetails(
            @PathVariable String caseId)
            throws RecordNotFoundException {
        SubmitNewCaseEntity item = caseService.getCaseDetails(caseId);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("caseId", item.getCaseId());
        response.put("learnerId", item.getLearnerId());
        response.put("caseTitle", item.getCaseTitle());
        response.put("caseDescription", item.getCaseDescription());
        response.put("caseDisease", item.getCaseDisease());
        response.put("caseDepartment", item.getCaseDepartment());
        response.put("approvalStatus", item.getApprovalStatus());
        response.put("submittedDate", item.getSubmittedDate());
        response.put("caseDocData", item.getCaseDocData());
        response.put("caseDocName", item.getCaseDocName());
        response.put("caseDocContentType", item.getCaseDocContentType());
        response.put("assignedOfficerId", item.getAssignedOfficerId());
        response.put("assignedOfficerName", item.getAssignedOfficerName());
        response.put("assignedOfficerDepartment", item.getAssignedOfficerDepartment());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cases")
    public ResponseEntity<Page<SubmitNewCaseEntity>> getSubmittedCases(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        if (authentication != null && authentication.getPrincipal() != null) {
            return ResponseEntity.ok(caseService.getSubmittedCasesForOfficer(
                    (String) authentication.getPrincipal(),
                    status,
                    page,
                    size
            ));
        }

        return ResponseEntity.ok(status == null || status.isBlank()
                ? caseService.getAllSubmittedCases(page, size)
                : caseService.getSubmittedCasesByStatus(status, page, size));
    }

    // ✅ 2. Verify Case
    @PutMapping("/verifications/{verificationId}/verify")
    public ResponseEntity<String> verifyCase(
            @PathVariable String verificationId,
            @RequestParam String status,
            @RequestParam String remarks,
            Authentication authentication)
            throws RecordNotFoundException, OfficerNotFoundException, InvalidRemarksException {

        caseService.verifyCase(verificationId, status, remarks, (String) authentication.getPrincipal());
        return ResponseEntity.ok("Case verified successfully");
    }

//    // ✅ 3. Get Verification by ID (DTO)
//    @GetMapping("/verifications/{verificationId}")
//    public ResponseEntity<CaseVerificationDto> getVerification(
//            @PathVariable String verificationId)
//            throws RecordNotFoundException {
//
//        return ResponseEntity.ok(caseService.getVerificationById(verificationId));
//    }

//    // ✅ 4. Delete Verification
//    @DeleteMapping("/verifications/{verificationId}")
//    public ResponseEntity<String> deleteVerification(
//            @PathVariable String verificationId)
//            throws RecordNotFoundException {
//
//        caseService.deleteVerification(verificationId);
//        return ResponseEntity.ok("Verification deleted successfully");
//    }

    // ✅ 5. Get by Case ID (DTO List)
    @GetMapping("/verifications/case/{caseId}")
    public ResponseEntity<List<CaseVerificationDto>> getByCaseId(
            @PathVariable String caseId) {

        return ResponseEntity.ok(caseService.getByCaseId(caseId));
    }

    // ✅ 6. Get by Status (DTO List)
    @GetMapping("/verifications/status/{status}")
    public ResponseEntity<List<CaseVerificationDto>> getByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(caseService.getByStatus(status));
    }

    /* =========================================================
       ✅ AUTHENTICATION OFFICER APIs
    ========================================================= */

    @GetMapping("/profile")
    public ResponseEntity<AuthenticationOfficerProfileDTO> getCurrentOfficerProfile(Authentication authentication) {
        return ResponseEntity.ok(officerService.getCurrentOfficerProfile((String) authentication.getPrincipal()));
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthenticationOfficerProfileDTO> updateCurrentOfficerProfile(
            Authentication authentication,
            @RequestBody AuthenticationOfficerProfileDTO dto)
            throws AuthenticationProfileValidationException {
        return ResponseEntity.ok(officerService.updateCurrentOfficerProfile((String) authentication.getPrincipal(), dto));
    }

    @RequestMapping(value = "/profile/image", method = {RequestMethod.POST, RequestMethod.PUT}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthenticationOfficerProfileDTO> uploadProfileImage(
            Authentication authentication,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {
        MultipartFile upload = file != null ? file : profileImage;
        if (upload == null || upload.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        String contentType = upload.getContentType() != null ? upload.getContentType() : "application/octet-stream";
        String dataUrl;
        try {
            dataUrl = "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(upload.getBytes());
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read uploaded file");
        }

        return ResponseEntity.ok(officerService.updateCurrentOfficerProfileImage(
                (String) authentication.getPrincipal(),
                dataUrl
        ));
    }

    @GetMapping("/officer/{authId}")
    public ResponseEntity<AuthenticationOfficerProfileDTO> getOfficerProfile(
            @PathVariable String authId)
            throws OfficerNotFoundException {

        return ResponseEntity.ok(officerService.getOfficerProfile(authId));
    }

    @PatchMapping("/officer/update/{authId}")
    public ResponseEntity<String> updateOfficerProfile(
            @PathVariable String authId,
            @RequestBody AuthenticationOfficerProfileDTO dto)
            throws OfficerNotFoundException, AuthenticationProfileValidationException {

        officerService.updateOfficerProfile(
                authId,
                dto.getHospitalName(),
                dto.getSpecialization(),
                dto.getContactNumber(),
                dto.getExperienceYears()
        );

        return ResponseEntity.ok("Profile updated successfully");
    }
}
