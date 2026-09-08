package com.tcs.medverse.controller;

import com.tcs.medverse.dto.ApiResponse;
import com.tcs.medverse.dto.SupportTicketCreateRequest;
import com.tcs.medverse.dto.SupportTicketResponse;
import com.tcs.medverse.service.SupportTicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/support")
public class SupportTicketController {
    private final SupportTicketService service;

    public SupportTicketController(SupportTicketService service) {
        this.service = service;
    }

    @PostMapping("/tickets")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> create(
            Authentication authentication,
            @RequestBody SupportTicketCreateRequest request
    ) {
        SupportTicketResponse response = service.create(authentication, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Support concern submitted successfully", response));
    }
}
