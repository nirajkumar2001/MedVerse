package com.tcs.medverse.service;

import com.tcs.medverse.dto.SupportTicketCreateRequest;
import com.tcs.medverse.dto.SupportTicketResponse;
import com.tcs.medverse.entity.SupportTicket;
import com.tcs.medverse.exception.BadRequestException;
import com.tcs.medverse.repository.SupportTicketRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupportTicketService {
    private final SupportTicketRepository repository;

    public SupportTicketService(SupportTicketRepository repository) {
        this.repository = repository;
    }

    public SupportTicketResponse create(Authentication authentication, SupportTicketCreateRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().trim().length() < 5) {
            throw new BadRequestException("Support concern must contain at least 5 characters");
        }

        SupportTicket ticket = new SupportTicket();
        ticket.setUserId(authentication != null ? authentication.getName() : "anonymous");
        ticket.setUserRole(clean(request.getUserRole(), "UNKNOWN"));
        ticket.setCategory(clean(request.getCategory(), "General support"));
        ticket.setMessage(request.getMessage().trim());
        ticket.setStatus("OPEN");

        return toResponse(repository.save(ticket));
    }

    public List<SupportTicketResponse> getTickets(String status) {
        List<SupportTicket> tickets = status == null || "all".equalsIgnoreCase(status)
                ? repository.findAllByOrderByCreatedAtDesc()
                : repository.findByStatusIgnoreCaseOrderByCreatedAtDesc(status);

        return tickets.stream().map(this::toResponse).toList();
    }

    public long countOpenTickets() {
        return repository.countByStatusIgnoreCase("OPEN");
    }

    private SupportTicketResponse toResponse(SupportTicket ticket) {
        SupportTicketResponse response = new SupportTicketResponse();
        response.setTicketId(ticket.getTicketId());
        response.setUserId(ticket.getUserId());
        response.setUserRole(ticket.getUserRole());
        response.setCategory(ticket.getCategory());
        response.setMessage(ticket.getMessage());
        response.setStatus(ticket.getStatus());
        response.setCreatedAt(ticket.getCreatedAt() != null ? ticket.getCreatedAt().toString() : "");
        return response;
    }

    private String clean(String value, String fallback) {
        return value != null && !value.isBlank() ? value.trim() : fallback;
    }
}
