package com.tcs.medverse.service;

public interface EmailService {
    void sendOtpEmail(String email, String otp);

    default void sendOtp(String email, String otp) {
        sendOtpEmail(email, otp);
    }
}