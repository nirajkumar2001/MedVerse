package com.tcs.medverse.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class AuthCookieService {

    public static final String ACCESS_TOKEN_COOKIE = "access_token";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    public static final String DEVICE_ID_COOKIE = "device_id";

    private static final Duration ACCESS_COOKIE_TTL = Duration.ofMinutes(15);
    private static final Duration REFRESH_COOKIE_TTL = Duration.ofDays(30);
    private static final Duration DEVICE_COOKIE_TTL = Duration.ofDays(30);

    public void setAuthCookies(HttpServletResponse response, String accessToken, String refreshToken, String deviceId, boolean secure) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_COOKIE_TTL, secure));
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_COOKIE_TTL, secure));
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(DEVICE_ID_COOKIE, deviceId, DEVICE_COOKIE_TTL, secure));
    }

    public void setAccessCookie(HttpServletResponse response, String accessToken, boolean secure) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_COOKIE_TTL, secure));
    }

    public void setDeviceCookie(HttpServletResponse response, String deviceId, boolean secure) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(DEVICE_ID_COOKIE, deviceId, DEVICE_COOKIE_TTL, secure));
    }

    public void clearAuthCookies(HttpServletResponse response, boolean secure) {
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie(ACCESS_TOKEN_COOKIE, secure));
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie(REFRESH_TOKEN_COOKIE, secure));
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie(DEVICE_ID_COOKIE, secure));
    }

    private String buildCookie(String name, String value, Duration maxAge, boolean secure) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build()
                .toString();
    }

    private String clearCookie(String name, boolean secure) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build()
                .toString();
    }
}