package com.tcs.medverse.util;

import java.security.SecureRandom;

public class AppUtils {

    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generate6DigitOtp() {
        int otp = 100000 + RANDOM.nextInt(900000); // range 100000–999999
        return String.valueOf(otp);
    }
}