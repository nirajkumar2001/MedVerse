package com.tcs.medverse.repository;

import com.tcs.medverse.entity.LearnerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearnerRepository extends JpaRepository<LearnerEntity, String> {
    Optional<LearnerEntity> findByEmail(String email);
}
