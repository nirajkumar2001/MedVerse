import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AccessDecision = 'APPROVE' | 'DENY' | 'APPROVED' | 'REJECTED';

@Injectable({
  providedIn: 'root'
})
export class AccessRequestService {
  private readonly baseUrl = 'http://localhost:9090/api/v1/accessnotification';

  constructor(private readonly http: HttpClient) {}

  sendAccessRequest(
    patientId: string,
    requestMessage = 'Doctor requested access to patient medical profile',
    canViewPreviousRecords = false
  ): Observable<any> {
    return this.http.post(
      this.baseUrl,
      {
        patientId,
        requestMessage,
        canViewPreviousRecords
      },
      this.httpOptions()
    );
  }

  /*
   * Backward-compatible method.
   * Keep this because some older doctor components call sendAccessRequestToApi().
   */
  sendAccessRequestToApi(
    patientId: string,
    requestMessage = 'Doctor requested access to patient medical profile',
    canViewPreviousRecords = false
  ): Observable<any> {
    return this.sendAccessRequest(patientId, requestMessage, canViewPreviousRecords);
  }

  getForDoctor(unreadOnly = false): Observable<any> {
    const params = new HttpParams().set('unreadOnly', String(unreadOnly));

    return this.http.get(
      `${this.baseUrl}/doctor/me`,
      {
        ...this.httpOptions(),
        params
      }
    );
  }

  getForPatient(unreadOnly = false): Observable<any> {
    const params = new HttpParams().set('unreadOnly', String(unreadOnly));

    return this.http.get(
      `${this.baseUrl}/patient/me`,
      {
        ...this.httpOptions(),
        params
      }
    );
  }

  getBySessionId(sessionId: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/${encodeURIComponent(sessionId)}`,
      this.httpOptions()
    );
  }

 decide(
  sessionId: string,
  decision: AccessDecision,
  canViewPreviousRecords = false,
  reason = ''
): Observable<any> {
  const normalizedDecision = this.normalizeDecision(decision);

  return this.http.put(
    `${this.baseUrl}/${encodeURIComponent(sessionId)}/decision`,
    {
      decision: normalizedDecision,
      allowPreviousMedicalRecords: canViewPreviousRecords,
      canViewPreviousRecords,
      allowPrevious: canViewPreviousRecords,
      rejectionReason: reason
    },
    this.httpOptions()
  );
}

  approve(
    sessionId: string,
    canViewPreviousRecords = false
  ): Observable<any> {
    return this.decide(sessionId, 'APPROVE', canViewPreviousRecords);
  }

  reject(
    sessionId: string,
    reason = 'Patient rejected access request'
  ): Observable<any> {
    return this.decide(sessionId, 'DENY', false, reason);
  }

  markAsRead(sessionId: string): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/${encodeURIComponent(sessionId)}/read`,
      {},
      this.httpOptions()
    );
  }

  sendReminder(sessionId: string): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/${encodeURIComponent(sessionId)}/reminder`,
      {},
      this.httpOptions()
    );
  }

  endSession(
    sessionId: string,
    endReason = 'Access session ended'
  ): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/${encodeURIComponent(sessionId)}/end-session`,
      {
        endReason
      },
      this.httpOptions()
    );
  }

  delete(sessionId: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/${encodeURIComponent(sessionId)}`,
      this.httpOptions()
    );
  }

  private normalizeDecision(decision: AccessDecision): string {
    const value = String(decision || '').toUpperCase();

    if (value === 'APPROVED') {
      return 'APPROVE';
    }

    if (value === 'REJECTED') {
      return 'DENY';
    }

    return value;
  }

  private httpOptions(): {
    withCredentials: boolean;
    headers?: HttpHeaders;
  } {
    const token = this.getToken();

    return {
      withCredentials: true,
      headers: token
        ? new HttpHeaders({
            Authorization: `Bearer ${token}`
          })
        : undefined
    };
  }

  private getToken(): string {
    const directToken =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('accessToken') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token') ||
      '';

    if (directToken) {
      return this.cleanToken(directToken);
    }

    const rawUser =
      localStorage.getItem('medverseCurrentUser') ||
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('medverseCurrentUser') ||
      sessionStorage.getItem('currentUser') ||
      '';

    if (!rawUser) {
      return '';
    }

    try {
      const user = JSON.parse(rawUser);

      const token =
        user?.authToken ||
        user?.accessToken ||
        user?.token ||
        user?.data?.authToken ||
        user?.data?.accessToken ||
        user?.data?.token ||
        '';

      return token ? this.cleanToken(token) : '';
    } catch {
      return '';
    }
  }

  private cleanToken(token: string): string {
    return String(token || '').replace(/^Bearer\s+/i, '').trim();
  }
}