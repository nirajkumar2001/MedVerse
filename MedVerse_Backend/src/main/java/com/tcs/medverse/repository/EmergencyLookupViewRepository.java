package com.tcs.medverse.repository;


//import com.medverse.emergencylookup.entity.EmergencyLookupView;
import com.tcs.medverse.entity.EmergencyLookupView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmergencyLookupViewRepository extends JpaRepository<EmergencyLookupView, String> {
}