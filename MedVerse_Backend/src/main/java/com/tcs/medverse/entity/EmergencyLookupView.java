package com.tcs.medverse.entity;


import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;

@Entity
@Immutable
@Table(name = "emergency_lookup_view")
public class EmergencyLookupView {

    @Id
    @Column(name = "patient_id", length = 8)
    private String patientId;

    private String name;
    private Integer age;
    private String gender;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(name = "contact_number")
    private String contactNumber;

    private String address;
    private String district;
    private String state;
    private Integer pincode;

    private String allergies;

    @Column(name = "chronic_conditions")
    private String chronicConditions;

    @Column(name = "current_medication")
    private String currentMedication;

    // ✅ Getters/Setters
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public Integer getPincode() { return pincode; }
    public void setPincode(Integer pincode) { this.pincode = pincode; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getChronicConditions() { return chronicConditions; }
    public void setChronicConditions(String chronicConditions) { this.chronicConditions = chronicConditions; }

    public String getCurrentMedication() { return currentMedication; }
    public void setCurrentMedication(String currentMedication) { this.currentMedication = currentMedication; }
}
