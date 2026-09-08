package com.tcs.medverse.exception;


public class EmergencyLookupDaoException extends Exception {
    public EmergencyLookupDaoException(String msg, Throwable t) { super(msg, t); }
    public EmergencyLookupDaoException(String msg) { super(msg); }
}