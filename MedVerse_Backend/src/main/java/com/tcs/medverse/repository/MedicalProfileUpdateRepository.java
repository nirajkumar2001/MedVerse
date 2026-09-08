package com.tcs.medverse.repository;

import com.tcs.medverse.entity.MedicalProfileUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalProfileUpdateRepository extends JpaRepository<MedicalProfileUpdate, Long> {

    List<MedicalProfileUpdate> findByPatientIdOrderByDateOfUpdateDesc(String patientId);

    List<MedicalProfileUpdate> findBySessionIdOrderByDateOfUpdateDesc(String sessionId);

    List<MedicalProfileUpdate> findByDoctorIdOrderByDateOfUpdateDesc(String doctorId);

    List<MedicalProfileUpdate> findByPatientIdAndDoctorIdOrderByDateOfUpdateDesc(
            String patientId,
            String doctorId);
}