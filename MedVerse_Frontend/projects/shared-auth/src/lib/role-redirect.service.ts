import { Injectable } from '@angular/core';

export type MedAuthRole = 'learner' | 'patient' | 'doctor' | 'admin' | 'authOfficer';

@Injectable({
  providedIn: 'root'
})
export class RoleRedirectService {
  private readonly roleTargets: Record<MedAuthRole, string> = {
    learner: '/learning/learner/dashboard',
    patient: '/healthcare/patient/home',
    doctor: '/healthcare/doctor/home',
    admin: '/admin/admin/dashboard',
    authOfficer: '/learning/authofficer/auth-officer-dashboard'
  };

  private readonly pendingProfileTargets: Record<MedAuthRole, string> = {
    learner: '/learning/learner/profile',
    patient: '/healthcare/patient/profile',
    doctor: '/healthcare/doctor/profile',
    admin: '/admin/admin/dashboard',
    authOfficer: '/learning/authofficer/profile'
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
