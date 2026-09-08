package com.tcs.medverse.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.repository.AccessNotificationRepository;
import com.tcs.medverse.repository.AuthTokenRepository;
import com.tcs.medverse.repository.DeviceInfoRepository;
import com.tcs.medverse.repository.DoctorRepository;
import com.tcs.medverse.repository.LearnerRepository;
import com.tcs.medverse.repository.LoginRepository;
import com.tcs.medverse.repository.MedicalProfileUpdateRepository;
import com.tcs.medverse.repository.PatientMedicalProfileRepository;
import com.tcs.medverse.repository.PatientRepository;
import com.tcs.medverse.repository.SignupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("api-test")
class ApiWorkflowIntegrationTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private SignupRepository signupRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private PatientMedicalProfileRepository patientMedicalProfileRepository;
    @Autowired private MedicalProfileUpdateRepository medicalProfileUpdateRepository;
    @Autowired private AccessNotificationRepository accessNotificationRepository;
    @Autowired private DeviceInfoRepository deviceInfoRepository;
    @Autowired private AuthTokenRepository authTokenRepository;
    @Autowired private LoginRepository loginRepository;
    @Autowired private LearnerRepository learnerRepository;

    @BeforeEach
    void resetDatabase() {
        medicalProfileUpdateRepository.deleteAll();
        accessNotificationRepository.deleteAll();
        patientMedicalProfileRepository.deleteAll();
        patientRepository.deleteAll();
        doctorRepository.deleteAll();
        authTokenRepository.deleteAll();
        deviceInfoRepository.deleteAll();
        loginRepository.deleteAll();
        learnerRepository.deleteAll();
        signupRepository.deleteAll();
    }

    @Test
    void approvedHealthcareWorkflowAndLearnerAuthApisBehaveCorrectly() throws Exception {
        seedSignup("ADM00001", "AUTH_ADMIN", "Admin User", "admin@medverse.com", Role.ADMIN, AuthStatus.APPROVED);
        seedSignup("DOC12345", "AUTH_DOC", "Doctor User", "doctor@medverse.com", Role.DOCTOR, AuthStatus.PENDING);
        seedSignup("PAT12345", "AUTH_PAT", "Patient User", "patient@medverse.com", Role.PATIENT, AuthStatus.PENDING);
        seedSignup("PAT54321", "AUTH_PAT_TWO", "Other Patient", "patient2@medverse.com", Role.PATIENT, AuthStatus.PENDING);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("userId", "DOC12345", "password", "Password@123", "deviceId", "pending-device"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.authStatus").value("PENDING"));

        String adminToken = login("ADM00001", "admin-device");

        mockMvc.perform(put("/api/v1/admin/signup-users/DOC12345/approve").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", containsString("approved")));
        mockMvc.perform(put("/api/v1/admin/signup-users/PAT12345/approve").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/admin/signup-users/PAT54321/approve").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());

        String doctorToken = login("DOC12345", "doctor-device");
        String patientToken = login("PAT12345", "patient-device");
        String otherPatientToken = login("PAT54321", "patient-device-two");

        mockMvc.perform(put("/api/v1/doctorprofile/me")
                        .header("Authorization", bearer(doctorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "designation", "Consultant",
                                "department", "Emergency Medicine",
                                "phoneNumber", "9876543210",
                                "yearsOfExperience", 8,
                                "hospitalName", "MedVerse Hospital"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.department").value("Emergency Medicine"));

        mockMvc.perform(put("/api/patient/me")
                        .header("Authorization", bearer(patientToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "age", 34,
                                "gender", "MALE",
                                "contactNumber", "9999999901",
                                "address", "Sector 1",
                                "state", "Delhi",
                                "district", "South Delhi",
                                "pincode", 110001,
                                "height", 172.0,
                                "weight", 70.0
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.patientId").value("PAT12345"));

        mockMvc.perform(put("/api/patient/me")
                        .header("Authorization", bearer(patientToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "patientId", "PAT99999",
                                "email", "tampered@medverse.com",
                                "name", "Tampered Name",
                                "age", 35
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("patientId, email and name cannot be updated"));

        mockMvc.perform(get("/api/v1/emergency/patients/PAT54321").header("Authorization", bearer(patientToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/emergency/patients/search?q=Delhi").header("Authorization", bearer(doctorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultType", notNullValue()));

        String firstSessionId = createAccessSession(doctorToken, "PAT12345", "Need current visit update");

        mockMvc.perform(put("/api/v1/accessnotification/" + firstSessionId + "/decision")
                        .header("Authorization", bearer(patientToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("decision", "APPROVE", "allowPreviousMedicalRecords", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessStatus").value("APPROVED"))
                .andExpect(jsonPath("$.data.canViewPreviousRecords").value(false));

        mockMvc.perform(get("/api/v1/editpatientprofile/patient/PAT12345?sessionId=" + firstSessionId)
                        .header("Authorization", bearer(doctorToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("not granted")));

        mockMvc.perform(post("/api/v1/editpatientprofile")
                        .header("Authorization", bearer(doctorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "sessionId", firstSessionId,
                                "patientId", "PAT12345",
                                "bloodGroup", "O+",
                                "allergies", "Penicillin",
                                "chronicConditions", "Asthma",
                                "currentMedication", "Inhaler",
                                "disease", "Respiratory infection",
                                "findings", "Stable"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.bloodGroup").value("O+"));

        mockMvc.perform(get("/api/v1/accessnotification/" + firstSessionId).header("Authorization", bearer(patientToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessStatus").value("COMPLETED"));

        mockMvc.perform(get("/api/v1/emergency/me").header("Authorization", bearer(patientToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bloodGroup").value("O+"))
                .andExpect(jsonPath("$.allergies").value("Penicillin"));

        String secondSessionId = createAccessSession(doctorToken, "PAT12345", "Need previous records");
        mockMvc.perform(put("/api/v1/accessnotification/" + secondSessionId + "/decision")
                        .header("Authorization", bearer(patientToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("decision", "APPROVE", "allowPreviousMedicalRecords", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.canViewPreviousRecords").value(true));

        mockMvc.perform(get("/api/v1/editpatientprofile/record/PAT12345?sessionId=" + secondSessionId)
                        .header("Authorization", bearer(doctorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentProfile.bloodGroup").value("O+"))
                .andExpect(jsonPath("$.data.previousRecords[0].patientId").value("PAT12345"));

        mockMvc.perform(get("/api/patient/PAT12345").header("Authorization", bearer(doctorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value("PAT12345"));

        String learnerRegisterBody = mockMvc.perform(post("/api/v1/learner/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "name", "Learner User",
                                "email", "learner@medverse.com",
                                "password", "Password@123",
                                "institution", "Medical College"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.learnerId", notNullValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String learnerId = objectMapper.readTree(learnerRegisterBody).path("data").path("learnerId").asText();

        String learnerLoginBody = mockMvc.perform(post("/api/v1/learner/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "userId", learnerId,
                                "password", "Password@123",
                                "deviceId", "learner-device",
                                "deviceType", "WEB",
                                "deviceModel", "MockMvc",
                                "osVersion", "test",
                                "appVersion", "1.0"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String learnerToken = objectMapper.readTree(learnerLoginBody).path("data").path("token").asText();
        mockMvc.perform(get("/api/v1/learner/profile").header("Authorization", bearer(learnerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("learner@medverse.com"));

        mockMvc.perform(get("/api/v1/learner/profile").header("Authorization", bearer(otherPatientToken)))
                .andExpect(status().isForbidden());
    }

    private String createAccessSession(String doctorToken, String patientId, String message) throws Exception {
        String body = mockMvc.perform(post("/api/v1/accessnotification")
                        .header("Authorization", bearer(doctorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "patientId", patientId,
                                "requestMessage", message,
                                "accessDurationDays", 1
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.accessStatus").value("PENDING"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(body).path("data").path("sessionId").asText();
    }

    private String login(String userId, String deviceId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "userId", userId,
                                "password", "Password@123",
                                "deviceId", deviceId,
                                "deviceType", "WEB",
                                "deviceModel", "MockMvc",
                                "osVersion", "test",
                                "appVersion", "1.0"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.authToken", notNullValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode root = objectMapper.readTree(response);
        return root.path("data").path("authToken").asText();
    }

    private void seedSignup(String userId, String authRefId, String name, String email, Role role, AuthStatus status) {
        Signup signup = new Signup();
        signup.setUserId(userId);
        signup.setAuthRefId(authRefId);
        signup.setName(name);
        signup.setEmail(email);
        signup.setPassword(passwordEncoder.encode("Password@123"));
        signup.setRole(role);
        signup.setAuthStatus(status);
        signup.setActive(true);
        signupRepository.save(signup);
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
