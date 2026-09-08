package com.tcs.medverse.controller;

import com.tcs.medverse.dto.ApiResponse;
import com.tcs.medverse.dto.MedicalProfileUpdateCreateRequest;
import com.tcs.medverse.dto.MedicalProfileUpdateResponse;
import com.tcs.medverse.dto.MedicalProfileUpdateUpdateRequest;
import com.tcs.medverse.dto.PatientMedicalRecordResponse;
import com.tcs.medverse.service.MedicalProfileUpdateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/editpatientprofile")
public class MedicalProfileUpdateController {

        private final MedicalProfileUpdateService medicalProfileUpdateService;

        public MedicalProfileUpdateController(MedicalProfileUpdateService medicalProfileUpdateService) {
                this.medicalProfileUpdateService = medicalProfileUpdateService;
        }

        @GetMapping({"/record/{patientId}", "/patient/{patientId}"})
        public ResponseEntity<ApiResponse<PatientMedicalRecordResponse>> getCompleteRecordForDoctor(
                        Authentication authentication,
                        @PathVariable String patientId,
                        @RequestParam String sessionId) {

                PatientMedicalRecordResponse response = medicalProfileUpdateService
                                .getCompleteRecordForDoctor(authentication, patientId, sessionId);

                return ResponseEntity.ok(
                                ApiResponse.success("Patient medical record fetched successfully", response));
        }

        @GetMapping("/me/record")
        public ResponseEntity<ApiResponse<PatientMedicalRecordResponse>> getMyMedicalRecord(
                        Authentication authentication) {

                PatientMedicalRecordResponse response = medicalProfileUpdateService.getMyMedicalRecord(authentication);

                return ResponseEntity.ok(
                                ApiResponse.success("Patient medical record fetched successfully", response));
        }

        @GetMapping("/session/{sessionId}")
        public ResponseEntity<ApiResponse<List<MedicalProfileUpdateResponse>>> getSessionUpdates(
                        Authentication authentication,
                        @PathVariable String sessionId) {

                List<MedicalProfileUpdateResponse> response = medicalProfileUpdateService
                                .getSessionUpdates(authentication, sessionId);

                return ResponseEntity.ok(
                                ApiResponse.success("Session medical updates fetched successfully", response));
        }

        @PostMapping
        public ResponseEntity<ApiResponse<MedicalProfileUpdateResponse>> createUpdate(
                        Authentication authentication,
                        @Valid @RequestBody MedicalProfileUpdateCreateRequest request) {

                MedicalProfileUpdateResponse response = medicalProfileUpdateService.createUpdate(authentication,
                                request);

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Medical profile update saved successfully", response));
        }

        @PutMapping("/{updateId}")
        public ResponseEntity<ApiResponse<MedicalProfileUpdateResponse>> updateExisting(
                        Authentication authentication,
                        @PathVariable Long updateId,
                        @Valid @RequestBody MedicalProfileUpdateUpdateRequest request) {

                MedicalProfileUpdateResponse response = medicalProfileUpdateService.updateExisting(authentication,
                                updateId, request);

                return ResponseEntity.ok(
                                ApiResponse.success("Medical profile update changed successfully", response));
        }
}