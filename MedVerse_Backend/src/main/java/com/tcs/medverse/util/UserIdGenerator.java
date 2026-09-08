package com.tcs.medverse.util;

import com.tcs.medverse.enums.Role;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class UserIdGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    public String generate(Role role) {
        return prefix(role) + String.format("%05d", RANDOM.nextInt(100000));
    }

    private String prefix(Role role) {
        return switch (role) {
            case DOCTOR -> "DOC";
            case PATIENT -> "PAT";
            case LEARNER -> "LRN";
            case AUTHOFFICER -> "AOF";
            case ADMIN -> null;// we dont have them

        };
    }
}