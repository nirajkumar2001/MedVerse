package com.tcs.medverse.event;

public interface DomainEventPublisher {
    void publishMedicalRecordUpdated(MedicalRecordUpdatedEvent event);
}
