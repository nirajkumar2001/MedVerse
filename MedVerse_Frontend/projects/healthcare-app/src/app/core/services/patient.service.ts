import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';

import { PatientMedicalRecord } from '../models/medical-record.model';
import { Patient } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly apiBaseUrl = 'http://localhost:9090/api/v1';

  constructor(private readonly http: HttpClient) {}

  getPatients(): Patient[] {
    return [];
  }

  getMyProfile(): Observable<Patient> {
    return this.http.get<any>(`${this.apiBaseUrl}/patient/me`, {
      withCredentials: true
    }).pipe(
      map(response => this.toPatient(response?.data ?? response)),
      catchError(error => {
        console.error('Unable to load patient profile from backend:', error);
        return of(this.emptyPatient());
      })
    );
  }

  updateMyProfile(payload: Partial<Patient>): Observable<Patient> {
    const body = this.compactBody({
      name: payload.fullName ?? payload.name,
      age: payload.age,
      gender: payload.gender,
      emergencyContact: payload.emergencyContact ?? payload.contactNumber,
      contactNumber: payload.contactNumber ?? payload.emergencyContact,
      address: payload.address,
      district: payload.district,
      state: payload.state,
      pincode: payload.pincode,
      height: payload.height,
      weight: payload.weight,
      profileImage: payload.profileImage,
      photoUrl: payload.photoUrl
    });

    return this.http.put<any>(`${this.apiBaseUrl}/patient/me`, body, {
      withCredentials: true
    }).pipe(
      map(response => this.toPatient(response?.data ?? response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Unable to update patient profile:', error);
        return throwError(() => error);
      })
    );
  }

  uploadPatientProfileImage(file: File): Observable<Patient> {
    return new Observable<Patient>(observer => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = String(reader.result || '');
        this.updateMyProfile({ photoUrl: image, profileImage: image }).subscribe(observer);
      };

      reader.onerror = error => observer.error(error);
      reader.readAsDataURL(file);
    });
  }

  removePatientProfileImage(): Observable<Patient> {
    return this.updateMyProfile({ photoUrl: '', profileImage: '' });
  }

  getMyEmergencyDetails(): Observable<Patient> {
    return forkJoin({
      patient: this.getMyProfile(),
      medicalRecord: this.getMyMedicalRecord()
    }).pipe(
      map(({ patient, medicalRecord }) => this.mergeEmergencyPatient(patient, medicalRecord)),
      catchError(error => {
        console.error('Unable to load patient emergency details:', error);
        return of(this.emptyPatient());
      })
    );
  }

  getMyMedicalRecord(): Observable<PatientMedicalRecord> {
    return this.http.get<any>(`${this.apiBaseUrl}/editpatientprofile/me/record`, {
      withCredentials: true
    }).pipe(
      map(response => this.toMedicalRecord(response?.data ?? response)),
      catchError(error => {
        console.error('Unable to load patient medical record:', error);
        return of(this.emptyMedicalRecord());
      })
    );
  }

  getPatientById(patientId: string): Patient | undefined {
    return undefined;
  }

  searchPatients(query: string): Patient[] {
    return [];
  }

  normalizePatientId(patientId: string): string {
    const value = patientId.trim().toUpperCase();

    if (/^PAT\d{5}$/.test(value)) {
      return value;
    }

    if (/^\d{5}$/.test(value)) {
      return `PAT${value}`;
    }

    return value;
  }


  private compactBody<T extends Record<string, unknown>>(body: T): Partial<T> {
    return Object.entries(body).reduce((result, [key, value]) => {
      if (value !== undefined) {
        (result as Record<string, unknown>)[key] = value;
      }

      return result;
    }, {} as Partial<T>);
  }

  private toPatient(source: any): Patient {
    const currentUser = this.getCurrentUser();

    const patientId =
      source?.patientId ??
      source?.userId ??
      currentUser?.userId ??
      '';

    const fullName =
      source?.fullName ??
      source?.name ??
      currentUser?.name ??
      'Patient';

    return {
      patientId,
      fullName,
      name: fullName,
      userId: source?.userId ?? patientId,
      email: source?.email ?? currentUser?.email ?? '',
      age: Number(source?.age ?? 0),
      gender: this.toGender(source?.gender),
      contactNumber: source?.contactNumber ?? source?.emergencyContact ?? '',
      emergencyContact: source?.emergencyContact ?? source?.contactNumber ?? '',
      address: source?.address ?? '',
      district: source?.district ?? '',
      state: source?.state ?? '',
      pincode: source?.pincode != null ? String(source.pincode) : '',
      height: this.toNullableNumber(source?.height),
      weight: this.toNullableNumber(source?.weight),
      profileImage:
        source?.profileImage ??
        source?.photoUrl ??
        source?.photoURL ??
        source?.profilePhotoUrl ??
        source?.profilePhoto ??
        source?.imageUrl ??
        '',
      photoText: source?.photoText ?? 'No Photo Available',
      photoUrl:
        source?.photoUrl ??
        source?.profileImage ??
        source?.photoURL ??
        source?.profilePhotoUrl ??
        source?.profilePhoto ??
        source?.imageUrl ??
        '',
      emergencyRecord: {
        bloodGroup: source?.bloodGroup ?? source?.emergencyRecord?.bloodGroup ?? '',
        allergies: this.toList(source?.allergies ?? source?.emergencyRecord?.allergies),
        chronicConditions: this.toList(
          source?.chronicConditions ?? source?.emergencyRecord?.chronicConditions
        ),
        currentMedications: this.toList(
          source?.currentMedication ??
          source?.currentMedications ??
          source?.emergencyRecord?.currentMedications
        )
      }
    };
  }


  private mergeEmergencyPatient(patient: Patient, medicalRecord: PatientMedicalRecord): Patient {
    const current = medicalRecord?.currentProfile;
    const latestVisit = [...(medicalRecord?.previousRecords || [])]
      .sort((a, b) => this.toTimestamp(b.dateOfUpdate || b.updatedAt || b.createdAt) - this.toTimestamp(a.dateOfUpdate || a.updatedAt || a.createdAt))[0];

    return {
      ...patient,
      patientId: patient.patientId || current?.patientId || latestVisit?.patientId || '',
      userId: patient.userId || patient.patientId || current?.patientId || latestVisit?.patientId || '',
      contactNumber: patient.contactNumber || patient.emergencyContact || '',
      emergencyContact: patient.emergencyContact || patient.contactNumber || '',
      emergencyRecord: {
        bloodGroup: this.firstNonBlank(
          current?.bloodGroup,
          latestVisit?.bloodGroup,
          patient.emergencyRecord?.bloodGroup
        ),
        allergies: this.firstList(
          current?.allergies,
          latestVisit?.allergies,
          patient.emergencyRecord?.allergies
        ),
        chronicConditions: this.firstList(
          current?.chronicConditions,
          latestVisit?.chronicConditions,
          patient.emergencyRecord?.chronicConditions
        ),
        currentMedications: this.firstList(
          current?.currentMedication,
          latestVisit?.currentMedication,
          patient.emergencyRecord?.currentMedications
        )
      }
    };
  }

  private toMedicalRecord(source: any): PatientMedicalRecord {
    const current = source?.currentProfile ?? source?.profile ?? source ?? {};
    const previousRecords = Array.isArray(source?.previousRecords)
      ? source.previousRecords
      : [];

    return {
      currentProfile: {
        patientId: current?.patientId ?? '',

        bloodGroup: current?.bloodGroup ?? '',
        allergies: current?.allergies ?? '',
        chronicConditions: current?.chronicConditions ?? '',
        currentMedication: current?.currentMedication ?? current?.currentMedications ?? '',
        medicalReports: current?.medicalReports ?? '',

        disease: current?.disease ?? current?.lastDisease ?? '',
        findings: current?.findings ?? current?.lastFindings ?? '',
        prescription: current?.prescription ?? current?.lastPrescription ?? '',

        heightCm: this.toNullableNumber(current?.heightCm),
        weightKg: this.toNullableNumber(current?.weightKg),
        bmi: this.toNullableNumber(current?.bmi),
        bloodPressure: current?.bloodPressure ?? '',
        bodyTemperature: current?.bodyTemperature ?? '',

        lastDisease: current?.lastDisease ?? current?.disease ?? '',
        lastFindings: current?.lastFindings ?? current?.findings ?? '',
        lastPrescription: current?.lastPrescription ?? current?.prescription ?? '',

        lastUpdatedByDoctorId: current?.lastUpdatedByDoctorId ?? '',
        lastUpdatedSessionId: current?.lastUpdatedSessionId ?? '',
        lastUpdatedAt: current?.lastUpdatedAt ?? '',
        createdAt: current?.createdAt ?? '',
        updatedAt: current?.updatedAt ?? current?.lastUpdatedAt ?? ''
      },

      previousRecords: previousRecords.map((record: any) => ({
        updateId: Number(record?.updateId ?? 0),
        sessionId: record?.sessionId ?? '',
        patientId: record?.patientId ?? '',
        doctorId: record?.doctorId ?? '',

        bloodGroup: record?.bloodGroup ?? '',
        allergies: record?.allergies ?? '',
        chronicConditions: record?.chronicConditions ?? '',
        currentMedication: record?.currentMedication ?? '',

        disease: record?.disease ?? '',
        medicalReports: record?.medicalReports ?? '',
        findings: record?.findings ?? '',
        prescription: record?.prescription ?? '',

        heightCm: this.toNullableNumber(record?.heightCm),
        weightKg: this.toNullableNumber(record?.weightKg),
        bmi: this.toNullableNumber(record?.bmi),
        bloodPressure: record?.bloodPressure ?? '',
        bodyTemperature: record?.bodyTemperature ?? '',

        dateOfUpdate: record?.dateOfUpdate ?? record?.createdAt ?? record?.updatedAt ?? '',
        createdAt: record?.createdAt ?? '',
        updatedAt: record?.updatedAt ?? ''
      }))
    };
  }

  private emptyPatient(): Patient {
    const currentUser = this.getCurrentUser();

    return {
      patientId: currentUser?.userId ?? '',
      userId: currentUser?.userId ?? '',
      fullName: currentUser?.name ?? 'Patient',
      name: currentUser?.name ?? 'Patient',
      email: currentUser?.email ?? '',
      age: 0,
      gender: 'Other',
      contactNumber: '',
      emergencyContact: '',
      address: '',
      district: '',
      state: '',
      pincode: '',
      height: null,
      weight: null,
      profileImage: '',
      photoUrl: '',
      photoText: 'No Photo Available',
      emergencyRecord: {
        bloodGroup: '',
        allergies: [],
        chronicConditions: [],
        currentMedications: []
      }
    };
  }

  private emptyMedicalRecord(): PatientMedicalRecord {
    return {
      currentProfile: {
        patientId: '',

        bloodGroup: '',
        allergies: '',
        chronicConditions: '',
        currentMedication: '',
        medicalReports: '',

        disease: '',
        findings: '',
        prescription: '',

        heightCm: null,
        weightKg: null,
        bmi: null,
        bloodPressure: '',
        bodyTemperature: '',

        lastDisease: '',
        lastFindings: '',
        lastPrescription: '',

        lastUpdatedByDoctorId: '',
        lastUpdatedSessionId: '',
        lastUpdatedAt: '',
        createdAt: '',
        updatedAt: ''
      },
      previousRecords: []
    };
  }


  private firstNonBlank(...values: Array<string | number | null | undefined>): string {
    for (const value of values) {
      const text = String(value ?? '').trim();

      if (text) {
        return text;
      }
    }

    return '';
  }

  private firstList(...values: Array<string | string[] | null | undefined>): string[] {
    for (const value of values) {
      const list = this.toList(value);

      if (list.length) {
        return list;
      }
    }

    return [];
  }

  private toTimestamp(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  private toList(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(String).filter(Boolean);
    }

    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private toGender(value: unknown): 'Male' | 'Female' | 'Other' {
    const gender = String(value ?? '').trim().toLowerCase();

    if (gender === 'male') {
      return 'Male';
    }

    if (gender === 'female') {
      return 'Female';
    }

    return 'Other';
  }

  private getCurrentUser(): any | null {
    const raw = localStorage.getItem('medverseCurrentUser');

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
