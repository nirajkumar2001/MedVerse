package com.tcs.medverse.event;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "medverse.kafka.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpDomainEventPublisher implements DomainEventPublisher {

    @Override
    public void publishMedicalRecordUpdated(MedicalRecordUpdatedEvent event) {
        // Kafka is disabled for local/test profiles.
    }
}
