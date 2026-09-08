package com.tcs.medverse.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.tcs.medverse.service.DeviceService;
import com.tcs.medverse.security.AuthCookieService;
import com.tcs.medverse.security.JwtService;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String UNAUTHORIZED_MESSAGE = "Unauthorized access. Please login first.";

    private final JwtService jwtService;
    private final DeviceService deviceService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String requestMethod = request.getMethod();
        SecurityContextHolder.clearContext();

        // Public endpoints that don't require JWT validation (must match SecurityConfig permitAll())
        boolean isPublicEndpoint = "OPTIONS".equals(requestMethod) ||
                ("POST".equals(requestMethod) && (
                        requestPath.equals("/api/v1/auth/signup") ||
                        requestPath.equals("/api/v1/auth/resend-otp") ||
                        requestPath.equals("/api/v1/auth/login") ||
                        requestPath.equals("/api/v1/auth/verify-otp") ||
                        requestPath.equals("/api/v1/auth/forgot-password") ||
                        requestPath.equals("/api/v1/auth/resend-password-reset-otp") ||
                        requestPath.equals("/api/v1/auth/reset-password") ||
                        requestPath.equals("/api/v1/auth/refresh") ||
                        requestPath.equals("/api/v1/auth/device-management-token") ||
                        requestPath.equals("/api/v1/auth/rejected-profile/resubmit") ||
                        requestPath.equals("/api/v1/learner/auth/register") ||
                        requestPath.equals("/api/v1/learner/auth/login") ||
                        requestPath.equals("/api/v1/learner/auth/forgot-password") ||
                        requestPath.equals("/api/v1/learner/auth/reset-password")
                )) ||
                requestPath.startsWith("/actuator/") ||
                requestPath.startsWith("/health/") ||
                requestPath.startsWith("/swagger-ui/") ||
                requestPath.startsWith("/v3/api-docs/") ||
                requestPath.startsWith("/ws/");

        String token = resolveAccessToken(request);
        if (token == null || token.isBlank()) {
            chain.doFilter(request, response);
            return;
        }

        if (!jwtService.validate(token)) {
            SecurityContextHolder.clearContext();

            // For public endpoints, just clear context and continue - don't send error
            if (isPublicEndpoint) {
                chain.doFilter(request, response);
                return;
            }

            // For protected endpoints, send 401 error
            writeUnauthorized(response);
            return;
        }


        // Claims claims = jwtService.getClaims(token);
        Claims claims = jwtService.parseClaims(token);

        String authRefId = claims.getSubject();
        String deviceRefId = claims.get("deviceId", String.class);
        String role = claims.get("role", String.class);
        if (role == null || role.isBlank()) {
            role = claims.get("profileType", String.class);
        }
        String scope = claims.get("scope", String.class);
        if (role == null || role.isBlank()) {
            writeUnauthorized(response);
            return;
        }

        if ("device_management".equals(scope)
                && !requestPath.startsWith("/api/v1/auth/devices")
                && !requestPath.equals("/api/v1/auth/logout-device")) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Device management token cannot access this API");
            return;
        }

        // Skip device validation for device management tokens and public endpoints
        if (!"device_management".equals(scope) && !isPublicEndpoint) {
            // Check if device from JWT claim is still valid
            if (!deviceService.isValidDevice(authRefId, deviceRefId)) {
                SecurityContextHolder.clearContext();
                writeUnauthorized(response);
                return;
            }

            // Also validate X-Device-Ref-Id header if present (from frontend)
            String headerDeviceRefId = request.getHeader("X-Device-Ref-Id");
            if (headerDeviceRefId != null && !headerDeviceRefId.isBlank()) {
                // Header device must match JWT claim device
                if (!headerDeviceRefId.equals(deviceRefId)) {
                    SecurityContextHolder.clearContext();
                    writeUnauthorized(response);
                    return;
                }

                // Validate header device is still authorized for this user
                if (!deviceService.isValidDevice(authRefId, headerDeviceRefId)) {
                    SecurityContextHolder.clearContext();
                    writeUnauthorized(response);
                    return;
                }
            }
        }



        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        authRefId,
                        null,
                        List.of(
                                new SimpleGrantedAuthority(
                                        "ROLE_" + role
                                )
                        )
                );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        chain.doFilter(request, response);
    }

    private String resolveAccessToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (AuthCookieService.ACCESS_TOKEN_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }

        return null;
    }

    private void writeUnauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("""
        {
          "status": 401,
          "message": "%s",
          "data": {
            "error": "%s"
          }
        }
        """.formatted(UNAUTHORIZED_MESSAGE, UNAUTHORIZED_MESSAGE));
    }
}


// @PostMapping("/switch-professional")
// public ResponseEntity<?> switchToProfessional(Authentication authentication) {

//     String authRefId = (String) authentication.getPrincipal();

//     return ResponseHandler.success(
//         profileService.switchToProfessional(authRefId),
//         "Profile switched"
//     );
// }

// Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

// authentication.getPrincipal()
