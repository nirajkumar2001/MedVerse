package com.tcs.medverse.repository;

import com.tcs.medverse.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
    long countByStatusIgnoreCase(String status);
}
