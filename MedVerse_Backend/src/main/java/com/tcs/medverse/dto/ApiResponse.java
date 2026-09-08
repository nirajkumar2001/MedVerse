package com.tcs.medverse.dto;

public class ApiResponse<T> {

    public boolean success;
    public java.lang.String message;
    public T data;
    public java.lang.String timestamp;

    public ApiResponse() {
    }

    public static <T> ApiResponse<T> success(java.lang.String message, T data) {

        ApiResponse<T> response = new ApiResponse<T>();

        response.success = true;
        response.message = message;
        response.data = data;
        response.timestamp = java.lang.Long.toString(System.currentTimeMillis());

        return response;
    }

    public static <T> ApiResponse<T> error(java.lang.String message, T data) {

        ApiResponse<T> response = new ApiResponse<T>();

        response.success = false;
        response.message = message;
        response.data = data;
        response.timestamp = java.lang.Long.toString(System.currentTimeMillis());

        return response;
    }
}