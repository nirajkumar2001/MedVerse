package com.tcs.medverse.config;

import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.repository.SignupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "medverse.default-admin.enabled", havingValue = "true")
public class DefaultAdminSeeder {

    private final SignupRepository signupRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${medverse.default-admin.user-id:ADM00001}")
    private String adminUserId;

    @Value("${medverse.default-admin.name:MedVerse Admin}")
    private String adminName;

    @Value("${medverse.default-admin.email:admin@medverse.com}")
    private String adminEmail;

    @Value("${medverse.default-admin.password:change-me-locally}")
    private String adminPassword;

    @Bean
    CommandLineRunner seedDefaultAdmin() {
        return args -> {
            Signup admin = signupRepository.findByUserId(adminUserId)
                    .orElseGet(Signup::new);

            if (admin.getId() != null && admin.getRole() == Role.ADMIN) {
                return;
            }

            if (admin.getId() == null && signupRepository.existsByEmailAndRole(adminEmail, Role.ADMIN)) {
                System.out.println("[DEFAULT_ADMIN_SKIPPED] admin email already exists: " + adminEmail);
                return;
            }

            admin.setUserId(adminUserId);
            admin.setAuthRefId(admin.getAuthRefId() == null ? "AUTH_ADMIN_" + UUID.randomUUID() : admin.getAuthRefId());
            admin.setName(adminName);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setAuthStatus(AuthStatus.APPROVED);
            admin.setActive(true);

            signupRepository.save(admin);

            System.out.println("[DEFAULT_ADMIN_READY] userId=" + adminUserId
                    + " email=" + adminEmail
                    + " password=" + adminPassword);
        };
    }
}
