package com.tcs.medverse.entity;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient")
public class Patient {

    @Id
    @Column(name = "patient_id")
    private String patientId;   // ✅ VARCHAR ID (manual)

    private String email;
    private String name;
    private Integer age;
    private String gender;

    @Column(name = "contact_number")
    private String contactNumber;

    private String address;
    private String state;
    private String district;
    private Integer pincode;

    private Double height;
    private Double weight;

    @Column(name = "profile_image")
    private String profileImage;

    @Lob
    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "profile_updated_at")
    private LocalDateTime profileUpdatedAt;

    // ✅ GETTERS & SETTERS

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public Integer getPincode() { return pincode; }
    public void setPincode(Integer pincode) { this.pincode = pincode; }

    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public LocalDateTime getProfileUpdatedAt() { return profileUpdatedAt; }
    public void setProfileUpdatedAt(LocalDateTime profileUpdatedAt) { this.profileUpdatedAt = profileUpdatedAt; }
}
