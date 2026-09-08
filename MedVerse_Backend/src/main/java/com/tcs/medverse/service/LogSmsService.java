package com.tcs.medverse.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "sms.provider", havingValue = "log", matchIfMissing = true)
public class LogSmsService implements SmsService {
    @Override
    public void sendOtp(String mobile, String otp) {
        System.out.println("[SMS_OTP] mobile=" + mobile + " otp=" + otp);
    }
}