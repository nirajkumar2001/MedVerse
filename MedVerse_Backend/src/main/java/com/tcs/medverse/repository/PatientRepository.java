package com.tcs.medverse.repository;

import com.tcs.medverse.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.lang.reflect.Method;
import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {

    default List<Patient> searchForEmergencyLookup(String query) {
        String normalizedQuery = query == null
                ? ""
                : query.trim().toLowerCase();

        if (normalizedQuery.isBlank()) {
            return List.of();
        }

        return findAll()
                .stream()
                .filter(patient -> matchesPatient(patient, normalizedQuery))
                .toList();
    }

    private boolean matchesPatient(Patient patient, String query) {
        return containsAny(patient, query,
                "getPatientId",
                "getUserId",
                "getId",
                "getFullName",
                "getName",
                "getPatientName",
                "getGender",
                "getBloodGroup",
                "getEmergencyContact",
                "getContactNumber",
                "getPhoneNumber",
                "getMobileNumber",
                "getAddress",
                "getDistrict",
                "getState",
                "getPincode");
    }

    private boolean containsAny(Patient patient, String query, String... getterNames) {
        for (String getterName : getterNames) {
            Object value = readValue(patient, getterName);

            if (value != null && String.valueOf(value).toLowerCase().contains(query)) {
                return true;
            }
        }

        return false;
    }

    private Object readValue(Patient patient, String getterName) {
        try {
            Method method = patient.getClass().getMethod(getterName);
            return method.invoke(patient);
        } catch (Exception ignored) {
            return null;
        }
    }
}