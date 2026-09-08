package com.tcs.medverse.exception;

public class CaseNotFoundException extends RuntimeException {

    public CaseNotFoundException(String message) {
        super(message);
    }
}