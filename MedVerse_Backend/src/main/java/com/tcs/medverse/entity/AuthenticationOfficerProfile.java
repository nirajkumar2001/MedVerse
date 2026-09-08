package com.tcs.medverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "authentication_officer")
public class AuthenticationOfficerProfile {

    @Id
    @Column(name = "auth_id")
    private String authId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(name = "hospital_name") 
    private String hospitalName;

    private String specialization;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "experience_years")
    private int experienceYears;

    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;

    @OneToMany(mappedBy = "auth", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<CaseVerification> verifications;

    @OneToMany(mappedBy = "authenticationOfficer", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PublishedCaseEntity> publishedCases;

    // ✅ REQUIRED: Default constructor
    public AuthenticationOfficerProfile() {}

    // ✅ Parameterized constructor
    public AuthenticationOfficerProfile(String authId, String email, String name,
                                 String hospitalName, String specialization,
                                 String contactNumber, int experienceYears) {
        this.authId = authId;
        this.email = email;
        this.name = name;
        this.hospitalName = hospitalName;
        this.specialization = specialization;
        this.contactNumber = contactNumber;
        this.experienceYears = experienceYears;
    }

    // Getters & Setters
    public String getAuthId() { return authId; }
    public void setAuthId(String authId) { this.authId = authId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public int getExperienceYears() { return experienceYears; }
    public void setExperienceYears(int experienceYears) { this.experienceYears = experienceYears; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
}
