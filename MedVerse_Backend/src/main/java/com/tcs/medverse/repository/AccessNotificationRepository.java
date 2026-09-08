package com.tcs.medverse.repository;

import com.tcs.medverse.entity.AccessNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccessNotificationRepository extends JpaRepository<AccessNotification, String> {

        List<AccessNotification> findByDoctorIdOrderByNotifiedAtDesc(String doctorId);

        List<AccessNotification> findByPatientIdOrderByNotifiedAtDesc(String patientId);

        List<AccessNotification> findByDoctorIdAndReadFalseOrderByNotifiedAtDesc(String doctorId);

        List<AccessNotification> findByPatientIdAndReadFalseOrderByNotifiedAtDesc(String patientId);

        Optional<AccessNotification> findFirstByPatientIdAndDoctorIdAndAccessStatusAndAccessEndedAtIsNull(
                        String patientId,
                        String doctorId,
                        String accessStatus);

        List<AccessNotification> findByPatientIdAndDoctorIdOrderByNotifiedAtDesc(
                        String patientId,
                        String doctorId);

        List<AccessNotification> findByPatientIdAndAccessStatusOrderByNotifiedAtDesc(
                        String patientId,
                        String accessStatus);

        List<AccessNotification> findByDoctorIdAndAccessStatusOrderByNotifiedAtDesc(
                        String doctorId,
                        String accessStatus);
}