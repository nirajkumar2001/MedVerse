package com.tcs.medverse.service;

import com.tcs.medverse.dto.request.LearnerChangePasswordRequest;
import com.tcs.medverse.dto.request.LearnerForgotPasswordRequest;
import com.tcs.medverse.dto.request.LearnerLoginRequest;
import com.tcs.medverse.dto.request.LearnerRegisterRequest;
import com.tcs.medverse.dto.request.LearnerResetPasswordRequest;
import com.tcs.medverse.dto.response.LearnerLoginResponse;
import com.tcs.medverse.dto.response.LearnerProfileResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface LearnerAuthService {
    LearnerProfileResponse register(LearnerRegisterRequest request);
    LearnerLoginResponse login(LearnerLoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse);
    void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse);
    void forgotPassword(LearnerForgotPasswordRequest request);
    void resetPassword(LearnerResetPasswordRequest request);
    void changePassword(String authRefId, LearnerChangePasswordRequest request);
}