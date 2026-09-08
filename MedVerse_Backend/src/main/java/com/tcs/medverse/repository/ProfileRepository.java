package com.tcs.medverse.repository;

import com.tcs.medverse.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface ProfileRepository extends JpaRepository<Profile, Integer> {

    List<Profile> findByStatus(String status);
    long countByStatus(String status);
    Profile findByUsername(String username);  // ✅ IMPORTANT
}
