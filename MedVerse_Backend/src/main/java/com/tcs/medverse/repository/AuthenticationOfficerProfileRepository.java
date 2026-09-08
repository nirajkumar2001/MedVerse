package com.tcs.medverse.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tcs.medverse.entity.AuthenticationOfficerProfile;

import java.util.List;

public interface AuthenticationOfficerProfileRepository
        extends JpaRepository<AuthenticationOfficerProfile, String> {

    // ✅ Equivalent of getOfficersByHospital
    List<AuthenticationOfficerProfile> findByHospitalName(String hospitalName);

    // ✅ Equivalent of getOfficersBySpecialization
    List<AuthenticationOfficerProfile> findBySpecialization(String specialization);
    List<AuthenticationOfficerProfile> findBySpecializationIgnoreCase(String specialization);

    @Query("""
            select officer from AuthenticationOfficerProfile officer
            join Signup signup on signup.userId = officer.authId
            where lower(trim(officer.specialization)) in :departments
              and signup.role = com.tcs.medverse.enums.Role.AUTHOFFICER
              and signup.authStatus = com.tcs.medverse.enums.AuthStatus.APPROVED
              and signup.active = true
            """)
    List<AuthenticationOfficerProfile> findApprovedOfficersByDepartmentVariants(
            @Param("departments") List<String> departments
    );

    @Query("""
            select officer from AuthenticationOfficerProfile officer
            join Signup signup on signup.userId = officer.authId
            where signup.role = com.tcs.medverse.enums.Role.AUTHOFFICER
              and signup.authStatus = com.tcs.medverse.enums.AuthStatus.APPROVED
              and signup.active = true
            """)
    List<AuthenticationOfficerProfile> findAllApprovedOfficers();

    // ✅ Optional (exists is already provided by JpaRepository)
    boolean existsByAuthId(String authId);
}
