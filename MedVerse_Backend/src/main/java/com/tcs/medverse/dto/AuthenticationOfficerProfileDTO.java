package com.tcs.medverse.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AuthenticationOfficerProfileDTO {

    private String authId;
    private String name;
    private String email;
    private String hospitalName;
    @JsonAlias({"department"})
    private String specialization;
    @JsonAlias({"phone", "phoneNumber"})
    private String contactNumber;
    @JsonAlias({"yearsOfExperience"})
    private int experienceYears;
    @JsonAlias({"profileImageData", "image", "imageUrl", "photoUrl"})
    private String profileImage;
    private String status;

    // ✅ No-args constructor (required for JSON mapping)
    public AuthenticationOfficerProfileDTO() {
    }

    // ✅ Parameterized constructor
    public AuthenticationOfficerProfileDTO(String authId,
                                           String name,
                                           String email,
                                           String hospitalName,
                                           String specialization,
                                           String contactNumber,
                                           int experienceYears) {
        this.authId = authId;
        this.name = name;
        this.email = email;
        this.hospitalName = hospitalName;
        this.specialization = specialization;
        this.contactNumber = contactNumber;
        this.experienceYears = experienceYears;
    }

    // ✅ Getters

    public String getAuthId() {
        return authId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public String getSpecialization() {
        return specialization;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public int getExperienceYears() {
        return experienceYears;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public String getStatus() {
        return status;
    }

    // ✅ Setters (FIXED – VERY IMPORTANT)

    public void setAuthId(String authId) {
        this.authId = authId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public void setExperienceYears(int experienceYears) {
        this.experienceYears = experienceYears;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
