package com.tcs.medverse.exception;

public class DeviceLimitExceededException extends RuntimeException {

    private final String userMessage;

    public DeviceLimitExceededException(String message, String userMessage) {
        super(message);
        this.userMessage = userMessage;
    }

    public String getUserMessage() {
        return userMessage;
    }
}