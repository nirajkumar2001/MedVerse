import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Patient } from '../../../core/models/patient.model';
import { MedicalVisitRecord, PatientMedicalRecord } from '../../../core/models/medical-record.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { PatientService } from '../../../core/services/patient.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';

@Component({
  selector: 'app-patient-medical-records',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './patient-medical-records.component.html',
  styleUrl: './patient-medical-records.component.css'
})
export class PatientMedicalRecordsComponent implements OnInit, OnDestroy {
  private readonly photoStorageKey = 'medverse-patient-profile-photo';

  patient!: Patient;
  record!: PatientMedicalRecord;

  selectedVisit?: MedicalVisitRecord;
  exported = false;
  searchTerm = '';

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
    this.patientService.getMyProfile().subscribe(patient => {
      this.patient = patient;
    });

    this.patientService.getMyMedicalRecord().subscribe(record => {
      this.record = record;

      if (!this.selectedVisit && record.previousRecords.length > 0) {
        this.selectedVisit = record.previousRecords[0];
      }
    });

    this.refreshPatientPhoto();
    window.addEventListener('medverse-profile-photo-updated', this.photoUpdateHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('medverse-profile-photo-updated', this.photoUpdateHandler);
  }

  get patientPhotoUrl(): string {
    return this.patientPhoto || this.patient?.photoUrl || '';
  }

  get latestHeightCm(): string {
    const value = this.record?.currentProfile?.heightCm;
    return value ? `${value} cm` : 'Not recorded';
  }

  get latestWeightKg(): string {
    const value = this.record?.currentProfile?.weightKg;
    return value ? `${value} kg` : 'Not recorded';
  }

  get latestBmi(): string {
    const profileBmi = this.record?.currentProfile?.bmi;

    if (profileBmi) {
      return String(profileBmi);
    }

    const height = this.record?.currentProfile?.heightCm;
    const weight = this.record?.currentProfile?.weightKg;

    if (!height || !weight || height <= 0 || weight <= 0) {
      return 'Not recorded';
    }

    const heightMeter = height / 100;
    const bmi = weight / (heightMeter * heightMeter);

    return (Math.round(bmi * 10) / 10).toString();
  }

  get latestBloodPressure(): string {
    return this.record?.currentProfile?.bloodPressure || 'Not recorded';
  }

  get latestBodyTemperature(): string {
    return this.record?.currentProfile?.bodyTemperature || 'Not recorded';
  }

  get filteredVisits(): MedicalVisitRecord[] {
    const visits = this.record?.previousRecords ?? [];
    const query = this.searchTerm.trim().toLowerCase();

    if (!query) {
      return visits;
    }

    return visits.filter(visit => {
      return [
        visit.doctorId,
        visit.disease,
        visit.findings,
        visit.medicalReports,
        visit.prescription,
        visit.bloodPressure,
        visit.bodyTemperature,
        visit.dateOfUpdate
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  exportPdf(): void {
    this.exported = true;

    setTimeout(() => {
      window.print();
    }, 100);

    setTimeout(() => {
      this.exported = false;
    }, 2400);
  }

  viewVisitDetails(visit: MedicalVisitRecord): void {
    this.selectedVisit = visit;
  }

  isSelectedVisit(visit: MedicalVisitRecord): boolean {
    if (!this.selectedVisit) {
      return false;
    }

    return this.visitKey(this.selectedVisit) === this.visitKey(visit);
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'N/A';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private visitKey(visit: MedicalVisitRecord): string {
    return String(
      visit.updateId ??
        visit.dateOfUpdate ??
        visit.doctorId ??
        ''
    );
  }

  private refreshPatientPhoto(): void {
    this.patientPhoto = localStorage.getItem(this.photoStorageKey) || '';
  }
}