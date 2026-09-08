import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Patient } from '../../../core/models/patient.model';
import { PatientMedicalRecord } from '../../../core/models/medical-record.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { PatientService } from '../../../core/services/patient.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';

@Component({
  selector: 'app-patient-emergency-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './patient-emergency.component.html',
  styleUrl: './patient-emergency.component.css'
})
export class PatientEmergencyDetailsComponent implements OnInit, OnDestroy {
  private readonly photoStorageKey = 'medverse-patient-profile-photo';

  patient!: Patient;
  medicalRecord!: PatientMedicalRecord;

  isLoading = true;
  patientPhoto = localStorage.getItem(this.photoStorageKey) || '';

  menuItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/patient/home', icon: 'D', exact: true },
    { label: 'My Profile', route: '/patient/profile', icon: 'P', exact: true },
    { label: 'Emergency Details', route: '/patient/emergency-details', icon: 'E', exact: true },
    { label: 'My Medical Records', route: '/patient/medical-records', icon: 'M', exact: true },
    { label: 'Access Requests', route: '/patient/notifications', icon: 'N', badgeCount: 0, exact: true },
    { label: 'Help & Support', route: '/patient/support', icon: 'H', exact: true }
  ];

  private readonly photoUpdateHandler = (): void => {
    this.refreshPatientPhoto();
  };

  constructor(private readonly patientService: PatientService) {}

  ngOnInit(): void {
    this.loadEmergencyPage();

    this.refreshPatientPhoto();
    window.addEventListener('medverse-profile-photo-updated', this.photoUpdateHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('medverse-profile-photo-updated', this.photoUpdateHandler);
  }

  get patientPhotoUrl(): string {
    return this.patientPhoto || this.patient?.photoUrl || '';
  }

  get fullAddress(): string {
    if (!this.patient) {
      return 'Not added';
    }

    const parts = [
      this.patient.address,
      this.patient.district,
      this.patient.state,
      this.patient.pincode
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Not added';
  }

  get latestHeight(): string {
    const value = this.medicalRecord?.currentProfile?.heightCm;
    return value ? `${value} cm` : 'Not recorded';
  }

  get latestWeight(): string {
    const value = this.medicalRecord?.currentProfile?.weightKg;
    return value ? `${value} kg` : 'Not recorded';
  }

  get latestBmi(): string {
    const value = this.medicalRecord?.currentProfile?.bmi;
    return value ? String(value) : 'Not recorded';
  }

  get bloodGroup(): string {
    return (
      this.medicalRecord?.currentProfile?.bloodGroup ||
      this.patient?.emergencyRecord?.bloodGroup ||
      'Not recorded'
    );
  }

  get allergies(): string[] {
    const current = this.medicalRecord?.currentProfile?.allergies;
    const fallback = this.patient?.emergencyRecord?.allergies ?? [];

    const currentList = this.toList(current);
    return currentList.length > 0 ? currentList : fallback;
  }

  get chronicConditions(): string[] {
    const current = this.medicalRecord?.currentProfile?.chronicConditions;
    const fallback = this.patient?.emergencyRecord?.chronicConditions ?? [];

    const currentList = this.toList(current);
    return currentList.length > 0 ? currentList : fallback;
  }

  get currentMedications(): string[] {
    const current = this.medicalRecord?.currentProfile?.currentMedication;
    const fallback = this.patient?.emergencyRecord?.currentMedications ?? [];

    const currentList = this.toList(current);
    return currentList.length > 0 ? currentList : fallback;
  }

  get lastUpdatedAt(): string {
    const value =
      this.medicalRecord?.currentProfile?.lastUpdatedAt ||
      this.medicalRecord?.currentProfile?.updatedAt;

    return this.formatDate(value);
  }

  get lastUpdatedBy(): string {
    return this.medicalRecord?.currentProfile?.lastUpdatedByDoctorId || 'Not updated yet';
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'Not updated yet';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Not updated yet';
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private loadEmergencyPage(): void {
    this.isLoading = true;

    this.patientService.getMyEmergencyDetails().subscribe({
      next: patient => {
        this.patient = patient;

        this.patientService.getMyMedicalRecord().subscribe({
          next: record => {
            this.medicalRecord = record;
            this.isLoading = false;
          },
          error: error => {
            console.error('Unable to load patient medical record:', error);
            this.isLoading = false;
          }
        });
      },
      error: error => {
        console.error('Unable to load patient emergency profile:', error);
        this.isLoading = false;
      }
    });
  }

  private refreshPatientPhoto(): void {
    this.patientPhoto = localStorage.getItem(this.photoStorageKey) || '';
  }

  private toList(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(String).map(item => item.trim()).filter(Boolean);
    }

    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }

    return [];
  }
}