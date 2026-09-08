package com.tcs.medverse.util;

import org.springframework.stereotype.Component;

@Component
public class LoggingContext {
    public void infoLogT(String tag, String message) {
        System.out.println("[" + tag + "] " + message);
    }

    public void errorLogT(String tag, String message) {
        System.err.println("[" + tag + "] " + message);
    }
}