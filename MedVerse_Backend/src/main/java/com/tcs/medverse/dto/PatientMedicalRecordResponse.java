package com.tcs.medverse.dto;

import java.util.ArrayList;
import java.util.List;

public class PatientMedicalRecordResponse {

    private String patientId;

    private PatientMedicalProfileResponse currentProfile;

    private List<MedicalProfileUpdateResponse> previousRecords = new ArrayList<>();

    public PatientMedicalRecordResponse() {
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public PatientMedicalProfileResponse getCurrentProfile() {
        return currentProfile;
    }

    public void setCurrentProfile(PatientMedicalProfileResponse currentProfile) {
        this.currentProfile = currentProfile;
    }

    public List<MedicalProfileUpdateResponse> getPreviousRecords() {
        return previousRecords;
    }

    public void setPreviousRecords(List<MedicalProfileUpdateResponse> previousRecords) {
        this.previousRecords = previousRecords != null ? previousRecords : new ArrayList<>();
    }
}