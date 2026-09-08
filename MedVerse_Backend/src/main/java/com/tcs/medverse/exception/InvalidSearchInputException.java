package com.tcs.medverse.exception;


public class InvalidSearchInputException extends Exception {
    private static final long serialVersionUID = 1L;
    public InvalidSearchInputException() { super(); }
    public InvalidSearchInputException(String msg) { super(msg); }
    public InvalidSearchInputException(String msg, Throwable t) { super(msg, t); }
}