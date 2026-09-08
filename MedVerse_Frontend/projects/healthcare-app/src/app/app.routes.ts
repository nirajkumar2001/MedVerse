import { Routes } from '@angular/router';

import {
  authGuard,
  ChangePasswordComponent,
  DeviceLimitReachedComponent,
  ForgotPasswordComponent,
  LoginComponent,
  OtpVerificationComponent,
  ResetPasswordComponent,
  SignupComponent
} from '../../../shared-auth/src/public-api';

import { DoctorDashboardComponent } from './doctor/pages/doctor-home/doctor-dashboard.component';
import { DoctorNotificationsComponent } from './doctor/pages/doctor-notifications/doctor-notifications.component';
import { DoctorProfileComponent } from './doctor/pages/doctor-profile/doctor-profile.component';
import { DoctorSupportComponent } from './doctor/pages/doctor-support/doctor-support.component';
import { EmergencyLookupComponent } from './doctor/pages/emergency-lookup/emergency-lookup.component';
import { ApprovedPatientProfileComponent } from './doctor/pages/approved-patient-profile/approved-patient-profile.component';
import { PatientCareComponent } from './doctor/pages/patient-care/patient-care.component';

import { PatientDashboardComponent } from './patient/pages/patient-dashboard/patient-dashboard.component';
import { PatientEmergencyComponent } from './patient/pages/patient-emergency/patient-emergency.component';import { PatientMedicalRecordsComponent } from './patient/pages/patient-medical-records/patient-medical-records.component';
import { PatientNotificationsComponent } from './patient/pages/patient-notifications/patient-notifications.component';
import { PatientProfileComponent } from './patient/pages/patient-profile/patient-profile.component';
import { PatientSupportComponent } from './patient/pages/patient-support/patient-support.component';

import { SettingsComponent } from './shared/pages/settings/settings.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  /* ---------- Public Auth Routes ---------- */
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'otp-verification',
    component: OtpVerificationComponent
  },
  {
    path: 'device-limit-reached',
    component: DeviceLimitReachedComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent
  },

  /* ---------- Doctor Protected Routes ---------- */
  {
    path: 'doctor/home',
    component: DoctorDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor/notifications',
    component: DoctorNotificationsComponent,
    canActivate: [authGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor/patient-care',
    component: PatientCareComponent,
    canActivate: [authGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor/approved-patient-profile',
    component: ApprovedPatientProfileComponent,
    canActivate: [authGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor/profile',
    component: DoctorProfileComponent,
    canActivate: [authGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor/emergency-lookup',
    component: EmergencyLookupComponent,
    canActivate: [authGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor/support',
    component: DoctorSupportComponent,
    canActivate: [authGuard],
    data: { roles: ['DOCTOR'] }
  },

  /* ---------- Patient Protected Routes ---------- */
  {
    path: 'patient/home',
    component: PatientDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'patient/profile',
    component: PatientProfileComponent,
    canActivate: [authGuard],
    data: { roles: ['PATIENT'] }
  },
  {
  path: 'patient/emergency-details',
  component: PatientEmergencyComponent,
  canActivate: [authGuard],
  data: { roles: ['PATIENT'] }
},
  {
    path: 'patient/medical-records',
    component: PatientMedicalRecordsComponent,
    canActivate: [authGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'patient/notifications',
    component: PatientNotificationsComponent,
    canActivate: [authGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'patient/settings',
    component: SettingsComponent,
    canActivate: [authGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'patient/support',
    component: PatientSupportComponent,
    canActivate: [authGuard],
    data: { roles: ['PATIENT'] }
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];