package com.tcs.medverse.event;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "medverse.kafka.enabled", havingValue = "true")
public class KafkaDomainEventPublisher implements DomainEventPublisher {

    private static final String MEDICAL_RECORD_UPDATED_TOPIC = "medical-record-updated";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public void publishMedicalRecordUpdated(MedicalRecordUpdatedEvent event) {
        kafkaTemplate.send(MEDICAL_RECORD_UPDATED_TOPIC, event.patientId(), event);
    }
}
