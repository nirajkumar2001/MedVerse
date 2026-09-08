import { Injectable } from '@angular/core';

export type MedAuthRole = 'learner' | 'patient' | 'doctor' | 'admin' | 'authOfficer';

@Injectable({
  providedIn: 'root'
})
export class RoleRedirectService {
  private readonly roleTargets: Record<MedAuthRole, string> = {
    learner: 'http://localhost:4201/learner/dashboard',
    patient: 'http://localhost:4200/patient/home',
    doctor: 'http://localhost:4200/doctor/home',
    admin: 'http://localhost:4202/admin/dashboard',
    authOfficer: 'http://localhost:4201/authofficer/auth-officer-dashboard'
  };

  private readonly pendingProfileTargets: Record<MedAuthRole, string> = {
    learner: 'http://localhost:4201/learner/profile',
    patient: 'http://localhost:4200/patient/profile',
    doctor: 'http://localhost:4200/doctor/profile',
    admin: 'http://localhost:4202/admin/dashboard',
    authOfficer: 'http://localhost:4201/authofficer/profile'
  };

  redirectToRole(role: MedAuthRole): void {
    window.location.href = this.roleTargets[role];
  }

  redirectToBackendRole(role: string): void {
    switch (role) {
      case 'LEARNER':
        this.redirectToRole('learner');
        return;
      case 'PATIENT':
        this.redirectToRole('patient');
        return;
      case 'DOCTOR':
        this.redirectToRole('doctor');
        return;
      case 'AUTHOFFICER':
        this.redirectToRole('authOfficer');
        return;
      case 'ADMIN':
        this.redirectToRole('admin');
        return;
      default:
        window.location.href = '/login';
    }
  }

  redirectPendingProfileToBackendRole(role: string): void {
    switch (role) {
      case 'LEARNER':
        window.location.href = this.pendingProfileTargets.learner;
        return;
      case 'PATIENT':
        window.location.href = this.pendingProfileTargets.patient;
        return;
      case 'DOCTOR':
        window.location.href = this.pendingProfileTargets.doctor;
        return;
      case 'AUTHOFFICER':
        window.location.href = this.pendingProfileTargets.authOfficer;
        return;
      case 'ADMIN':
        window.location.href = this.pendingProfileTargets.admin;
        return;
      default:
        window.location.href = '/login';
    }
  }
}
