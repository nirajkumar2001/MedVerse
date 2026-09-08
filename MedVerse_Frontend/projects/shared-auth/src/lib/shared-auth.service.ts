import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { apiUrl } from '../../../shared-services/src/lib/api-config';

export type BackendRole = 'LEARNER' | 'DOCTOR' | 'PATIENT' | 'AUTHOFFICER' | 'ADMIN';

export interface SignupApiRequest {
  name: string;
  email: string;
  password: string;
  role: BackendRole;
  documentName?: string;
  documentContentType?: string;
  documentData?: string;
  otpRefId?: string;
}

export interface VerifyOtpApiRequest {
  otpRefId: string;
  otp: string;
  identifier?: string;
  deviceId?: string;
  deviceType?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface LoginApiRequest {
  userId: string;
  password: string;
  deviceId?: string;
  deviceType?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface RejectedProfileResubmitRequest {
  userId: string;
  password: string;
  documentName: string;
  documentContentType: string;
  documentData: string;
}

export interface ApiEnvelope<T> {
  status: string;
  message: string;
  data: T;
}

export interface OtpResponse {
  otpRefId: string;
  otp?: string;
}

export interface SignupResponse {
  id: string;
  userId: string;
  authRefId: string;
  name: string;
  email: string;
  role: BackendRole;
  authStatus: string;
  active: boolean;
}

export interface LoginResponse {
  status: string;
  userId: string;
  name: string;
  email: string;
  role: BackendRole;
  authStatus: string;
  deviceRefId?: string;
  tempToken?: string;
  reviewRemark?: string;
  activeDevices?: ActiveDevice[];
  currentLoginDevice?: ActiveDevice;
}

export interface CurrentSession {
  userId: string;
  authRefId: string;
  name: string;
  email: string;
  role: BackendRole;
  authStatus: string;
}

export interface ActiveDevice {
  deviceRefId: string;
  deviceType?: string;
  deviceModel?: string;
  osVersion?: string;
  createdAt?: string;
  deviceName: string;
  browser?: string;
  location?: string;
  lastActive?: string;
  os?: string;
  isActiveNow?: boolean;
  isCurrentDevice?: boolean;
}

export interface LogoutDeviceRequest {
  tempToken?: string;
  userId?: string;
  deviceRefId: string;
}

export interface ForgotPasswordRequest {
  identifier: string;
  otpRefId?: string;
}

export interface ResetPasswordRequest {
  identifier: string;
  otpRefId: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class SharedAuthService {
  private readonly apiBaseUrl = apiUrl('/auth');

  constructor(private readonly http: HttpClient) {}

  signup(request: SignupApiRequest): Observable<ApiEnvelope<OtpResponse>> {
    return this.http.post<ApiEnvelope<OtpResponse>>(`${this.apiBaseUrl}/signup`, request, {
      withCredentials: true
    });
  }

  verifyOtp(request: VerifyOtpApiRequest): Observable<ApiEnvelope<SignupResponse>> {
    return this.http.post<ApiEnvelope<SignupResponse>>(`${this.apiBaseUrl}/verify-otp`, request, {
      withCredentials: true
    });
  }

  resendOtp(otpRefId: string): Observable<ApiEnvelope<OtpResponse>> {
    return this.http.post<ApiEnvelope<OtpResponse>>(`${this.apiBaseUrl}/resend-otp`, { otpRefId }, {
      withCredentials: true
    });
  }

  resendPasswordResetOtp(otpRefId: string): Observable<ApiEnvelope<OtpResponse>> {
    return this.http.post<ApiEnvelope<OtpResponse>>(`${this.apiBaseUrl}/resend-password-reset-otp`, { otpRefId }, {
      withCredentials: true
    });
  }

  login(request: LoginApiRequest): Observable<ApiEnvelope<LoginResponse>> {
    return this.http.post<ApiEnvelope<LoginResponse>>(`${this.apiBaseUrl}/login`, request, {
      withCredentials: true
    });
  }

  resubmitRejectedProfile(request: RejectedProfileResubmitRequest): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(`${this.apiBaseUrl}/rejected-profile/resubmit`, request, {
      withCredentials: true
    });
  }

  validateSession(): Observable<boolean> {
    return this.http.get<ApiEnvelope<unknown>>(`${this.apiBaseUrl}/validate-device`, {
      withCredentials: true
    }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  getCurrentSession(): Observable<CurrentSession | null> {
    return this.http.get<ApiEnvelope<CurrentSession>>(`${this.apiBaseUrl}/me`, {
      withCredentials: true
    }).pipe(
      map(response => response.data),
      catchError(() => of(null))
    );
  }

  logout(): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(`${this.apiBaseUrl}/logout`, {}, {
      withCredentials: true
    });
  }

  clearClientSession(): void {
    localStorage.removeItem('medverseCurrentUser');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    sessionStorage.clear();
  }

  logoutDevice(request: LogoutDeviceRequest): Observable<ApiEnvelope<LoginResponse>> {
    return this.http.post<ApiEnvelope<LoginResponse>>(`${this.apiBaseUrl}/logout-device`, request, {
      withCredentials: true,
      headers: request.tempToken
        ? new HttpHeaders({ Authorization: `Bearer ${request.tempToken}` })
        : undefined
    });
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<ApiEnvelope<OtpResponse>> {
    return this.http.post<ApiEnvelope<OtpResponse>>(`${this.apiBaseUrl}/forgot-password`, {
      identifier: request.identifier,
      otpRefId: request.otpRefId
    }, {
      withCredentials: true
    });
  }

  resetPassword(request: ResetPasswordRequest): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(`${this.apiBaseUrl}/reset-password`, {
      otpRefId: request.otpRefId,
      otp: request.otp,
      newPassword: request.newPassword,
      confirmPassword: request.confirmPassword
    }, {
      withCredentials: true
    });
  }

  changePassword(request: ChangePasswordRequest): Observable<ApiEnvelope<unknown>> {
    return this.http.put<ApiEnvelope<unknown>>(`${this.apiBaseUrl}/change-password`, request, {
      withCredentials: true
    });
  }

  toBackendRole(role: string): BackendRole {
    const normalizedRole = role.trim().toLowerCase().replace(/\s+/g, '');

    switch (normalizedRole) {
      case 'learner':
        return 'LEARNER';
      case 'doctor':
        return 'DOCTOR';
      case 'patient':
        return 'PATIENT';
      case 'authofficer':
      case 'authenticationofficer':
        return 'AUTHOFFICER';
      case 'admin':
        return 'ADMIN';
      default:
        return 'LEARNER';
    }
  }
}
