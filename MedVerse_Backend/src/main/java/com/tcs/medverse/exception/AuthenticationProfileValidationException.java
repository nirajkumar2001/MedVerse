/**
 * Thrown when authentication officer profile
 * validation rules are violated.
 */

package com.tcs.medverse.exception;
public class AuthenticationProfileValidationException extends Exception {

    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public AuthenticationProfileValidationException(String message) {
        super(message);
    }
} 

