package com.tcs.medverse.util;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class RateLimiterService {

    private static final int maxAttempts = 5;
    private static final int windowSeconds = 60;

    private final Map<String, Counter> counters = new ConcurrentHashMap<>();

    public void checkRequestLimit(String key) {

        String mapKey = "RATE:" + key;
        Instant now = Instant.now();

        Counter updated = counters.compute(mapKey, (k, current) -> {
            if (current == null || now.isAfter(current.windowEnd())) {
                return new Counter(1, now.plus(Duration.ofSeconds(windowSeconds)));
            }
            return new Counter(current.count() + 1, current.windowEnd());
        });

        if (updated.count() > maxAttempts) {
            throw new RuntimeException("Request limit exceeded. Please try again later.");
        }
    }

    private record Counter(int count, Instant windowEnd) {}
}