package com.tcs.medverse.service;

import com.tcs.medverse.dto.OtpWebSocketMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OtpRealtimeService {

    private static final long OTP_EXPIRY_SECONDS = 120;

    private final SimpMessagingTemplate messagingTemplate;

    public void publishOtp(String otpRefId, String otp) {
        // otpRefId is used as the unique browser session topic for this OTP flow.
        OtpWebSocketMessage message = new OtpWebSocketMessage(
                otpRefId,
                otpRefId,
                otp,
                OTP_EXPIRY_SECONDS,
                "OTP generated and sent via WebSocket"
        );

        messagingTemplate.convertAndSend("/topic/otp/" + otpRefId, message);

        // Keep the formatted backend console OTP for demo fallback/testing.
        System.out.println("╔════════════════════════════════════════════════════╗");
        System.out.println("║              WEBSOCKET OTP DISPATCH               ║");
        System.out.println("╠════════════════════════════════════════════════════╣");
        System.out.println("║  Session: " + otpRefId);
        System.out.println("║  OTP:     " + otp);
        System.out.println("║  Expiry:  2 minutes");
        System.out.println("╚════════════════════════════════════════════════════╝");
    }
}
