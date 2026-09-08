import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EMPTY, Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

import { Doctor } from '../../../core/models/doctor.model';
import { AppNotification } from '../../../core/models/app-notification.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';
import {
  EmergencyLookupSearchResponse,
  EmergencyLookupService,
  EmergencyPatientDetails,
  EmergencyPatientSummary
} from '../../../core/services/emergency-lookup.service';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { NotificationService } from '../../../core/services/notification.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';

interface MatchedField {
  label: string;
  value: string;
}

interface EmergencyPatientMatch extends EmergencyPatientSummary {
  matchedFields: MatchedField[];
}

@Component({
  selector: 'app-emergency-lookup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    LogoutConfirmModalComponent,
    ToastMessageComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './emergency-lookup.component.html',
  styleUrls: ['./emergency-lookup.component.css']
})
export class EmergencyLookupComponent implements OnInit, OnDestroy {
  @ViewChild('emergencyRecordSection') emergencyRecordSection?: ElementRef<HTMLElement>;

  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  query = '';
  isSearching = false;
  hasSearched = false;
  resultMessage = '';
  searchError = '';

  matches: EmergencyPatientMatch[] = [];
  selectedPatient: EmergencyPatientDetails | null = null;

  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'info';

  private readonly searchInput$ = new Subject<string>();
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly doctorService: DoctorService,
    private readonly notificationService: NotificationService,
    private readonly emergencyLookupService: EmergencyLookupService,
    private readonly authService: AuthService
  ) {
    this.doctor = this.doctorService.getCurrentDoctor();
    this.updateSidebarItems();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.doctorService.getDoctor().subscribe(doctor => {
        this.doctor = doctor;
      })
    );

    this.subscriptions.add(
      this.notificationService.getNotifications().subscribe(notifications => {
        this.notifications = notifications;
        this.updateSidebarItems();
      })
    );

    this.subscriptions.add(
      this.searchInput$.pipe(
        map(value => value.trim()),
        debounceTime(240),
        distinctUntilChanged(),
        tap(query => this.prepareSearchState(query)),
        switchMap(query => {
          if (!query) {
            return EMPTY;
          }

          return this.emergencyLookupService.search(query).pipe(
            catchError(error => {
              console.error('Emergency lookup failed:', error);
              this.isSearching = false;
              this.matches = [];
              this.selectedPatient = null;
              this.resultMessage = '';
              this.searchError = error?.error?.message || 'No matching emergency profile found.';
              return of(null);
            })
          );
        })
      ).subscribe(response => this.handleSearchResponse(response))
    );

    this.notificationService.loadDoctorNotifications(false).subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter(item => item.unread).length;
  }

  get cleanQuery(): string {
    return this.query.trim();
  }

  get selectedPatientPhotoUrl(): string {
    return this.selectedPatient?.photoUrl || '';
  }

  get allergiesList(): string[] {
    return this.toList(this.selectedPatient?.allergies);
  }

  get chronicConditionsList(): string[] {
    return this.toList(this.selectedPatient?.chronicConditions);
  }

  get currentMedicationList(): string[] {
    return this.toList(
      this.selectedPatient?.currentMedication ||
      this.selectedPatient?.currentMedications
    );
  }

  get vitalsItems(): { label: string; value: string }[] {
    return [
      { label: 'Height', value: this.formatHeight(this.selectedPatient) },
      { label: 'Weight', value: this.formatWeight(this.selectedPatient) },
      { label: 'BMI', value: this.formatBmi(this.selectedPatient) }
    ];
  }

  updateSidebarItems(): void {
    const active = this.notifications.filter(item =>
      String(item.accessStatus || '').toUpperCase() === 'APPROVED' && !item.accessEndedAt
    ).length;

    const pending = this.notifications.filter(item =>
      String(item.accessStatus || '').toUpperCase() === 'PENDING'
    ).length;

    this.sidebarItems = [
      { label: 'Dashboard', icon: 'D', route: '/doctor/home', exact: true },
      { label: 'Emergency Lookup', icon: 'E', route: '/doctor/emergency-lookup', exact: true },
      { label: 'Patient Care', icon: 'C', route: '/doctor/patient-care', badgeCount: active + pending, exact: true },
      { label: 'Doctor Profile', icon: 'P', route: '/doctor/profile', exact: true },
      { label: 'Notifications', icon: 'N', route: '/doctor/notifications', badgeCount: this.unreadCount, exact: true },
      { label: 'Help & Support', icon: 'H', route: '/doctor/support', exact: true }
    ];
  }

  onSearchInput(): void {
    this.searchInput$.next(this.query);
  }

  searchNow(): void {
    this.searchInput$.next(this.query);
  }

  clearSearch(): void {
    this.query = '';
    this.isSearching = false;
    this.hasSearched = false;
    this.resultMessage = '';
    this.searchError = '';
    this.matches = [];
    this.selectedPatient = null;
  }

  selectPatient(patient: EmergencyPatientSummary): void {
    if (!patient.patientId) {
      this.showMessage('Patient ID missing in selected result.', 'danger');
      return;
    }

    this.isSearching = true;
    this.searchError = '';

    this.emergencyLookupService.getPatientDetails(patient.patientId).subscribe({
      next: response => {
        this.isSearching = false;
        this.selectedPatient = this.normalizeDetails(response);
        this.resultMessage = `Emergency record opened for ${this.patientName(this.selectedPatient)}.`;
        this.scrollToEmergencyRecord();
      },
      error: error => {
        console.error('Unable to load patient emergency details:', error);
        this.isSearching = false;
        this.showMessage(error?.error?.message || 'Unable to load patient details.', 'danger');
      }
    });
  }

  patientName(patient: EmergencyPatientSummary | EmergencyPatientDetails | null): string {
    return patient?.fullName || 'Patient';
  }

  patientInitial(patient: EmergencyPatientSummary | EmergencyPatientDetails | null): string {
    return String(this.patientName(patient))
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'PT';
  }

  formatAddress(patient: EmergencyPatientSummary | EmergencyPatientDetails | null): string {
    if (!patient) {
      return 'Not recorded';
    }

    const parts = [patient.address, patient.district, patient.state, patient.pincode]
      .map(value => String(value || '').trim())
      .filter(Boolean);

    return parts.length ? parts.join(', ') : 'Not recorded';
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined || String(value).trim() === '') {
      return 'Not recorded';
    }

    return String(value);
  }

  formatDate(value: unknown): string {
    if (!value) {
      return 'Not recorded';
    }

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  highlightMatchParts(value: unknown): { text: string; match: boolean }[] {
    const text = this.displayValue(value);
    const query = this.cleanQuery;

    if (!query || text === 'Not recorded') {
      return [{ text, match: false }];
    }

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const parts: { text: string; match: boolean }[] = [];

    let cursor = 0;
    let index = lowerText.indexOf(lowerQuery, cursor);

    while (index !== -1) {
      if (index > cursor) {
        parts.push({ text: text.slice(cursor, index), match: false });
      }

      parts.push({ text: text.slice(index, index + query.length), match: true });
      cursor = index + query.length;
      index = lowerText.indexOf(lowerQuery, cursor);
    }

    if (cursor < text.length) {
      parts.push({ text: text.slice(cursor), match: false });
    }

    return parts.length ? parts : [{ text, match: false }];
  }

  exportSelectedRecordAsPdf(): void {
    if (!this.selectedPatient) {
      this.showMessage('Open one emergency record before exporting.', 'danger');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=960,height=720');

    if (!printWindow) {
      this.showMessage('Unable to open PDF export window. Please allow pop-ups for this site.', 'danger');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(this.buildEmergencyRecordPrintHtml(this.selectedPatient));
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 350);
  }

  trackByPatient(_: number, patient: EmergencyPatientSummary): string {
    return patient.patientId;
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

  private prepareSearchState(query: string): void {
    this.searchError = '';

    if (!query) {
      this.isSearching = false;
      this.hasSearched = false;
      this.matches = [];
      this.selectedPatient = null;
      this.resultMessage = '';
      return;
    }

    this.hasSearched = true;
    this.isSearching = true;
    this.resultMessage = '';
    this.matches = [];
    this.selectedPatient = null;
  }

  private handleSearchResponse(response: EmergencyLookupSearchResponse | null): void {
    if (!response) {
      return;
    }

    const data: any = response ?? {};
    const single = data.patientDetails ?? data.patient ?? null;
    const list = data.patients ?? data.matches ?? [];
    const resultType = String(data.resultType ?? data.matchType ?? '').toUpperCase();

    this.isSearching = false;
    this.resultMessage = data.message || this.makeResultMessage(resultType, list?.length || 0);

    if (single) {
      this.selectedPatient = this.normalizeDetails(single);
      this.matches = [];
      this.scrollToEmergencyRecord();
      return;
    }

    this.selectedPatient = null;
    this.matches = Array.isArray(list)
      ? list.map((item: any) => this.toMatch(this.normalizeSummary(item)))
      : [];

    const exactMatch = this.findExactPatientMatch(this.matches);

    if (exactMatch) {
      this.selectPatient(exactMatch);
      return;
    }

    if (!this.matches.length) {
      this.searchError = this.resultMessage || 'No matching patient found.';
    }
  }

  private normalizeSummary(source: any): EmergencyPatientSummary {
    return {
      patientId: source?.patientId ?? source?.userId ?? source?.id ?? '',
      fullName: source?.fullName ?? source?.name ?? source?.patientName ?? 'Patient',
      age: source?.age ?? undefined,
      gender: source?.gender ?? '',
      bloodGroup: source?.bloodGroup ?? '',
      emergencyContact: source?.emergencyContact ?? source?.contactNumber ?? '',
      contactNumber: source?.contactNumber ?? source?.emergencyContact ?? '',
      address: source?.address ?? '',
      district: source?.district ?? '',
      state: source?.state ?? '',
      pincode: source?.pincode ?? '',
      photoUrl: source?.photoUrl ?? source?.profileImage ?? source?.profilePicture ?? ''
    };
  }

  private normalizeDetails(source: any): EmergencyPatientDetails {
    const summary = this.normalizeSummary(source);

    return {
      ...summary,
      allergies: source?.allergies ?? '',
      chronicConditions: source?.chronicConditions ?? '',
      currentMedication: source?.currentMedication ?? source?.currentMedications ?? '',
      currentMedications: source?.currentMedications ?? source?.currentMedication ?? '',
      heightCm: source?.heightCm ?? null,
      weightKg: source?.weightKg ?? null,
      bmi: source?.bmi ?? null,
      lastUpdatedAt: source?.lastUpdatedAt ?? source?.updatedAt ?? source?.dateOfUpdate ?? null
    };
  }

  private toMatch(patient: EmergencyPatientSummary): EmergencyPatientMatch {
    return {
      ...patient,
      matchedFields: this.getMatchedFields(patient)
    };
  }

  private getMatchedFields(patient: EmergencyPatientSummary): MatchedField[] {
    const query = this.cleanQuery.toLowerCase();

    if (!query) {
      return [];
    }

    const fields: MatchedField[] = [
      { label: 'Patient ID', value: String(patient.patientId || '') },
      { label: 'Name', value: String(patient.fullName || '') },
      { label: 'Contact', value: String(patient.contactNumber || patient.emergencyContact || '') },
      { label: 'Blood Group', value: String(patient.bloodGroup || '') },
      { label: 'Address', value: String(patient.address || '') },
      { label: 'District', value: String(patient.district || '') },
      { label: 'State', value: String(patient.state || '') },
      { label: 'Pincode', value: String(patient.pincode || '') }
    ];

    return fields.filter(field => field.value.toLowerCase().includes(query));
  }

  private toList(value: unknown): string[] {
    const text = String(value || '').trim();

    if (!text) {
      return [];
    }

    return text
      .split(/[,;|\n]+/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  private formatHeight(patient: EmergencyPatientDetails | null): string {
    const value = patient?.heightCm;
    return value || value === 0 ? `${value} cm` : 'Not recorded';
  }

  private formatWeight(patient: EmergencyPatientDetails | null): string {
    const value = patient?.weightKg;
    return value || value === 0 ? `${value} kg` : 'Not recorded';
  }

  private formatBmi(patient: EmergencyPatientDetails | null): string {
    const value = patient?.bmi;

    if (value || value === 0) {
      return Number(value).toFixed(1);
    }

    const height = Number(patient?.heightCm || 0);
    const weight = Number(patient?.weightKg || 0);

    if (!height || !weight) {
      return 'Not recorded';
    }

    return (weight / Math.pow(height / 100, 2)).toFixed(1);
  }

  private findExactPatientMatch(matches: EmergencyPatientMatch[]): EmergencyPatientMatch | null {
    const query = this.cleanQuery.toLowerCase();

    if (!query) {
      return null;
    }

    const exactMatches = matches.filter(patient =>
      String(patient.patientId || '').toLowerCase() === query
    );

    return exactMatches.length === 1 ? exactMatches[0] : null;
  }

  private buildEmergencyRecordPrintHtml(patient: EmergencyPatientDetails): string {
    const patientName = this.escapeHtml(this.patientName(patient));
    const patientId = this.escapeHtml(this.displayValue(patient.patientId));
    const generatedAt = this.escapeHtml(new Date().toLocaleString('en-IN'));

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Emergency Record - ${patientName}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px; font-family: Arial, sans-serif; color: #101828; background: #ffffff; }
    .header { padding: 24px; border-radius: 22px; color: #ffffff; background: linear-gradient(135deg, #635bff, #7c6dff); }
    .brand { margin: 0 0 10px; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .85; }
    h1 { margin: 0; font-size: 30px; line-height: 1.1; }
    .meta { margin-top: 10px; font-size: 14px; opacity: .9; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
    .card { padding: 16px; border: 1px solid #e7eaf3; border-radius: 16px; background: #f8f9ff; page-break-inside: avoid; }
    .wide { grid-column: 1 / -1; }
    .label { margin: 0 0 7px; color: #635bff; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
    .value { margin: 0; font-size: 14px; line-height: 1.5; font-weight: 700; white-space: pre-wrap; }
    .stack { display: grid; gap: 8px; margin-top: 8px; }
    .stack span { display: block; padding: 9px 10px; border-left: 4px solid #635bff; border-radius: 10px; background: #f1efff; font-weight: 700; }
    .footer { margin-top: 18px; padding-top: 12px; border-top: 1px solid #e7eaf3; color: #667085; font-size: 12px; }
    @media print { body { padding: 18px; } .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <section class="header">
    <p class="brand">MedVerse Emergency Record</p>
    <h1>${patientName}</h1>
    <div class="meta">Patient ID: <strong>${patientId}</strong> · Exported: ${generatedAt}</div>
  </section>

  <section class="grid">
    ${this.renderPdfField('Blood Group', patient.bloodGroup)}
    ${this.renderPdfField('Age / Gender', `${this.displayValue(patient.age)} yrs · ${this.displayValue(patient.gender)}`)}
    ${this.renderPdfField('Emergency Contact', patient.contactNumber || patient.emergencyContact)}
    ${this.renderPdfField('Last Updated', this.formatDate(patient.lastUpdatedAt))}
    ${this.renderPdfField('Address', this.formatAddress(patient), true)}
    ${this.renderPdfList('Allergies', this.allergiesList)}
    ${this.renderPdfList('Chronic Conditions', this.chronicConditionsList)}
    ${this.renderPdfList('Current Medication', this.currentMedicationList)}
    ${this.renderPdfField('Height', this.formatHeight(patient))}
    ${this.renderPdfField('Weight', this.formatWeight(patient))}
    ${this.renderPdfField('BMI', this.formatBmi(patient))}
  </section>

  <p class="footer">This PDF is generated from the current MedVerse emergency lookup screen. Verify all emergency treatment decisions using hospital protocol.</p>
</body>
</html>`;
  }

  private renderPdfField(label: string, value: unknown, wide = false): string {
    return `<article class="card ${wide ? 'wide' : ''}">
      <p class="label">${this.escapeHtml(label)}</p>
      <p class="value">${this.escapeHtml(this.displayValue(value))}</p>
    </article>`;
  }

  private renderPdfList(label: string, values: string[]): string {
    const items = values.length
      ? values.map(value => `<span>${this.escapeHtml(value)}</span>`).join('')
      : '<span>Not recorded</span>';

    return `<article class="card">
      <p class="label">${this.escapeHtml(label)}</p>
      <div class="stack">${items}</div>
    </article>`;
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private makeResultMessage(resultType: string, count: number): string {
    if (resultType === 'SINGLE') {
      return 'Exact emergency profile found.';
    }

    if (count > 0) {
      return `${count} matching patient profile${count > 1 ? 's' : ''} found.`;
    }

    return 'No matching patient found.';
  }

  private scrollToEmergencyRecord(): void {
    setTimeout(() => {
      this.emergencyRecordSection?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 120);
  }

  private showMessage(message: string, type: 'success' | 'danger' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3200);
  }
}