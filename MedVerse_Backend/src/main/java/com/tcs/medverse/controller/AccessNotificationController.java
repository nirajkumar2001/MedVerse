package com.tcs.medverse.controller;

import com.tcs.medverse.dto.AccessNotificationCreateRequest;
import com.tcs.medverse.dto.AccessNotificationDecisionRequest;
import com.tcs.medverse.dto.AccessNotificationEndRequest;
import com.tcs.medverse.dto.AccessNotificationResponse;
import com.tcs.medverse.dto.AccessNotificationUpdateRequest;
import com.tcs.medverse.dto.ApiResponse;
import com.tcs.medverse.service.AccessNotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accessnotification")
public class AccessNotificationController {

    private final AccessNotificationService accessNotificationService;

    public AccessNotificationController(AccessNotificationService accessNotificationService) {
        this.accessNotificationService = accessNotificationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AccessNotificationResponse>> create(
            Authentication authentication,
            @Valid @RequestBody AccessNotificationCreateRequest request) {

        AccessNotificationResponse response = accessNotificationService.create(authentication, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Access notification created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccessNotificationResponse>>> getAll(
            Authentication authentication) {

        List<AccessNotificationResponse> list = accessNotificationService.getAll(authentication);

        return ResponseEntity.ok(
                ApiResponse.success("Fetched successfully", list));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<AccessNotificationResponse>> getBySessionId(
            Authentication authentication,
            @PathVariable String sessionId) {

        AccessNotificationResponse response = accessNotificationService.getBySessionId(authentication, sessionId);

        return ResponseEntity.ok(
                ApiResponse.success("Fetched successfully", response));
    }

    @GetMapping("/doctor/me")
    public ResponseEntity<ApiResponse<List<AccessNotificationResponse>>> getForCurrentDoctor(
            Authentication authentication,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {

        List<AccessNotificationResponse> list = accessNotificationService.getForCurrentDoctor(authentication,
                unreadOnly);

        return ResponseEntity.ok(
                ApiResponse.success("Fetched successfully", list));
    }

    @GetMapping("/patient/me")
    public ResponseEntity<ApiResponse<List<AccessNotificationResponse>>> getForCurrentPatient(
            Authentication authentication,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {

        List<AccessNotificationResponse> list = accessNotificationService.getForCurrentPatient(authentication,
                unreadOnly);

        return ResponseEntity.ok(
                ApiResponse.success("Fetched successfully", list));
    }

    @Deprecated
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<AccessNotificationResponse>>> getByDoctorId(
            Authentication authentication,
            @PathVariable String doctorId,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {

        List<AccessNotificationResponse> list = accessNotificationService.getByDoctorId(authentication, doctorId,
                unreadOnly);

        return ResponseEntity.ok(
                ApiResponse.success("Fetched successfully", list));
    }

    @Deprecated
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<AccessNotificationResponse>>> getByPatientId(
            Authentication authentication,
            @PathVariable String patientId,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {

        List<AccessNotificationResponse> list = accessNotificationService.getByPatientId(authentication, patientId,
                unreadOnly);

        return ResponseEntity.ok(
                ApiResponse.success("Fetched successfully", list));
    }

    @PutMapping("/{sessionId}/decision")
    public ResponseEntity<ApiResponse<AccessNotificationResponse>> decide(
            Authentication authentication,
            @PathVariable String sessionId,
            @Valid @RequestBody AccessNotificationDecisionRequest request) {

        AccessNotificationResponse response = accessNotificationService.decide(authentication, sessionId, request);

        return ResponseEntity.ok(
                ApiResponse.success("Access request decision saved successfully", response));
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<AccessNotificationResponse>> update(
            Authentication authentication,
            @PathVariable String sessionId,
            @Valid @RequestBody AccessNotificationUpdateRequest request) {

        AccessNotificationResponse response = accessNotificationService.update(authentication, sessionId, request);

        return ResponseEntity.ok(
                ApiResponse.success("Updated successfully", response));
    }

    @PatchMapping("/{sessionId}/read")
    public ResponseEntity<ApiResponse<AccessNotificationResponse>> markAsRead(
            Authentication authentication,
            @PathVariable String sessionId) {

        AccessNotificationResponse response = accessNotificationService.markAsRead(authentication, sessionId);

        return ResponseEntity.ok(
                ApiResponse.success("Marked as read", response));
    }

    @PatchMapping("/{sessionId}/reminder")
    public ResponseEntity<ApiResponse<AccessNotificationResponse>> sendReminder(
            Authentication authentication,
            @PathVariable String sessionId) {

        AccessNotificationResponse response = accessNotificationService.sendReminder(authentication, sessionId);

        return ResponseEntity.ok(
                ApiResponse.success("Reminder sent", response));
    }

    @PatchMapping("/{sessionId}/end-session")
    public ResponseEntity<ApiResponse<AccessNotificationResponse>> endSession(
            Authentication authentication,
            @PathVariable String sessionId,
            @RequestBody AccessNotificationEndRequest request) {

        AccessNotificationResponse response = accessNotificationService.endSession(authentication, sessionId, request);

        return ResponseEntity.ok(
                ApiResponse.success("Access session ended successfully", response));
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            Authentication authentication,
            @PathVariable String sessionId) {

        accessNotificationService.delete(authentication, sessionId);

        return ResponseEntity.ok(
                ApiResponse.success("Deleted successfully", null));
    }
}