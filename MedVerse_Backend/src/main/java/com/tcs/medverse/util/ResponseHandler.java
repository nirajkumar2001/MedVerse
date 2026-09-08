package com.tcs.medverse.util;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.LinkedHashMap;
import java.util.Map;

public final class ResponseHandler {

    private ResponseHandler() {}

    public static ResponseEntity<?> success(Object data, String message) {
        return ResponseEntity.ok(envelope("SUCCESS", message, data));
    }

    public static ResponseEntity<?> created(Object data, String message) {
        return ResponseEntity.status(HttpStatus.CREATED).body(envelope("CREATED", message, data));
    }

    public static ResponseEntity<?> error(HttpStatus status, String message, Object detail) {
        return ResponseEntity.status(status).body(envelope("ERROR", message, detail));
    }

    private static Map<String, Object> envelope(String status, String message, Object data) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status);
        body.put("message", message);
        body.put("data", data);
        return body;
    }
}