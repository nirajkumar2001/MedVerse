package com.tcs.medverse.service;

import com.tcs.medverse.util.LoggingContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "email.provider", havingValue = "smtp")
@RequiredArgsConstructor

public  class Fast2SmsService implements EmailService {

    private final JavaMailSender mailSender;
    private final LoggingContext logging;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendOtpEmail(String toEmail, String otp) {

        try {

            SimpleMailMessage message = new SimpleMailMessage();

            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("EasyLife OTP Verification");
            message.setText("Your OTP is: " + otp);

            mailSender.send(message);

            logging.infoLogT(
                    "EMAIL_SENT",
                    "OTP email sent to " + toEmail
            );

        } catch (Exception e) {

            logging.errorLogT(
                    "EMAIL_FAILED",
                    "Failed to send OTP email to "
                            + toEmail + ": " + e.getMessage()
            );
        }
    }

    @Override
    public void sendOtp(String email, String otp) {
        sendOtpEmail(email, otp);
    }
}