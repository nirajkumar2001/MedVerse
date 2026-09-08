package com.tcs.medverse.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tcs.medverse.security.CustomAccessDeniedHandler;
import com.tcs.medverse.security.JwtAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthFilter jwtAuthFilter;
        private final JwtAuthenticationEntryPoint authenticationEntryPoint;

        @Bean
        public ObjectMapper objectMapper() {
                return new ObjectMapper().findAndRegisterModules();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public CustomAccessDeniedHandler accessDeniedHandler() {
                return new CustomAccessDeniedHandler();
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(AbstractHttpConfigurer::disable)
                                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint(authenticationEntryPoint)
                                                .accessDeniedHandler(accessDeniedHandler()))
                                .authorizeHttpRequests(auth -> auth

                                                /* ---------- Preflight ---------- */
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                /* ---------- Public Auth APIs ---------- */
                                                .requestMatchers(HttpMethod.POST,
                                                                "/api/v1/auth/signup",
                                                                "/api/v1/auth/resend-otp",
                                                                "/api/v1/auth/login",
                                                                "/api/v1/auth/verify-otp",
                                                                "/api/v1/auth/forgot-password",
                                                                "/api/v1/auth/resend-password-reset-otp",
                                                                "/api/v1/auth/reset-password",
                                                                "/api/v1/auth/refresh",
                                                                "/api/v1/auth/device-management-token",
                                                                "/api/v1/auth/rejected-profile/resubmit",

                                                                "/api/v1/learner/auth/register",
                                                                "/api/v1/learner/auth/login",
                                                                "/api/v1/learner/auth/forgot-password",
                                                                "/api/v1/learner/auth/reset-password")
                                                .permitAll()

                                                /* ---------- Public Utility / Docs / WebSocket Handshake ---------- */
                                                .requestMatchers(
                                                                "/actuator/**",
                                                                "/health/**",
                                                                "/swagger-ui/**",
                                                                "/v3/api-docs/**",
                                                                "/ws",
                                                                "/ws/**",
                                                                "/ws/chat/**")
                                                .permitAll()

                                                /* ---------- Main Role Modules ---------- */
                                                .requestMatchers("/api/v1/learner/**").hasRole("LEARNER")
                                                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/v1/authofficer/**").hasRole("AUTHOFFICER")

                                                /* ---------- Doctor Profile ---------- */
                                                .requestMatchers("/api/v1/doctorprofile/**").hasRole("DOCTOR")

                                                /* ---------- Patient Own Profile ---------- */
                                                .requestMatchers("/api/v1/patient/me").hasRole("PATIENT")
                                                .requestMatchers("/api/v1/patient/me/**").hasRole("PATIENT")

                                                .requestMatchers("/api/patient/me").hasRole("PATIENT")
                                                .requestMatchers("/api/patient/me/**").hasRole("PATIENT")

                                                /*
                                                 * Doctor-only patient APIs.
                                                 * Keep this after /patient/me rules.
                                                 */
                                                .requestMatchers("/api/v1/patient/**").hasRole("DOCTOR")
                                                .requestMatchers("/api/patient/**").hasRole("DOCTOR")

                                                /* ---------- Emergency Lookup ---------- */
                                                .requestMatchers("/api/v1/emergency/**").hasRole("DOCTOR")

                                                /* ---------- Access Notification ---------- */
                                                .requestMatchers("/api/v1/accessnotification/**")
                                                .hasAnyRole("DOCTOR", "PATIENT", "ADMIN")

                                                /* ---------- Doctor Medical Profile Editing ---------- */
                                                .requestMatchers("/api/v1/editpatientprofile/record/**")
                                                .hasRole("DOCTOR")

                                                .requestMatchers("/api/v1/editpatientprofile/me/record")
                                                .hasRole("PATIENT")

                                                .requestMatchers("/api/v1/editpatientprofile/session/**")
                                                .hasAnyRole("DOCTOR", "PATIENT")

                                                .requestMatchers(HttpMethod.POST, "/api/v1/editpatientprofile")
                                                .hasRole("DOCTOR")

                                                .requestMatchers(HttpMethod.PUT, "/api/v1/editpatientprofile/**")
                                                .hasRole("DOCTOR")

                                                /*
                                                 * Keep this only as fallback for any future editpatientprofile
                                                 * endpoints.
                                                 * Specific rules above will match first.
                                                 */
                                                .requestMatchers("/api/v1/editpatientprofile/**")
                                                .hasAnyRole("DOCTOR", "PATIENT", "ADMIN")

                                                /* ---------- Auth / Chat / Device Protected APIs ---------- */
                                                .requestMatchers(
                                                                "/api/v1/auth/**",
                                                                "/api/v1/chat/**",
                                                                "/api/v1/device/**")
                                                .authenticated()

                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(List.of(
                                "http://localhost:4200",
                                "http://localhost:4201",
                                "http://localhost:4202"));

                config.setAllowedMethods(List.of(
                                "GET",
                                "POST",
                                "PUT",
                                "DELETE",
                                "PATCH",
                                "OPTIONS"));

                config.setAllowedHeaders(List.of(
                                "Authorization",
                                "Content-Type",
                                "Accept",
                                "Origin"));

                config.setAllowCredentials(true);
                config.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);

                return source;
        }
}