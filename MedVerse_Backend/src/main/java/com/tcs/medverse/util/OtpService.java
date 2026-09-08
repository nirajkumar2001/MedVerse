package com.tcs.medverse.util;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "medverse.redis.enabled", havingValue = "false", matchIfMissing = true)
public class OtpService {

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();

    public void storeOtp(String otpRefId, String otp) {
        // OTPs are intentionally short lived: 2 minutes from generation time.
        store.put("OTP:" + otpRefId, new OtpEntry(otp, Instant.now().plus(Duration.ofMinutes(2))));
    }

    public String getOtp(String otpRefId) {
        OtpEntry entry = store.get("OTP:" + otpRefId);
        if (entry == null) {
            return null;
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.remove("OTP:" + otpRefId);
            return null;
        }
        return entry.otp();
    }

    public void deleteOtp(String otpRefId) {
        store.remove("OTP:" + otpRefId);
    }

    private record OtpEntry(String otp, Instant expiresAt) {}
}
