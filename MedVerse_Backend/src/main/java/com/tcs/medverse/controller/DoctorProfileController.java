package com.tcs.medverse.controller;

import com.tcs.medverse.service.DoctorProfileService;
import com.tcs.medverse.dto.ApiResponse;
import com.tcs.medverse.dto.DoctorProfileDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/doctorprofile")
@Validated
public class DoctorProfileController {

    private final DoctorProfileService doctorProfileService;

    public DoctorProfileController(DoctorProfileService doctorProfileService) {
        this.doctorProfileService = doctorProfileService;
    }

    // Create doctor profile after signup
    @PostMapping
    public ResponseEntity<ApiResponse<DoctorProfileDto>> create(
            Authentication authentication
    ) {

        DoctorProfileDto response = doctorProfileService.create(authentication);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Doctor profile created successfully", response));
    }

    // Get doctor profile by doctorId
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<DoctorProfileDto>> getByDoctorId(
            Authentication authentication
    ) {

        DoctorProfileDto response = doctorProfileService.getMe(authentication);

        return ResponseEntity.ok(
                ApiResponse.success("Doctor profile fetched successfully", response)
        );
    }

    // Update doctor profile
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<DoctorProfileDto>> update(
            Authentication authentication,
            @Valid @RequestBody DoctorProfileDto request
    ) {

        DoctorProfileDto response = doctorProfileService.update(authentication, request);

        return ResponseEntity.ok(
                ApiResponse.success("Doctor profile updated successfully", response)
        );
    }

    @RequestMapping(value = "/me/image", method = {RequestMethod.POST, RequestMethod.PUT}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DoctorProfileDto>> updateProfileImage(
            Authentication authentication,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage
    ) {
        MultipartFile upload = file != null ? file : profileImage;
        DoctorProfileDto response = doctorProfileService.updateProfileImage(authentication, upload);

        return ResponseEntity.ok(
                ApiResponse.success("Doctor profile image updated successfully", response)
        );
    }

    @DeleteMapping("/me/image")
    public ResponseEntity<ApiResponse<DoctorProfileDto>> removeProfileImage(Authentication authentication) {
        DoctorProfileDto response = doctorProfileService.removeProfileImage(authentication);

        return ResponseEntity.ok(
                ApiResponse.success("Doctor profile image removed successfully", response)
        );
    }

    @Deprecated
    @PostMapping("/{doctorId}")
    public ResponseEntity<ApiResponse<DoctorProfileDto>> createLegacy(
            @PathVariable String doctorId,
            Authentication authentication
    ) {
        return create(authentication);
    }

    @Deprecated
    @GetMapping("/{doctorId}")
    public ResponseEntity<ApiResponse<DoctorProfileDto>> getLegacy(
            @PathVariable String doctorId,
            Authentication authentication
    ) {
        return getByDoctorId(authentication);
    }

    @Deprecated
    @PutMapping("/{doctorId}")
    public ResponseEntity<ApiResponse<DoctorProfileDto>> updateLegacy(
            @PathVariable String doctorId,
            @Valid @RequestBody DoctorProfileDto request,
            Authentication authentication
    ) {
        return update(authentication, request);
    }
}
