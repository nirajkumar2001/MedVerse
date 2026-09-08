package com.tcs.medverse.event;

import java.time.LocalDateTime;

public record MedicalRecordUpdatedEvent(
        Long updateId,
        String patientId,
        String doctorId,
        String sessionId,
        LocalDateTime occurredAt
) {
}
