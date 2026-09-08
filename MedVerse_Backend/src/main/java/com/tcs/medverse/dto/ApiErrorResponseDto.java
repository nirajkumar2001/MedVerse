package com.tcs.medverse.dto;


import java.time.LocalDateTime;

public class ApiErrorResponseDto {

    private final int status;
    private final String message;
    private final LocalDateTime timestamp = LocalDateTime.now();

    public ApiErrorResponseDto(int status, String message) {
        this.status = status;
        this.message = message;
    }

    public int getStatus() { return status; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
}