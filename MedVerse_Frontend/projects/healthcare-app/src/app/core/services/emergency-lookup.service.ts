import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmergencyPatientSummary {
  patientId: string;
  fullName: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  contactNumber?: string;
  address?: string;
  district?: string;
  state?: string;
  pincode?: number | string;
  photoUrl?: string;
}

export interface EmergencyPatientDetails extends EmergencyPatientSummary {
  allergies?: string;
  chronicConditions?: string;
  currentMedication?: string;
  currentMedications?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  lastUpdatedAt?: string | null;
}

export interface EmergencyLookupSearchResponse {
  query?: string;
  matchType?: 'SINGLE' | 'MULTIPLE' | 'NONE' | string;
  resultType?: 'SINGLE' | 'MULTIPLE' | 'NONE' | string;
  totalMatches?: number;
  message?: string;
  patient?: EmergencyPatientDetails | null;
  patientDetails?: EmergencyPatientDetails | null;
  patients?: EmergencyPatientSummary[];
  matches?: EmergencyPatientSummary[];
}

@Injectable({
  providedIn: 'root'
})
export class EmergencyLookupService {
  private readonly baseUrl = 'http://localhost:9090/api/v1/emergency';

  constructor(private readonly http: HttpClient) {}

  search(query: string): Observable<EmergencyLookupSearchResponse> {
    const params = new HttpParams().set('query', String(query || '').trim());

    return this.http.get<EmergencyLookupSearchResponse>(
      `${this.baseUrl}/search`,
      {
        params,
        ...this.httpOptions()
      }
    );
  }

  getPatientDetails(patientId: string): Observable<EmergencyPatientDetails> {
    return this.http.get<EmergencyPatientDetails>(
      `${this.baseUrl}/patients/${encodeURIComponent(patientId)}`,
      this.httpOptions()
    );
  }

  searchPatient(query: string): Observable<EmergencyLookupSearchResponse> {
    return this.search(query);
  }

  getPatientById(patientId: string): Observable<EmergencyPatientDetails> {
    return this.getPatientDetails(patientId);
  }

  private httpOptions(): {
    withCredentials: boolean;
    headers?: HttpHeaders;
  } {
    const token = this.getToken();

    return {
      withCredentials: true,
      headers: token
        ? new HttpHeaders({ Authorization: `Bearer ${token}` })
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