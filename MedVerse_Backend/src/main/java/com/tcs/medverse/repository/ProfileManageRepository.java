package com.tcs.medverse.repository;

import com.tcs.medverse.entity.ProfileManage;
import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileManageRepository extends JpaRepository<ProfileManage, String> {
    List<ProfileManage> findByStatus(AuthStatus status);
    long countByStatus(AuthStatus status);
    long countByRole(Role role);
    Optional<ProfileManage> findByAuthRefId(String authRefId);
}
