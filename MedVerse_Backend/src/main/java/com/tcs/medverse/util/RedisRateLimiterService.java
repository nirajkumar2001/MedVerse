package com.tcs.medverse.util;

import java.time.Duration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "medverse.redis.enabled", havingValue = "true")
public class RedisRateLimiterService extends RateLimiterService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofSeconds(60);
    private final StringRedisTemplate redisTemplate;

    public RedisRateLimiterService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void checkRequestLimit(String key) {
        String redisKey = "medverse:rate:" + key;
        Long attempts = redisTemplate.opsForValue().increment(redisKey);

        if (attempts != null && attempts == 1L) {
            redisTemplate.expire(redisKey, WINDOW);
        }

        if (attempts != null && attempts > MAX_ATTEMPTS) {
            throw new RuntimeException("Request limit exceeded. Please try again later.");
        }
    }
}
