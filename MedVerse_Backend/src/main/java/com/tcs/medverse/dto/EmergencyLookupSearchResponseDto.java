package com.tcs.medverse.dto;

import java.util.ArrayList;
import java.util.List;

public class EmergencyLookupSearchResponseDto {

    private String query;
    private String matchType;
    private String resultType;
    private Integer totalMatches;
    private String message;

    private PatientDetailsResponseDto patient;
    private PatientDetailsResponseDto patientDetails;

    private List<PatientSummaryResponseDto> patients = new ArrayList<>();
    private List<PatientSummaryResponseDto> matches = new ArrayList<>();

    public EmergencyLookupSearchResponseDto() {
    }

    public static EmergencyLookupSearchResponseDto single(
            String query,
            PatientDetailsResponseDto patientDetails,
            String message) {

        EmergencyLookupSearchResponseDto dto = new EmergencyLookupSearchResponseDto();

        dto.setQuery(query);
        dto.setMatchType("SINGLE");
        dto.setResultType("SINGLE");
        dto.setTotalMatches(1);
        dto.setMessage(message);

        dto.setPatient(patientDetails);
        dto.setPatientDetails(patientDetails);

        dto.setPatients(new ArrayList<>());
        dto.setMatches(new ArrayList<>());

        return dto;
    }

    public static EmergencyLookupSearchResponseDto multiple(
            String query,
            List<PatientSummaryResponseDto> patients,
            String message) {

        EmergencyLookupSearchResponseDto dto = new EmergencyLookupSearchResponseDto();

        dto.setQuery(query);
        dto.setMatchType("MULTIPLE");
        dto.setResultType("MULTIPLE");
        dto.setTotalMatches(patients != null ? patients.size() : 0);
        dto.setMessage(message);

        dto.setPatient(null);
        dto.setPatientDetails(null);

        dto.setPatients(patients != null ? patients : new ArrayList<>());
        dto.setMatches(patients != null ? patients : new ArrayList<>());

        return dto;
    }

    public static EmergencyLookupSearchResponseDto none(
            String query,
            String message) {

        EmergencyLookupSearchResponseDto dto = new EmergencyLookupSearchResponseDto();

        dto.setQuery(query);
        dto.setMatchType("NONE");
        dto.setResultType("NONE");
        dto.setTotalMatches(0);
        dto.setMessage(message);

        dto.setPatient(null);
        dto.setPatientDetails(null);

        dto.setPatients(new ArrayList<>());
        dto.setMatches(new ArrayList<>());

        return dto;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getMatchType() {
        return matchType;
    }

    public void setMatchType(String matchType) {
        this.matchType = matchType;
    }

    public String getResultType() {
        return resultType;
    }

    public void setResultType(String resultType) {
        this.resultType = resultType;
    }

    public Integer getTotalMatches() {
        return totalMatches;
    }

    public void setTotalMatches(Integer totalMatches) {
        this.totalMatches = totalMatches;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public PatientDetailsResponseDto getPatient() {
        return patient;
    }

    public void setPatient(PatientDetailsResponseDto patient) {
        this.patient = patient;
    }

    public PatientDetailsResponseDto getPatientDetails() {
        return patientDetails;
    }

    public void setPatientDetails(PatientDetailsResponseDto patientDetails) {
        this.patientDetails = patientDetails;
    }

    public List<PatientSummaryResponseDto> getPatients() {
        return patients;
    }

    public void setPatients(List<PatientSummaryResponseDto> patients) {
        this.patients = patients;
    }

    public List<PatientSummaryResponseDto> getMatches() {
        return matches;
    }

    public void setMatches(List<PatientSummaryResponseDto> matches) {
        this.matches = matches;
    }
}