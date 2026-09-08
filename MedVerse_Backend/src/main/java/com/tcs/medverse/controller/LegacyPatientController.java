package com.tcs.medverse.controller;

import com.tcs.medverse.dto.PatientResponseDTO;
import com.tcs.medverse.dto.PatientRequestDTO;
import com.tcs.medverse.dto.ApiResponse;
import com.tcs.medverse.service.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patient")
public class LegacyPatientController {

    private final PatientService patientService;

    public LegacyPatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping("/{patientId}")
    public PatientResponseDTO getPatientForDoctor(
            Authentication authentication,
            @PathVariable String patientId) {
        return patientService.getPatientForDoctor(authentication, patientId);
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<PatientResponseDTO>> updateMyProfile(
            Authentication authentication,
            @RequestBody PatientRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Patient profile updated successfully",
                patientService.updateMyProfile(authentication, request)));
    }
}