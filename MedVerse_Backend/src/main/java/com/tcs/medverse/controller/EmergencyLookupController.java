package com.tcs.medverse.controller;

import com.tcs.medverse.dto.EmergencyLookupSearchResponseDto;
import com.tcs.medverse.dto.PatientDetailsResponseDto;
import com.tcs.medverse.service.EmergencyLookupService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/emergency")
public class EmergencyLookupController {

    private final EmergencyLookupService emergencyLookupService;

    public EmergencyLookupController(EmergencyLookupService emergencyLookupService) {
        this.emergencyLookupService = emergencyLookupService;
    }

    @GetMapping("/search")
    public ResponseEntity<EmergencyLookupSearchResponseDto> searchPatients(
            Authentication authentication,
            @RequestParam String query) {

        EmergencyLookupSearchResponseDto response = emergencyLookupService.searchPatients(authentication, query);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/patients/{patientId}")
    public ResponseEntity<PatientDetailsResponseDto> getPatientDetails(
            Authentication authentication,
            @PathVariable String patientId) {

        PatientDetailsResponseDto response = emergencyLookupService.getPatientDetails(authentication, patientId);

        return ResponseEntity.ok(response);
    }
}