package com.tcs.medverse.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "email.provider", havingValue = "log")
public class LogEmailService implements EmailService {

    @Override
    public void sendOtpEmail(String email, String otp) {
        System.out.println("╔═══════════════════════════════════════════════════╗");
        System.out.println("║           EMAIL OTP (Development Mode)           ║");
        System.out.println("╠═══════════════════════════════════════════════════╣");
        System.out.println("║  Email: " + email);
        System.out.println("║  OTP:   " + otp);
        System.out.println("╚═══════════════════════════════════════════════════╝");
    }
}
