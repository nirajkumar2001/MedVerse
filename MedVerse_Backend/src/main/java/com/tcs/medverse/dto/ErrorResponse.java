package com.tcs.medverse.dto;

import java.util.Map;

public class ErrorResponse {

    public boolean success;
    public int status;
    public String error;
    public String message;
    public String path;
    public Map<String, String> validationErrors;
    public String timestamp;

    public ErrorResponse() {
    }

    public static ErrorResponse of(
            int status,
            String error,
            String message,
            String path,
            Map<String, String> validationErrors
    ) {
        ErrorResponse response = new ErrorResponse();

        response.success = false;
        response.status = status;
        response.error = error;
        response.message = message;
        response.path = path;
        response.validationErrors = validationErrors;
        response.timestamp = java.lang.Long.toString(System.currentTimeMillis());;

        return response;
    }
}