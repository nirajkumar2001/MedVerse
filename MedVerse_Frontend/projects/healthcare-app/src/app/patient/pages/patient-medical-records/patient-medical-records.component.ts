import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Patient } from '../../../core/models/patient.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { MedicalProfileUpdateService } from '../../../core/services/medical-profile-update.service';
import { RealtimeNotificationService } from '../../../core/services/realtime-notification.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-patient-medical-records',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutSidebarComponent,
    HealthcareFooterComponent,
    LogoutConfirmModalComponent,
    ToastMessageComponent,
    PageHeaderComponent
  ],
  templateUrl: './patient-medical-records.component.html',
  styleUrls: ['./patient-medical-records.component.css']
})
export class PatientMedicalRecordsComponent implements OnInit, OnDestroy {
  private readonly photoStorageKey = 'medverse-patient-profile-photo';

  patient: Patient | null = null;

  record: any = {
    patientId: '',
    currentProfile: {},
    previousRecords: []
  };

  selectedVisit: any | null = null;
  exported = false;
  searchTerm = '';
  sortOrder: 'latest' | 'oldest' = 'latest';
  selectedVisitDate = '';

  isLoading = true;

  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'info';

  patientPhoto = localStorage.getItem(this.photoStorageKey) || '';

  menuItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/patient/home', icon: 'D', exact: true },
    { label: 'My Profile', route: '/patient/profile', icon: 'P', exact: true },
    { label: 'Emergency Details', route: '/patient/emergency-details', icon: 'E', exact: true },
    { label: 'My Medical Records', route: '/patient/medical-records', icon: 'M', exact: true },
    { label: 'Access Requests', route: '/patient/notifications', icon: 'N', badgeCount: 0, exact: true },
    { label: 'Help & Support', route: '/patient/support', icon: 'H', exact: true }
  ];

  private readonly subscriptions = new Subscription();

  private readonly photoUpdateHandler = (): void => {
    this.refreshPatientPhoto();
  };

  constructor(
    private readonly patientService: PatientService,
    private readonly medicalProfileUpdateService: MedicalProfileUpdateService,
    private readonly realtime: RealtimeNotificationService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.realtime.connect();

    this.subscriptions.add(
      this.patientService.getMyProfile().subscribe({
        next: (response: any) => {
          this.patient = response?.data ?? response ?? null;
          this.refreshPatientPhoto();
        },
        error: error => {
          console.error('Unable to load patient profile:', error);
          this.patient = null;
        }
      })
    );

    this.subscriptions.add(
      this.realtime.medicalProfileUpdate$.subscribe(update => {
        if (update) {
          this.loadMedicalRecord(false);
        }
      })
    );

    this.refreshPatientPhoto();
    window.addEventListener('medverse-profile-photo-updated', this.photoUpdateHandler);

    this.loadMedicalRecord(true);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    window.removeEventListener('medverse-profile-photo-updated', this.photoUpdateHandler);
  }

  get patientAny(): any {
    return this.patient as any;
  }

  get currentProfile(): any {
    return this.record?.currentProfile ?? {};
  }

  get patientPhotoUrl(): string {
    return (
      this.patientPhoto ||
      this.patientAny?.photoUrl ||
      this.patientAny?.profileImage ||
      this.patientAny?.profilePhotoUrl ||
      this.patientAny?.imageUrl ||
      ''
    );
  }

  get patientName(): string {
    return (
      this.patientAny?.fullName ||
      this.patientAny?.name ||
      this.patientAny?.patientName ||
      'Patient'
    );
  }

  get patientInitial(): string {
    return this.patientName.charAt(0).toUpperCase() || 'P';
  }

  get patientBadgeText(): string {
    return 'ID: ' + (
      this.patientAny?.patientId ||
      this.patientAny?.userId ||
      this.record?.patientId ||
      this.currentProfile?.patientId ||
      'Patient'
    );
  }

  get patientAgeGender(): string {
    const age = this.patientAny?.age || 'N/A';
    const gender = this.patientAny?.gender || 'N/A';

    return `${age} Years • ${gender}`;
  }

  get latestHeightCm(): string {
    const value = this.currentProfile?.heightCm;
    return value ? `${value} cm` : 'Not recorded';
  }

  get latestWeightKg(): string {
    const value = this.currentProfile?.weightKg;
    return value ? `${value} kg` : 'Not recorded';
  }

  get latestBmi(): string {
    const profileBmi = this.currentProfile?.bmi;

    if (profileBmi) {
      return String(profileBmi);
    }

    const height = this.currentProfile?.heightCm;
    const weight = this.currentProfile?.weightKg;

    if (!height || !weight || height <= 0 || weight <= 0) {
      return 'Not recorded';
    }

    const heightMeter = height / 100;
    const bmi = weight / (heightMeter * heightMeter);

    return (Math.round(bmi * 10) / 10).toString();
  }

  get filteredVisits(): any[] {
  const visits: any[] = Array.isArray(this.record?.previousRecords)
    ? this.record.previousRecords
    : [];

  const query = this.searchTerm.trim().toLowerCase();
  const selectedDate = this.selectedVisitDate;

  let result: any[] = visits.filter((visit: any) => {
    const searchableText = [
      visit?.doctorName,
      visit?.doctorId,
      visit?.disease,
      visit?.findings,
      visit?.medicalReports,
      visit?.prescription,
      visit?.bloodGroup,
      visit?.allergies,
      visit?.chronicConditions,
      visit?.currentMedication,
      visit?.bloodPressure,
      visit?.bodyTemperature,
      visit?.dateOfUpdate,
      visit?.createdAt
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = !query || searchableText.includes(query);
    const matchesDate = !selectedDate || this.visitDateInputValue(visit) === selectedDate;

    return matchesSearch && matchesDate;
  });

  result = result.sort((first: any, second: any) => {
    const firstTime = this.visitTime(first);
    const secondTime = this.visitTime(second);

    return this.sortOrder === 'latest'
      ? secondTime - firstTime
      : firstTime - secondTime;
  });

  return result;
}

clearVisitFilters(): void {
  this.searchTerm = '';
  this.selectedVisitDate = '';
  this.visitStartDate = '';
  this.visitEndDate = '';
  this.visitSearchMode = '';
  this.sortOrder = 'latest';
}
exportFullMedicalProfile(): void {
  this.openPrintableDocument(
    'MedVerse Full Medical Profile',
    this.buildFullProfileHtml(),
    `${this.safeFileName(this.patientName)}-full-medical-profile`
  );
}

exportEmergencyDetails(): void {
  this.openPrintableDocument(
    'MedVerse Emergency Medical Details',
    this.buildEmergencyDetailsHtml(),
    `${this.safeFileName(this.patientName)}-emergency-medical-details`
  );
}

exportSelectedVisit(): void {
  if (!this.selectedVisit) {
    this.notify('Please select a visit first.', 'info');
    return;
  }

  this.exportVisit(this.selectedVisit);
}

exportVisit(visit: any): void {
  this.selectedVisit = visit;
  this.openPrintableDocument(
    'MedVerse Visit Record',
    this.buildVisitHtml(visit),
    `${this.safeFileName(this.patientName)}-visit-record`
  );
}
visitSearchMode: '' | 'text' | 'singleDate' | 'dateRange' = '';
visitStartDate = '';
visitEndDate = '';

private visitDateInputValue(visit: any): string {
  const value = visit?.dateOfUpdate ?? visit?.createdAt ?? visit?.updatedAt;

  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

  loadMedicalRecord(showLoader: boolean): void {
    if (showLoader) {
      this.isLoading = true;
    }

    this.subscriptions.add(
      this.medicalProfileUpdateService.getMyMedicalRecord().subscribe({
        next: response => {
          this.record = response?.data ?? response ?? {
            patientId: '',
            currentProfile: {},
            previousRecords: []
          };

          const visits = Array.isArray(this.record?.previousRecords)
            ? this.record.previousRecords
            : [];

          if (!this.selectedVisit && visits.length > 0) {
            this.selectedVisit = [...visits].sort((first, second) => {
              return this.visitTime(second) - this.visitTime(first);
            })[0];
          }

          if (this.selectedVisit) {
            const matchingVisit = visits.find((visit: any) => {
              return this.visitKey(visit) === this.visitKey(this.selectedVisit);
            });

            if (matchingVisit) {
              this.selectedVisit = matchingVisit;
            }
          }

          this.isLoading = false;
        },
        error: error => {
          console.error('Unable to load patient medical record:', error);

          this.record = {
            patientId: '',
            currentProfile: {},
            previousRecords: []
          };

          this.selectedVisit = null;
          this.isLoading = false;

          this.notify('Unable to load medical records. Please try again.', 'danger');
        }
      })
    );
  }

private buildFullProfileHtml(): string {
  const visitRows = this.filteredVisits.length
    ? this.filteredVisits.map(visit => this.visitPrintCard(visit)).join('')
    : '<p class="empty">No visit records available.</p>';

  return `
    ${this.printHeader('Full Medical Profile', 'Patient medical record export')}
    ${this.patientInfoSection()}
    ${this.emergencyDetailsSection()}
    ${this.currentClinicalSection()}
    <section class="section">
      <h2>Visit History</h2>
      ${visitRows}
    </section>
  `;
}

private buildEmergencyDetailsHtml(): string {
  return `
    ${this.printHeader('Emergency Medical Details', 'Emergency lookup-ready information')}
    ${this.patientInfoSection()}
    ${this.emergencyDetailsSection()}
  `;
}

private buildVisitHtml(visit: any): string {
  return `
    ${this.printHeader('Visit Record', this.formatDate(visit?.dateOfUpdate || visit?.createdAt || visit?.updatedAt))}
    ${this.patientInfoSection()}
    ${this.visitPrintCard(visit)}
  `;
}

private printHeader(title: string, subtitle: string): string {
  return `
    <header class="print-header">
      <div>
        <span class="brand">MedVerse Healthcare</span>
        <h1>${this.escapeHtml(title)}</h1>
        <p>${this.escapeHtml(subtitle)}</p>
      </div>
      <div class="print-meta">
        <span>Generated</span>
        <strong>${this.escapeHtml(this.formatDate(new Date().toISOString()))}</strong>
      </div>
    </header>
  `;
}

private patientInfoSection(): string {
  const patientId = this.patientAny?.patientId || this.patientAny?.userId || this.record?.patientId || 'Not recorded';
  const address = [
    this.patientAny?.address,
    this.patientAny?.district,
    this.patientAny?.state,
    this.patientAny?.pincode
  ].filter(Boolean).join(', ') || 'Not recorded';

  return `
    <section class="section">
      <h2>Patient Information</h2>
      <div class="grid two">
        ${this.printRow('Full Name', this.patientName)}
        ${this.printRow('Patient ID', patientId)}
        ${this.printRow('Age / Gender', this.patientAgeGender)}
        ${this.printRow('Emergency Contact', this.patientAny?.emergencyContact || this.patientAny?.contactNumber || 'Not recorded')}
        ${this.printRow('Address', address, true)}
      </div>
    </section>
  `;
}

private emergencyDetailsSection(): string {
  const bloodGroup = this.currentProfile?.bloodGroup || this.patientAny?.emergencyRecord?.bloodGroup || 'Not recorded';

  return `
    <section class="section emergency-section-print">
      <h2>Emergency Medical Details</h2>
      <div class="blood-print">
        <span>Blood Group</span>
        <strong>${this.escapeHtml(bloodGroup)}</strong>
      </div>
      <div class="grid three stack-print-grid">
        ${this.printStackGroup('Allergies', this.emergencyStack('allergies'))}
        ${this.printStackGroup('Chronic Conditions', this.emergencyStack('chronicConditions'))}
        ${this.printStackGroup('Current Medication', this.medicationStack())}
      </div>
      <div class="grid three compact">
        ${this.printRow('Height', this.latestHeightCm)}
        ${this.printRow('Weight', this.latestWeightKg)}
        ${this.printRow('BMI', this.latestBmi)}
      </div>
    </section>
  `;
}

private currentClinicalSection(): string {
  return `
    <section class="section">
      <h2>Latest Clinical Summary</h2>
      <div class="grid two">
        ${this.printRow('Health Concern', this.currentProfile?.disease || this.currentProfile?.lastDisease || 'Not recorded')}
        ${this.printRow('Doctor Findings', this.currentProfile?.findings || this.currentProfile?.lastFindings || 'Not recorded')}
        ${this.printRow('Prescription', this.currentProfile?.prescription || this.currentProfile?.lastPrescription || 'Not recorded', true)}
        ${this.printRow('Medical Reports', this.currentProfile?.medicalReports || 'Not recorded', true)}
      </div>
    </section>
  `;
}

private visitPrintCard(visit: any): string {
  return `
    <article class="visit-card">
      <div class="visit-head">
        <div>
          <span>Visit Date</span>
          <strong>${this.escapeHtml(this.formatDate(visit?.dateOfUpdate || visit?.createdAt || visit?.updatedAt))}</strong>
        </div>
        <div>
          <span>Updated By</span>
          <strong>${this.escapeHtml(this.visitDoctorLabel(visit))}</strong>
        </div>
      </div>
      <div class="grid two">
        ${this.printRow('Health Concern', visit?.disease || 'Not recorded')}
        ${this.printRow('Doctor Findings', visit?.findings || 'Not recorded')}
        ${this.printRow('Prescription', visit?.prescription || 'Not recorded', true)}
        ${this.printRow('Medical Reports', visit?.medicalReports || 'Not recorded', true)}
      </div>
      <div class="grid three stack-print-grid">
        ${this.printStackGroup('Allergies', this.toStackList(visit?.allergies))}
        ${this.printStackGroup('Chronic Conditions', this.toStackList(visit?.chronicConditions))}
        ${this.printStackGroup('Current Medication', this.toStackList(visit?.currentMedication))}
      </div>
      <div class="grid five compact">
        ${this.printRow('Blood Group', visit?.bloodGroup || 'Not recorded')}
        ${this.printRow('Blood Pressure', visit?.bloodPressure || 'Not recorded')}
        ${this.printRow('Temperature', visit?.bodyTemperature || 'Not recorded')}
        ${this.printRow('Height', visit?.heightCm ? `${visit.heightCm} cm` : 'Not recorded')}
        ${this.printRow('Weight', visit?.weightKg ? `${visit.weightKg} kg` : 'Not recorded')}
      </div>
    </article>
  `;
}

private printRow(label: string, value: unknown, wide = false): string {
  return `
    <div class="print-row ${wide ? 'wide' : ''}">
      <span>${this.escapeHtml(label)}</span>
      <strong>${this.escapeHtml(this.printValue(value))}</strong>
    </div>
  `;
}

private printStackGroup(label: string, values: string[]): string {
  const content = values.length
    ? values.map(value => `<b>${this.escapeHtml(value)}</b>`).join('')
    : '<em>Not recorded</em>';

  return `
    <div class="print-stack-group">
      <span>${this.escapeHtml(label)}</span>
      <div>${content}</div>
    </div>
  `;
}

private openPrintableDocument(title: string, body: string, fileName: string): void {
  this.exported = true;

  const printableWindow = window.open('', '_blank', 'width=1100,height=800');

  if (!printableWindow) {
    this.notify('Please allow pop-ups to export the PDF.', 'danger');
    this.exported = false;
    return;
  }

  printableWindow.document.open();
  printableWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${this.escapeHtml(title)}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #101828; font-family: Inter, Arial, sans-serif; background: #ffffff; }
          .print-wrapper { max-width: 980px; margin: 0 auto; }
          .print-header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; padding: 22px; border-radius: 22px; background: linear-gradient(135deg, #f4f2ff, #ffffff); border: 1px solid #ded9ff; margin-bottom: 18px; }
          .brand { display: inline-block; margin-bottom: 8px; padding: 7px 10px; border-radius: 999px; color: #635bff; background: rgba(99,91,255,.10); font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .07em; }
          h1 { margin: 0; font-size: 30px; line-height: 1.1; letter-spacing: -.04em; }
          .print-header p { margin: 8px 0 0; color: #667085; font-size: 13px; font-weight: 700; }
          .print-meta { min-width: 180px; text-align: right; }
          .print-meta span, .section h2, .print-row span, .print-stack-group > span, .visit-head span { color: #667085; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .07em; }
          .print-meta strong { display: block; margin-top: 6px; color: #101828; font-size: 13px; }
          .section, .visit-card { padding: 18px; border: 1px solid #e2e7fb; border-radius: 18px; margin-bottom: 14px; break-inside: avoid; background: #fff; }
          .section h2 { margin: 0 0 14px; color: #635bff; }
          .grid { display: grid; gap: 10px; }
          .grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .grid.five { grid-template-columns: repeat(5, minmax(0, 1fr)); }
          .grid.compact { margin-top: 12px; }
          .print-row, .print-stack-group { padding: 12px; border: 1px solid #edf0fb; border-radius: 14px; background: #fbfcff; }
          .print-row.wide { grid-column: 1 / -1; }
          .print-row strong { display: block; margin-top: 7px; color: #101828; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
          .blood-print { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-radius: 16px; border: 1px solid #ded9ff; background: #f4f2ff; margin-bottom: 12px; }
          .blood-print span { color: #635bff; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .07em; }
          .blood-print strong { color: #635bff; font-size: 28px; font-weight: 950; }
          .print-stack-group div { display: grid; gap: 7px; margin-top: 9px; }
          .print-stack-group b { display: block; padding: 8px 10px; border-radius: 10px; color: #24324a; background: rgba(99,91,255,.08); border: 1px solid rgba(99,91,255,.14); font-size: 12px; }
          .print-stack-group em { color: #667085; font-style: normal; font-size: 12px; }
          .visit-head { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
          .visit-head div { padding: 12px; border-radius: 14px; background: #f4f2ff; border: 1px solid #ded9ff; }
          .visit-head strong { display: block; margin-top: 6px; font-size: 13px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <main class="print-wrapper">
          ${body}
        </main>
        <script>
          document.title = ${JSON.stringify(fileName)};
          setTimeout(function () { window.print(); }, 250);
        </script>
      </body>
    </html>
  `);
  printableWindow.document.close();

  setTimeout(() => {
    this.exported = false;
  }, 1800);
}

private printValue(value: unknown): string {
  const text = String(value ?? '').trim();
  return text || 'Not recorded';
}

private safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'medverse-record';
}

private escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

  viewVisitDetails(visit: any): void {
    this.selectedVisit = visit;
  }

  isSelectedVisit(visit: any): boolean {
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

  hasValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  listText(value: unknown): string {
    if (!this.hasValue(value)) {
      return 'N/A';
    }

    return String(value);
  }


  toStackList(value: unknown): string[] {
    if (value === null || value === undefined) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .flatMap(item => this.toStackList(item))
        .map(item => item.trim())
        .filter(Boolean);
    }

    const raw = String(value).trim();

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed.flatMap(item => this.toStackList(item));
      }
    } catch {
      // Normal text value.
    }

    return raw
      .split(/[,;|\n]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  emergencyStack(fieldName: 'allergies' | 'chronicConditions' | 'currentMedication' | 'currentMedications'): string[] {
    const currentValue = this.currentProfile?.[fieldName];

    if (this.toStackList(currentValue).length > 0) {
      return this.toStackList(currentValue);
    }

    const fallbackValue = this.patientAny?.emergencyRecord?.[fieldName];

    return this.toStackList(fallbackValue);
  }

  medicationStack(): string[] {
    const current = this.emergencyStack('currentMedication');

    if (current.length > 0) {
      return current;
    }

    return this.emergencyStack('currentMedications');
  }

  visitDoctorLabel(visit: any): string {
    return visit?.doctorName || visit?.doctorId || 'Doctor';
  }

  hasGeneralProfile(visit: any): boolean {
    return Boolean(
      visit?.heightCm ||
      visit?.weightKg ||
      visit?.bmi ||
      visit?.bloodPressure ||
      visit?.bodyTemperature
    );
  }

  hasEmergencySnapshot(visit: any): boolean {
    return Boolean(
      visit?.bloodGroup ||
      visit?.allergies ||
      visit?.chronicConditions ||
      visit?.currentMedication
    );
  }

  hasDoctorVisitNotes(visit: any): boolean {
    return Boolean(
      visit?.disease ||
      visit?.medicalReports ||
      visit?.findings ||
      visit?.prescription
    );
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

  private visitKey(visit: any): string {
    return String(
      visit?.updateId ??
        visit?.sessionId ??
        visit?.dateOfUpdate ??
        visit?.createdAt ??
        visit?.doctorId ??
        ''
    );
  }

  private visitTime(visit: any): number {
    const value = visit?.dateOfUpdate ?? visit?.createdAt ?? visit?.updatedAt;

    if (!value) {
      return 0;
    }

    const time = new Date(value).getTime();

    return Number.isNaN(time) ? 0 : time;
  }

  private refreshPatientPhoto(): void {
    this.patientPhoto = localStorage.getItem(this.photoStorageKey) || '';
  }

  private notify(message: string, type: 'success' | 'danger' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 2800);
  }
}