package com.tcs.medverse.service;

public interface SmsService {
    void sendOtp(String mobile, String otp);
}