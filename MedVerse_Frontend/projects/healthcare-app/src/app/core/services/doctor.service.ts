import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { Doctor } from '../models/doctor.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly apiBaseUrl = 'http://localhost:9090/api/v1';
  private readonly doctorSubject = new BehaviorSubject<Doctor>(this.emptyDoctor());

  constructor(private readonly http: HttpClient) {}

  getDoctor(): Observable<Doctor> {
    return this.http.get<any>(`${this.apiBaseUrl}/doctorprofile/me`, {
      withCredentials: true
    }).pipe(
      map(response => this.toDoctor(response?.data ?? response)),
      tap(doctor => this.doctorSubject.next(doctor)),
      catchError(error => {
        console.error('Unable to load doctor profile from backend:', error);
        const fallback = this.emptyDoctor();
        this.doctorSubject.next(fallback);
        return of(fallback);
      })
    );
  }

  saveDoctorProfile(updatedDoctor: Doctor): Observable<Doctor> {
    const phoneDigits = String(updatedDoctor.phone || '').replace(/\D/g, '').slice(-10);

    return this.http.put<any>(`${this.apiBaseUrl}/doctorprofile/me`, {
      phoneNumber: phoneDigits,
      designation: String(updatedDoctor.designation || '').trim(),
      hospitalName: String(updatedDoctor.hospital || '').trim(),
      department: String(updatedDoctor.department || '').trim(),
      yearsOfExperience: Number(updatedDoctor.experience ?? 0),
      profileImage: updatedDoctor.profileImage || ''
    }, {
      withCredentials: true
    }).pipe(
      map(response => this.toDoctor(response?.data ?? response)),
      tap(doctor => this.doctorSubject.next(doctor)),
      catchError((error: HttpErrorResponse) => {
        console.error('Unable to save doctor profile to backend:', error);
        throw error;
      })
    );
  }

  uploadDoctorProfileImage(file: File): Observable<Doctor> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiBaseUrl}/doctorprofile/me/image`, formData, {
      withCredentials: true
    }).pipe(
      map(response => this.toDoctor(response?.data ?? response)),
      tap(doctor => {
        localStorage.setItem('medverse-doctor-profile-photo', doctor.profileImage || '');
        this.doctorSubject.next(doctor);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Unable to upload doctor profile image:', error);
        throw error;
      })
    );
  }

  removeDoctorProfileImage(): Observable<Doctor> {
    return this.http.delete<any>(`${this.apiBaseUrl}/doctorprofile/me/image`, {
      withCredentials: true
    }).pipe(
      map(response => this.toDoctor(response?.data ?? response)),
      tap(doctor => {
        localStorage.removeItem('medverse-doctor-profile-photo');
        this.doctorSubject.next(doctor);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Unable to remove doctor profile image:', error);
        throw error;
      })
    );
  }

  getCurrentDoctor(): Doctor {
    return this.doctorSubject.value;
  }

  updateDoctor(updatedDoctor: Doctor): void {
    this.doctorSubject.next({ ...updatedDoctor });
  }

  resetDoctor(): void {
    this.doctorSubject.next(this.emptyDoctor());
  }

  private toDoctor(source: any): Doctor {
    const currentUser = this.getCurrentUser();

    const fullName =
      source?.fullName ??
      source?.name ??
      currentUser?.fullName ??
      currentUser?.name ??
      'Doctor';

    return {
      doctorId: source?.doctorId ?? source?.userId ?? currentUser?.userId ?? currentUser?.id ?? '',
      fullName,
      email: source?.email ?? currentUser?.email ?? '',
      phone: String(source?.phoneNumber ?? source?.phone ?? '').replace(/\D/g, '').slice(-10),
      designation: source?.designation ?? '',
      hospital: source?.hospitalName ?? source?.hospital ?? '',
      department: source?.department ?? '',
      experience: Number(source?.yearsOfExperience ?? source?.experience ?? 0),
      initials: this.toInitials(fullName),
      profileImage:
        source?.profileImage ??
        source?.photoUrl ??
        source?.imageUrl ??
        localStorage.getItem('medverse-doctor-profile-photo') ??
        ''
    };
  }

  private emptyDoctor(): Doctor {
    const currentUser = this.getCurrentUser();
    const fullName = currentUser?.fullName ?? currentUser?.name ?? 'Doctor';

    return {
      doctorId: currentUser?.userId ?? currentUser?.id ?? '',
      fullName,
      email: currentUser?.email ?? '',
      phone: '',
      designation: '',
      hospital: '',
      department: '',
      experience: 0,
      initials: this.toInitials(fullName),
      profileImage: localStorage.getItem('medverse-doctor-profile-photo') ?? ''
    };
  }

  private toInitials(fullName: string): string {
    return String(fullName || '')
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'DR';
  }

  private getCurrentUser(): any | null {
    const raw =
      localStorage.getItem('medverseCurrentUser') ||
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('medverseCurrentUser') ||
      sessionStorage.getItem('currentUser') ||
      '';

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
