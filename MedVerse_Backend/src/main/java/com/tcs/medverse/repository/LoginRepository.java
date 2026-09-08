package com.tcs.medverse.repository;

import com.tcs.medverse.entity.Login;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoginRepository  extends JpaRepository<Login,String> {
    List<Login> findTop200ByOrderByLoginAtDesc();
}
