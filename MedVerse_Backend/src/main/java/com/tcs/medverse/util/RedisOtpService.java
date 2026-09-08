package com.tcs.medverse.util;

import java.time.Duration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "medverse.redis.enabled", havingValue = "true")
public class RedisOtpService extends OtpService {

    private static final Duration OTP_TTL = Duration.ofMinutes(2);
    private final StringRedisTemplate redisTemplate;

    public RedisOtpService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void storeOtp(String otpRefId, String otp) {
        redisTemplate.opsForValue().set(key(otpRefId), otp, OTP_TTL);
    }

    @Override
    public String getOtp(String otpRefId) {
        return redisTemplate.opsForValue().get(key(otpRefId));
    }

    @Override
    public void deleteOtp(String otpRefId) {
        redisTemplate.delete(key(otpRefId));
    }

    private String key(String otpRefId) {
        return "medverse:otp:" + otpRefId;
    }
}
