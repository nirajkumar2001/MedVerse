package com.tcs.medverse.controller;

import com.tcs.medverse.dto.ApiResponse;
import com.tcs.medverse.dto.PatientRequestDTO;
import com.tcs.medverse.dto.PatientResponseDTO;
import com.tcs.medverse.service.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({ "/api/v1/patient", "/api/patient" })
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PatientResponseDTO>> getMyProfile(Authentication authentication) {
        PatientResponseDTO response = patientService.getMyProfile(authentication);

        return ResponseEntity.ok(
                ApiResponse.success("Patient profile fetched successfully", response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<PatientResponseDTO>> updateMyProfile(
            Authentication authentication,
            @RequestBody PatientRequestDTO request) {

        PatientResponseDTO response = patientService.updateMyProfile(authentication, request);

        return ResponseEntity.ok(
                ApiResponse.success("Patient profile updated successfully", response));
    }
}