package com.tcs.medverse.security;



import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import com.tcs.medverse.enums.Role;

@Service
public class JwtService {

    // ✅ Load from config / env
    @Value("${security.jwt.secret}")
    private String secret;
    private SecretKey signingKey;

    @PostConstruct
    void init() {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // ---------------- VALIDATION ----------------

    public boolean validate(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            // log: token expired
        } catch (JwtException e) {
            // log: invalid token
        }
        return false;
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ---------------- TOKEN GENERATION ----------------

    public String generateAccessToken(String authRefId,
                                      String deviceRefId,
                                      Role role) {

        return Jwts.builder()
                .setSubject(authRefId)
                .claim("deviceId", deviceRefId)
                .claim("role", role.toString())
                .claim("profileType", role.toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 15 * 60 * 1000)) // 15 min
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateDeviceManagementToken(String authRefId, Role role) {
        return Jwts.builder()
                .setSubject(authRefId)
                .claim("deviceId", "DEVICE_MANAGEMENT_ONLY")
                .claim("role", role.toString())
                .claim("profileType", role.toString())
                .claim("scope", "device_management")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 10 * 60 * 1000)) // 10 min
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

}