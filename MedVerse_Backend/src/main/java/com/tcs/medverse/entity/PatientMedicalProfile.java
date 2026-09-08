package com.tcs.medverse.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "patient_medical_profile")
public class PatientMedicalProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long profileId;

    @Column(name = "patient_id", nullable = false, unique = true, length = 50)
    private String patientId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Column(name = "blood_group", length = 20)
    private String bloodGroup;

    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "chronic_conditions", columnDefinition = "TEXT")
    private String chronicConditions;

    @Column(name = "current_medication", columnDefinition = "TEXT")
    private String currentMedication;

    @Column(name = "height_cm")
    private Double heightCm;

    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(name = "bmi")
    private Double bmi;

    @Column(name = "blood_pressure", length = 50)
    private String bloodPressure;

    @Column(name = "body_temperature", length = 50)
    private String bodyTemperature;

    @Column(name = "last_disease", columnDefinition = "TEXT")
    private String lastDisease;

    @Column(name = "last_findings", columnDefinition = "TEXT")
    private String lastFindings;

    @Column(name = "last_prescription", columnDefinition = "TEXT")
    private String lastPrescription;

    @Column(name = "last_updated_by_doctor_id", length = 50)
    private String lastUpdatedByDoctorId;

    @Column(name = "last_updated_at")
    private LocalDateTime lastUpdatedAt;

    public PatientMedicalProfile() {
    }

    public Long getProfileId() {
        return profileId;
    }

    public void setProfileId(Long profileId) {
        this.profileId = profileId;
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

    public LocalDateTime getLastUpdatedAt() {
        return lastUpdatedAt;
    }

    public void setLastUpdatedAt(LocalDateTime lastUpdatedAt) {
        this.lastUpdatedAt = lastUpdatedAt;
    }
}