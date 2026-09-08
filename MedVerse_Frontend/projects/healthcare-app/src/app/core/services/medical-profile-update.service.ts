import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MedicalProfileUpdatePayload {
  sessionId: string;
  patientId: string;

  // Emergency medical profile
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedication?: string;

  // Current visit
  disease: string;
  medicalReports?: string;
  findings?: string;
  prescription?: string;

  // General medical findings
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  bloodPressure?: string | null;
  bodyTemperature?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalProfileUpdateService {
  private readonly apiBaseUrl = 'http://localhost:9090/api/v1/editpatientprofile';
  private readonly emergencyBaseUrl = 'http://localhost:9090/api/v1/emergency';

  constructor(private readonly http: HttpClient) {}

  getCompleteRecordForDoctor(patientId: string, sessionId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiBaseUrl}/record/${encodeURIComponent(patientId)}`,
      {
        params: { sessionId },
        ...this.httpOptions()
      }
    );
  }

  getPatientEmergencyDetails(patientId: string): Observable<any> {
    return this.http.get<any>(
      `${this.emergencyBaseUrl}/patients/${encodeURIComponent(patientId)}`,
      this.httpOptions()
    );
  }

  getMyMedicalRecord(): Observable<any> {
    return this.http.get<any>(
      `${this.apiBaseUrl}/me/record`,
      this.httpOptions()
    );
  }

  getSessionUpdates(sessionId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiBaseUrl}/session/${encodeURIComponent(sessionId)}`,
      this.httpOptions()
    );
  }

  createUpdate(payload: MedicalProfileUpdatePayload): Observable<any> {
    return this.http.post<any>(
      this.apiBaseUrl,
      payload,
      this.httpOptions()
    );
  }

  updateExisting(
    updateId: number,
    payload: Partial<MedicalProfileUpdatePayload>
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiBaseUrl}/${updateId}`,
      payload,
      this.httpOptions()
    );
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