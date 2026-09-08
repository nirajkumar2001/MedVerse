package com.tcs.medverse.repository;

import com.tcs.medverse.entity.PatientMedicalProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientMedicalProfileRepository extends JpaRepository<PatientMedicalProfile, Long> {

    Optional<PatientMedicalProfile> findByPatientId(String patientId);

    boolean existsByPatientId(String patientId);
}