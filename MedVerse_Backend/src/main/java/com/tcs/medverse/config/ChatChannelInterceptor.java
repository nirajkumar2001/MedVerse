package com.tcs.medverse.config;

import com.tcs.medverse.security.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatChannelInterceptor implements ChannelInterceptor {
    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            if (isAuthenticated(accessor.getUser())) {
                return message;
            }

            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                try {
                    if (jwtService.validate(token)) {
                        Claims claims = jwtService.parseClaims(token);
                        String authRefId = claims.getSubject();
                        String profileType = claims.get("profileType", String.class);

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        authRefId,
                                        null,
                                        List.of(new SimpleGrantedAuthority("ROLE_" + profileType))
                                );

                        accessor.setUser(authentication);
                    } else {
                        log.warn("Invalid JWT token in WebSocket connection");
                        throw new IllegalArgumentException("Invalid JWT token");
                    }
                } catch (Exception e) {
                    log.error("Failed to authenticate WebSocket connection: {}", e.getMessage());
                    throw new IllegalArgumentException("Authentication failed", e);
                }
            } else {
                log.debug("Anonymous WebSocket CONNECT allowed");
            }
        }

        if (accessor != null && StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            boolean publicOtpSubscription = destination != null && destination.startsWith("/topic/otp/");

            if (!publicOtpSubscription && !isAuthenticated(accessor.getUser())) {
                log.warn("Unauthenticated WebSocket SUBSCRIBE blocked for destination {}", destination);
                throw new IllegalArgumentException("Authentication required");
            }
        }

        if (accessor != null && StompCommand.SEND.equals(accessor.getCommand()) && !isAuthenticated(accessor.getUser())) {
            String destination = accessor.getDestination();
            log.warn("Unauthenticated WebSocket SEND blocked for destination {}", destination);
            throw new IllegalArgumentException("Authentication required");
        }

        return message;
    }

    private boolean isAuthenticated(java.security.Principal principal) {
        return principal instanceof Authentication authentication && authentication.isAuthenticated()
                && authentication.getName() != null
                && !authentication.getName().isBlank();
    }
}
