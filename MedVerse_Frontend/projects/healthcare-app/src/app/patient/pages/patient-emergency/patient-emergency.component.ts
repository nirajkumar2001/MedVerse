import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { PatientMedicalRecord, PatientMedicalProfileRecord } from '../../../core/models/medical-record.model';
import { Patient } from '../../../core/models/patient.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';
import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';
import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type EmergencyStatus = 'complete' | 'partial' | 'empty';

interface EmergencyMetric {
  label: string;
  value: string;
  note: string;
}

interface EmergencyAction {
  title: string;
  description: string;
  route?: string;
  action?: 'print' | 'download';
}

@Component({
  selector: 'app-patient-emergency',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    HealthcareFooterComponent,
    LogoutConfirmModalComponent
  ],
  templateUrl: './patient-emergency.component.html',
  styleUrls: ['./patient-emergency.component.css']
})
export class PatientEmergencyComponent implements OnInit {
  patient: Patient | null = null;
  medicalRecord: PatientMedicalRecord | null = null;

  isLoading = true;
  hasLoadError = false;
  showLogoutModal = false;

  menuItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/patient/home', icon: 'D', exact: true },
    { label: 'My Profile', route: '/patient/profile', icon: 'P', exact: true },
    { label: 'Emergency Details', route: '/patient/emergency-details', icon: 'E', exact: true },
    { label: 'My Medical Records', route: '/patient/medical-records', icon: 'M', exact: true },
    { label: 'Access Requests', route: '/patient/notifications', icon: 'N', exact: true },
    { label: 'Help & Support', route: '/patient/support', icon: 'H', exact: true }
  ];

  readonly actions: EmergencyAction[] = [
    {
      title: 'View Medical Records',
      description: 'Open medical history and visit updates.',
      route: '/patient/medical-records'
    },
    {
      title: 'Edit General Profile',
      description: 'Update your name, address, emergency contact, and profile photo.',
      route: '/patient/profile'
    },
    {
      title: 'Print Emergency Record',
      description: 'Print a clean emergency copy for urgent handoff.',
      action: 'print'
    },
    {
      title: 'Download Summary',
      description: 'Save a readable text copy of your emergency details.',
      action: 'download'
    }
  ];

  constructor(
    private readonly patientService: PatientService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadEmergencyDetails();
  }

  get patientName(): string {
    return this.patient?.fullName || this.patient?.name || 'Patient';
  }

  get patientId(): string {
    return this.patient?.patientId || this.patient?.userId || '-';
  }

  get patientBadgeText(): string {
    return `ID: ${this.patientId}`;
  }

  get avatarText(): string {
    return this.patientName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'PT';
  }

  get profileImage(): string {
    return this.patient?.profileImage || this.patient?.photoUrl || '';
  }

  get emergencyContact(): string {
    return this.patient?.emergencyContact || this.patient?.contactNumber || '-';
  }

  get ageGender(): string {
    const age = this.patient?.age ? `${this.patient.age} years` : '-';
    const gender = this.patient?.gender || '-';

    if (age === '-' && gender === '-') {
      return '-';
    }

    return `${age} • ${gender}`;
  }

  get addressLine(): string {
    const parts = [
      this.patient?.address,
      this.patient?.district,
      this.patient?.state,
      this.patient?.pincode
    ]
      .map(value => String(value || '').trim())
      .filter(Boolean);

    return parts.length ? parts.join(', ') : '-';
  }

  get currentMedicalProfile(): PatientMedicalProfileRecord | null {
    return this.medicalRecord?.currentProfile || null;
  }

  get bloodGroup(): string {
    return this.patient?.emergencyRecord?.bloodGroup || '-';
  }

  get allergies(): string[] {
    return this.safeList(this.patient?.emergencyRecord?.allergies);
  }

  get chronicConditions(): string[] {
    return this.safeList(this.patient?.emergencyRecord?.chronicConditions);
  }

  get currentMedications(): string[] {
    return this.safeList(this.patient?.emergencyRecord?.currentMedications);
  }

  get lastUpdatedText(): string {
    const profile = this.currentMedicalProfile;
    const date = profile?.lastUpdatedAt || profile?.updatedAt || profile?.createdAt || '';

    return this.formatDateTime(date);
  }

  get emergencyStatus(): EmergencyStatus {
    const filled = [
      this.patientId !== '-',
      this.patientName !== 'Patient',
      this.emergencyContact !== '-',
      this.bloodGroup !== '-',
      this.allergies.length > 0,
      this.chronicConditions.length > 0,
      this.currentMedications.length > 0
    ].filter(Boolean).length;

    if (filled >= 6) {
      return 'complete';
    }

    if (filled >= 3) {
      return 'partial';
    }

    return 'empty';
  }

  get emergencyStatusLabel(): string {
    if (this.emergencyStatus === 'complete') {
      return 'Emergency profile ready';
    }

    if (this.emergencyStatus === 'partial') {
      return 'Emergency profile partially ready';
    }

    return 'Emergency profile needs update';
  }

  get emergencyStatusHint(): string {
    if (this.emergencyStatus === 'complete') {
      return 'Your general details and latest medical data are available for emergency viewing.';
    }

    if (this.emergencyStatus === 'partial') {
      return 'Some details are available. Complete your profile and ask your doctor to update medical data if needed.';
    }

    return 'Update your patient profile and medical records to make emergency information useful.';
  }

  get emergencyMetrics(): EmergencyMetric[] {
    const profile = this.currentMedicalProfile;

    return [
      {
        label: 'Blood Group',
        value: this.bloodGroup,
        note: 'Latest medical record'
      },
      {
        label: 'Emergency Contact',
        value: this.emergencyContact,
        note: 'Editable in Patient Profile'
      },
      {
        label: 'Last Medical Update',
        value: this.lastUpdatedText,
        note: profile?.lastUpdatedByDoctorId ? `Updated by ${profile.lastUpdatedByDoctorId}` : 'Updated by doctor'
      },
      {
        label: 'Known Risks',
        value: String(this.allergies.length + this.chronicConditions.length),
        note: 'Allergies + chronic conditions'
      }
    ];
  }

  get vitals(): EmergencyMetric[] {
    const profile = this.currentMedicalProfile;

    return [
      {
        label: 'Height',
        value: this.formatNumber(profile?.heightCm, 'cm'),
        note: 'Latest record'
      },
      {
        label: 'Weight',
        value: this.formatNumber(profile?.weightKg, 'kg'),
        note: 'Latest record'
      },
      {
        label: 'BMI',
        value: this.formatNumber(profile?.bmi, ''),
        note: 'Calculated from medical record'
      },
      {
        label: 'Blood Pressure',
        value: profile?.bloodPressure || '-',
        note: 'Latest clinical value'
      },
      {
        label: 'Temperature',
        value: profile?.bodyTemperature || '-',
        note: 'Latest clinical value'
      }
    ];
  }

  get clinicalSummary(): EmergencyMetric[] {
    const profile = this.currentMedicalProfile;

    return [
      {
        label: 'Latest Disease / Concern',
        value: profile?.lastDisease || profile?.disease || '-',
        note: 'Latest record'
      },
      {
        label: 'Findings',
        value: profile?.lastFindings || profile?.findings || '-',
        note: 'Clinical notes'
      },
      {
        label: 'Prescription',
        value: profile?.lastPrescription || profile?.prescription || '-',
        note: 'Latest prescribed care'
      }
    ];
  }

  loadEmergencyDetails(): void {
    this.isLoading = true;
    this.hasLoadError = false;

    forkJoin({
      patient: this.patientService.getMyProfile(),
      medicalRecord: this.patientService.getMyMedicalRecord()
    }).subscribe({
      next: ({ patient, medicalRecord }) => {
        this.medicalRecord = medicalRecord;
        this.patient = this.mergeEmergencyDetails(patient, medicalRecord);
        this.isLoading = false;
      },
      error: error => {
        console.error('Unable to load patient emergency details:', error);
        this.hasLoadError = true;
        this.isLoading = false;
      }
    });
  }

  handleAction(action: EmergencyAction): void {
    if (action.action === 'print') {
      this.printEmergencyRecord();
      return;
    }

    if (action.action === 'download') {
      this.downloadEmergencyRecord();
    }
  }

  printEmergencyRecord(): void {
    window.setTimeout(() => window.print(), 100);
  }

  downloadEmergencyRecord(): void {
    if (!this.patient) {
      return;
    }

    const content = [
      'MedVerse Emergency Details',
      '==========================',
      `Patient Name: ${this.patientName}`,
      `Patient ID: ${this.patientId}`,
      `Age / Gender: ${this.ageGender}`,
      `Emergency Contact: ${this.emergencyContact}`,
      `Address: ${this.addressLine}`,
      '',
      'Critical Medical Information',
      '----------------------------',
      `Blood Group: ${this.bloodGroup}`,
      `Allergies: ${this.formatArray(this.allergies)}`,
      `Chronic Conditions: ${this.formatArray(this.chronicConditions)}`,
      `Current Medications: ${this.formatArray(this.currentMedications)}`,
      `Last Medical Update: ${this.lastUpdatedText}`,
      '',
      'Clinical Summary',
      '----------------',
      ...this.clinicalSummary.map(item => `${item.label}: ${item.value}`),
      '',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${this.patientId || 'patient'}-emergency-details.txt`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  confirmLogout(): void {
    this.showLogoutModal = false;
    this.authService.logout();
  }

  trackByLabel(_: number, item: EmergencyMetric): string {
    return item.label;
  }

  trackByValue(_: number, item: string): string {
    return item;
  }

  trackByAction(_: number, action: EmergencyAction): string {
    return action.title;
  }

  private mergeEmergencyDetails(patient: Patient, medicalRecord: PatientMedicalRecord): Patient {
    const current = medicalRecord.currentProfile;
    const latestVisit = [...(medicalRecord.previousRecords || [])]
      .sort((a, b) => this.toDateTime(b.dateOfUpdate || b.updatedAt || b.createdAt) - this.toDateTime(a.dateOfUpdate || a.updatedAt || a.createdAt))[0];

    const bloodGroup = this.firstAvailable(
      current?.bloodGroup,
      latestVisit?.bloodGroup,
      patient.emergencyRecord?.bloodGroup
    );

    return {
      ...patient,
      patientId: patient.patientId || current?.patientId || latestVisit?.patientId || '',
      userId: patient.userId || patient.patientId || current?.patientId || latestVisit?.patientId || '',
      contactNumber: patient.contactNumber || patient.emergencyContact || '',
      emergencyContact: patient.emergencyContact || patient.contactNumber || '',
      emergencyRecord: {
        bloodGroup,
        allergies: this.firstList(current?.allergies, latestVisit?.allergies, patient.emergencyRecord?.allergies),
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

  private firstAvailable(...values: Array<string | number | null | undefined>): string {
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

  private safeList(value: string[] | undefined): string[] {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  private toList(value: string | string[] | null | undefined): string[] {
    if (Array.isArray(value)) {
      return value.map(item => String(item).trim()).filter(Boolean);
    }

    const text = String(value || '').trim();

    if (!text) {
      return [];
    }

    return text
      .split(/[,\n]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  private formatArray(values: string[]): string {
    return values.length ? values.join(', ') : 'Not recorded';
  }

  private formatNumber(value: number | null | undefined, suffix: string): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '-';
    }

    return suffix ? `${value} ${suffix}` : String(value);
  }

  private formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private toDateTime(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
}