package com.tcs.medverse.dto;

public class PatientMedicalProfileResponse {

    private String patientId;

    private String bloodGroup;
    private String allergies;
    private String chronicConditions;
    private String currentMedication;

    private Double heightCm;
    private Double weightKg;
    private Double bmi;

    private String bloodPressure;
    private String bodyTemperature;

    private String lastDisease;
    private String lastFindings;
    private String lastPrescription;

    private String lastUpdatedByDoctorId;
    private String lastUpdatedAt;

    public PatientMedicalProfileResponse() {
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getChronicConditions() {
        return chronicConditions;
    }

    public void setChronicConditions(String chronicConditions) {
        this.chronicConditions = chronicConditions;
    }

    public String getCurrentMedication() {
        return currentMedication;
    }

    public void setCurrentMedication(String currentMedication) {
        this.currentMedication = currentMedication;
    }

    public Double getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(Double heightCm) {
        this.heightCm = heightCm;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(Double weightKg) {
        this.weightKg = weightKg;
    }

    public Double getBmi() {
        return bmi;
    }

    public void setBmi(Double bmi) {
        this.bmi = bmi;
    }

    public String getBloodPressure() {
        return bloodPressure;
    }

    public void setBloodPressure(String bloodPressure) {
        this.bloodPressure = bloodPressure;
    }

    public String getBodyTemperature() {
        return bodyTemperature;
    }

    public void setBodyTemperature(String bodyTemperature) {
        this.bodyTemperature = bodyTemperature;
    }

    public String getLastDisease() {
        return lastDisease;
    }

    public void setLastDisease(String lastDisease) {
        this.lastDisease = lastDisease;
    }

    public String getLastFindings() {
        return lastFindings;
    }

    public void setLastFindings(String lastFindings) {
        this.lastFindings = lastFindings;
    }

    public String getLastPrescription() {
        return lastPrescription;
    }

    public void setLastPrescription(String lastPrescription) {
        this.lastPrescription = lastPrescription;
    }

    public String getLastUpdatedByDoctorId() {
        return lastUpdatedByDoctorId;
    }

    public void setLastUpdatedByDoctorId(String lastUpdatedByDoctorId) {
        this.lastUpdatedByDoctorId = lastUpdatedByDoctorId;
    }

    public String getLastUpdatedAt() {
        return lastUpdatedAt;
    }

    public void setLastUpdatedAt(String lastUpdatedAt) {
        this.lastUpdatedAt = lastUpdatedAt;
    }
}