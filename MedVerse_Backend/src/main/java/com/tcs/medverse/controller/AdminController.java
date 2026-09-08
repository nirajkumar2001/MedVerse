package com.tcs.medverse.controller;

import com.tcs.medverse.dto.*;

import com.tcs.medverse.service.AdminService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping
    public String returnSomething() {
        return "✅ Admin API Working";
    }

    /* ================= DASHBOARD ================= */

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    /* ================= PROFILE ================= */

    @GetMapping("/profiles")
    public ResponseEntity<List<ProfileApprovalDto>> getAllProfiles(
            @RequestParam(defaultValue = "all") String status) {

        return ResponseEntity.ok(adminService.getAllProfiles(status));
    }

    @GetMapping("/profiles/{userId}")
    public ResponseEntity<ProfileDetailDto> getProfileDetails(
            @PathVariable Integer userId) {

        return ResponseEntity.ok(adminService.getProfileDetails(userId));
    }

    @PutMapping("/profiles/{userId}/approve")
    public ResponseEntity<String> approveProfile(
            @PathVariable Integer userId) {

        return ResponseEntity.ok(adminService.approveProfile(userId));
    }

    @PutMapping("/profiles/{userId}/reject")
    public ResponseEntity<String> rejectProfile(
            @PathVariable Integer userId,
            @RequestBody(required = false) ProfileRejectRequest request) {

        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(adminService.rejectProfile(userId, reason));
    }

    /* ================= SIGNUP USERS ================= */

    @GetMapping("/signup-users")
    public ResponseEntity<List<AdminUserResponse>> getSignupUsers(
            @RequestParam(defaultValue = "all") String status) {

        return ResponseEntity.ok(adminService.getSignupUsers(status));
    }

    @GetMapping("/signup-users/{userId}")
    public ResponseEntity<AdminUserResponse> getSignupUser(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.getSignupUser(userId));
    }

    @PutMapping("/signup-users/{userId}/approve")
    public ResponseEntity<String> approveSignupUser(
            @PathVariable String userId,
            @RequestBody(required = false) ProfileRejectRequest request) {

        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(adminService.approveSignupUser(userId, reason));
    }

    @PutMapping("/signup-users/{userId}/reject")
    public ResponseEntity<String> rejectSignupUser(
            @PathVariable String userId,
            @RequestBody(required = false) ProfileRejectRequest request) {

        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(adminService.rejectSignupUser(userId, reason));
    }

    /* ================= ALERT ================= */

    @GetMapping("/alerts")
    public ResponseEntity<AdminAlertPageResponse> getAlerts(
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(adminService.getAlerts(status, page, size));
    }

    @PutMapping("/alerts/{alertId}/resolve")
    public ResponseEntity<String> resolveAlert(@PathVariable String alertId) {
        return ResponseEntity.ok(adminService.resolveAlert(alertId));
    }

    @DeleteMapping("/alerts/{alertId}")
    public ResponseEntity<String> deleteAlert(@PathVariable String alertId) {
        return ResponseEntity.ok(adminService.deleteAlert(alertId));
    }

    /* ================= HEALTH ================= */

    @GetMapping("/health")
    public String healthCheck() {
        return "✅ MedVerse Admin Module is Active";
    }
}
