package com.tcs.medverse.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "email.provider", havingValue = "smtp")

public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${email.from:${spring.mail.username:no-reply@medverse.local}}")
    private String fromEmail;

    public SmtpEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendOtpEmail(String email, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("Your MedVerse OTP Code");
            helper.setText(buildOtpEmailHtml(otp), true);

            mailSender.send(message);
            System.out.println("[EMAIL_SENT] OTP email sent to: " + email);
        } catch (MessagingException e) {
            System.err.println("[EMAIL_FAILED] Failed to send OTP email to: " + email + " - Error: " + e.getMessage());
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }

    private String buildOtpEmailHtml(String otp) {
        String template = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .email-container {
                            max-width: 600px;
                            margin: 40px auto;
                            background-color: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                        }
                        .email-header {
                            background: linear-gradient(135deg, #20b439 0%, #251693 100%);
                            color: #ffffff;
                            padding: 30px;
                            text-align: center;
                        }
                        .email-header h1 {
                            margin: 0;
                            font-size: 28px;
                        }
                        .email-body {
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .email-body p {
                            color: #666666;
                            font-size: 16px;
                            line-height: 1.5;
                            margin: 0 0 20px;
                        }
                        .otp-code {
                            background-color: #f8f9fa;
                            border: 2px dashed #251693;
                            border-radius: 8px;
                            padding: 20px;
                            margin: 30px 0;
                            font-size: 36px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            color: #20b439;
                        }
                        .email-footer {
                            background-color: #f8f9fa;
                            padding: 20px 30px;
                            text-align: center;
                            color: #999999;
                            font-size: 14px;
                        }
                        .warning {
                            color: #dc3545;
                            font-size: 14px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="email-header">
                            <h1>MedVerse</h1>
                        </div>
                        <div class="email-body">
                            <p>Hello,</p>
                            <p>Your One-Time Password (OTP) for verification is:</p>
                            <div class="otp-code">{{OTP_CODE}}</div>
                            <p>This code is valid for 10 minutes.</p>
                            <p class="warning">Do not share this code with anyone. MedVerse staff will never ask for your OTP.</p>
                        </div>
                        <div class="email-footer">
                            <p>If you didn't request this code, please ignore this email.</p>
                            <p>&copy; 2026 MedVerse. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """;
        return template.replace("{{OTP_CODE}}", otp);
    }
}
