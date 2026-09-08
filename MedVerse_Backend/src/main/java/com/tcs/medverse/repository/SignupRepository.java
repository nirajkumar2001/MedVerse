package com.tcs.medverse.repository;

import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SignupRepository extends JpaRepository<Signup, String> {
    Optional<Signup> findByUserId(String userId);
    Optional<Signup> findByAuthRefId(String authRefId);
    Optional<Signup> findByEmail(String email);
    Optional<Signup> findByEmailAndRole(String email, Role role);
    boolean existsByUserId(String userId);
    boolean existsByEmail(String email);
    boolean existsByEmailAndRole(String email, Role role);
    long countByRole(Role role);
}