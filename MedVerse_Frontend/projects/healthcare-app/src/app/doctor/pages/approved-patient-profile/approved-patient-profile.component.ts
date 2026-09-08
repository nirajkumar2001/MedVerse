import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { Doctor } from '../../../core/models/doctor.model';
import { AppNotification } from '../../../core/models/app-notification.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AccessRequestService } from '../../../core/services/access-request.service';
import { MedicalProfileUpdateService } from '../../../core/services/medical-profile-update.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';

interface PatientSummary {
  fullName: string;
  age: number | null;
  gender: string;
  patientId: string;
  bloodGroup: string;
  emergencyContact: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  photoUrl: string;
}

type MedicalListKind = 'allergy' | 'chronic' | 'medication';

@Component({
  selector: 'app-approved-patient-profile',
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
  templateUrl: './approved-patient-profile.component.html',
  styleUrls: ['./approved-patient-profile.component.css']
})
export class ApprovedPatientProfileComponent implements OnInit, OnDestroy {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  sessionId = '';
  patientId = '';
  canViewPreviousRecords = false;

  isLoading = true;
  isSaving = false;
  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'success';

  patientSummary: PatientSummary = this.emptySummary();
  previousRecords: any[] = [];
  expandedRecordId = '';

  bloodGroupOptions = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  allergyItems: string[] = [];
  chronicConditionItems: string[] = [];
  currentMedicationItems: string[] = [];

  allergyDraft = '';
  chronicDraft = '';
  medicationDraft = '';

  medicalForm = {
    bloodGroup: '',
    disease: '',
    medicalReports: '',
    findings: '',
    prescription: '',
    heightCm: null as number | null,
    weightKg: null as number | null,
    bmi: null as number | null,
    bloodPressure: '',
    bodyTemperature: ''
  };

  formErrors = {
    disease: '',
    findings: '',
    heightCm: '',
    weightKg: '',
    bloodPressure: '',
    bodyTemperature: '',
    listItem: ''
  };

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly doctorService: DoctorService,
    private readonly notificationService: NotificationService,
    private readonly accessRequestService: AccessRequestService,
    private readonly medicalProfileUpdateService: MedicalProfileUpdateService,
    private readonly authService: AuthService
  ) {
    this.doctor = this.doctorService.getCurrentDoctor();
    this.updateSidebarItems();
  }

  ngOnInit(): void {
    const routeSessionId = this.route.snapshot.queryParamMap.get('sessionId') || '';
    const routePatientId = this.route.snapshot.queryParamMap.get('patientId') || '';
    const routePrevious = this.route.snapshot.queryParamMap.get('previous');
    const storedContext = this.getApprovedProfileContext();

    this.sessionId = routeSessionId || storedContext.sessionId || '';
    this.patientId = routePatientId || storedContext.patientId || '';
    this.canViewPreviousRecords = routePrevious !== null
      ? routePrevious === 'true'
      : Boolean(storedContext.previous || storedContext.canViewPreviousRecords);

    if (routeSessionId || routePatientId || routePrevious !== null) {
      this.cleanSensitiveUrl();
    }

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

    this.notificationService.loadDoctorNotifications(false).subscribe();

    if (!this.sessionId || !this.patientId) {
      this.isLoading = false;
      this.showMessage('Missing approved access details. Open this page from Notifications or Patient Care.', 'danger');
      return;
    }

    this.loadApprovedPatient();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter(item => item.unread).length;
  }

  get doctorDisplayName(): string {
    return this.doctor?.fullName || 'Doctor';
  }

  get doctorAvatarText(): string {
    return this.doctorDisplayName || 'DR';
  }

  get doctorAvatarImage(): string {
    return this.doctor?.profileImage || '';
  }

  get doctorBadgeText(): string {
    return this.doctor?.doctorId ? `ID: ${this.doctor.doctorId}` : 'Doctor';
  }

  get patientInitials(): string {
    return String(this.patientSummary.fullName || 'Patient')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'PT';
  }

  get calculatedBmi(): number | null {
    const height = Number(this.medicalForm.heightCm);
    const weight = Number(this.medicalForm.weightKg);

    if (!height || !weight || height <= 0 || weight <= 0) {
      return this.medicalForm.bmi;
    }

    return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
  }

  updateSidebarItems(): void {
    const active = this.notifications.filter(item => String(item.accessStatus || '').toUpperCase() === 'APPROVED' && !item.accessEndedAt).length;
    const pending = this.notifications.filter(item => String(item.accessStatus || '').toUpperCase() === 'PENDING').length;

    this.sidebarItems = [
      { label: 'Dashboard', icon: 'D', route: '/doctor/home', exact: true },
      { label: 'Emergency Lookup', icon: 'E', route: '/doctor/emergency-lookup', exact: true },
      { label: 'Patient Care', icon: 'C', route: '/doctor/patient-care', badgeCount: active + pending, exact: true },
      { label: 'Doctor Profile', icon: 'P', route: '/doctor/profile', exact: true },
      { label: 'Notifications', icon: 'N', route: '/doctor/notifications', badgeCount: this.unreadCount, exact: true },
      { label: 'Help & Support', icon: 'H', route: '/doctor/support', exact: true }
    ];
  }

  loadApprovedPatient(): void {
    this.isLoading = true;

    this.medicalProfileUpdateService.getPatientEmergencyDetails(this.patientId).subscribe({
      next: response => {
        this.patchPatientSummary(response?.data ?? response ?? {});
      },
      error: error => {
        console.error('Unable to load emergency patient details:', error);
      }
    });

    this.medicalProfileUpdateService.getCompleteRecordForDoctor(this.patientId, this.sessionId).subscribe({
      next: response => {
        const data = response?.data ?? response ?? {};
        const profile = data?.currentProfile ?? {};
        this.previousRecords = Array.isArray(data?.previousRecords) ? data.previousRecords : [];
        this.patchMedicalForm(profile);
        this.isLoading = false;
      },
      error: error => {
        console.error('Unable to load approved patient profile:', error);
        this.isLoading = false;
        this.showMessage(
          error?.error?.message ||
            error?.error?.data?.message ||
            'Unable to load approved patient profile. Please confirm the access is still approved.',
          'danger'
        );
      }
    });
  }

  addListItem(kind: MedicalListKind): void {
    this.formErrors.listItem = '';

    const value = this.getDraft(kind).trim();

    if (!value) {
      return;
    }

    if (value.length < 2) {
      this.formErrors.listItem = 'Each item should contain at least 2 characters.';
      return;
    }

    if (value.length > 80) {
      this.formErrors.listItem = 'Each item should be within 80 characters.';
      return;
    }

    const list = this.getList(kind);
    const exists = list.some(item => item.toLowerCase() === value.toLowerCase());

    if (exists) {
      this.formErrors.listItem = 'This item is already added.';
      this.setDraft(kind, '');
      return;
    }

    list.push(value);
    this.setDraft(kind, '');
  }

  removeListItem(kind: MedicalListKind, index: number): void {
    const list = this.getList(kind);
    list.splice(index, 1);
  }

  saveMedicalUpdate(): void {
    this.resetErrors();

    if (!this.validateForm()) {
      this.showMessage('Please correct highlighted fields before saving.', 'danger');
      return;
    }

    this.isSaving = true;

    this.medicalProfileUpdateService.createUpdate({
      sessionId: this.sessionId,
      patientId: this.patientId,
      bloodGroup: this.medicalForm.bloodGroup,
      allergies: this.joinMedicalItems(this.allergyItems),
      chronicConditions: this.joinMedicalItems(this.chronicConditionItems),
      currentMedication: this.joinMedicalItems(this.currentMedicationItems),
      disease: this.medicalForm.disease.trim(),
      medicalReports: this.medicalForm.medicalReports.trim(),
      findings: this.medicalForm.findings.trim(),
      prescription: this.medicalForm.prescription.trim(),
      heightCm: this.toNullableNumber(this.medicalForm.heightCm),
      weightKg: this.toNullableNumber(this.medicalForm.weightKg),
      bmi: this.calculatedBmi,
      bloodPressure: this.medicalForm.bloodPressure.trim(),
      bodyTemperature: this.medicalForm.bodyTemperature.trim()
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.notificationService.loadDoctorNotifications(false).subscribe();
        this.showMessage('Medical profile updated. Approved access completed automatically.', 'success');

        setTimeout(() => {
          this.router.navigate(['/doctor/notifications']);
        }, 1000);
      },
      error: error => {
        console.error('Unable to save medical update:', error);
        this.isSaving = false;
        this.showMessage(
          error?.error?.message ||
            error?.error?.data?.message ||
            'Unable to save medical profile update.',
          'danger'
        );
      }
    });
  }

  endWithoutSaving(): void {
    this.accessRequestService
      .endSession(this.sessionId, 'Doctor ended approved access without editing patient profile')
      .subscribe({
        next: response => {
          const updated = response?.data ?? response;
          if (updated) {
            this.notificationService.upsertFromBackend(updated, false);
          }
          this.showMessage('Approved access ended without saving changes.', 'success');
          setTimeout(() => this.router.navigate(['/doctor/notifications']), 900);
        },
        error: error => {
          console.error('Unable to end approved session:', error);
          this.showMessage(error?.error?.message || 'Unable to end approved access.', 'danger');
        }
      });
  }

  toggleRecord(record: any): void {
    const key = this.recordKey(record);
    this.expandedRecordId = this.expandedRecordId === key ? '' : key;
  }

  isRecordExpanded(record: any): boolean {
    return this.expandedRecordId === this.recordKey(record);
  }

  recordKey(record: any): string {
    return String(record?.updateId ?? record?.dateOfUpdate ?? record?.createdAt ?? record?.doctorId ?? record?.disease ?? 'record');
  }

  backToCare(): void {
    this.router.navigate(['/doctor/patient-care']);
  }

  backToNotifications(): void {
    this.router.navigate(['/doctor/notifications']);
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'Not recorded';
    }

    return String(value);
  }

  displayList(value: unknown): string[] {
    return this.splitMedicalList(value);
  }

  formatAddress(): string {
    const parts = [this.patientSummary.address, this.patientSummary.district, this.patientSummary.state, this.patientSummary.pincode]
      .map(value => String(value || '').trim())
      .filter(Boolean);

    return parts.length ? parts.join(', ') : 'Not recorded';
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'Not available';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Not available';
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  private getApprovedProfileContext(): any {
    const stateContext = typeof history !== 'undefined'
      ? history.state?.approvedProfileContext
      : null;

    if (stateContext?.sessionId || stateContext?.patientId) {
      this.persistApprovedProfileContext(stateContext);
      return stateContext;
    }

    if (typeof sessionStorage === 'undefined') {
      return {};
    }

    try {
      const raw = sessionStorage.getItem('medverse-approved-profile-context');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private persistApprovedProfileContext(context: any): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    try {
      sessionStorage.setItem('medverse-approved-profile-context', JSON.stringify({
        sessionId: context?.sessionId || '',
        patientId: context?.patientId || '',
        previous: Boolean(context?.previous || context?.canViewPreviousRecords),
        storedAt: Date.now()
      }));
    } catch {
      // Non-blocking. The route can still use in-memory navigation state.
    }
  }

  private cleanSensitiveUrl(): void {
    setTimeout(() => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    });
  }

  private validateForm(): boolean {
    const healthConcern = this.medicalForm.disease.trim();
    const findings = this.medicalForm.findings.trim();

    if (!healthConcern) {
      this.formErrors.disease = 'Health concern is required.';
    } else if (healthConcern.length < 3) {
      this.formErrors.disease = 'Health concern should be at least 3 characters.';
    }

    if (!findings) {
      this.formErrors.findings = 'Doctor findings are required.';
    } else if (findings.length < 5) {
      this.formErrors.findings = 'Doctor findings should be more descriptive.';
    }

    const height = this.toNullableNumber(this.medicalForm.heightCm);
    if (height !== null && (height < 30 || height > 260)) {
      this.formErrors.heightCm = 'Height should be between 30 and 260 cm.';
    }

    const weight = this.toNullableNumber(this.medicalForm.weightKg);
    if (weight !== null && (weight < 1 || weight > 500)) {
      this.formErrors.weightKg = 'Weight should be between 1 and 500 kg.';
    }

    const bp = this.medicalForm.bloodPressure.trim();
    if (bp && !/^\d{2,3}\s*\/\s*\d{2,3}(\s*mmHg)?$/i.test(bp)) {
      this.formErrors.bloodPressure = 'Use format like 120/80 or 120/80 mmHg.';
    }

    const temp = this.medicalForm.bodyTemperature.trim();
    if (temp && !/^\d{2,3}(\.\d)?\s*(°?F|°?C)?$/i.test(temp)) {
      this.formErrors.bodyTemperature = 'Use format like 98.6°F or 37°C.';
    }

    return !Object.values(this.formErrors).some(Boolean);
  }

  private resetErrors(): void {
    this.formErrors = {
      disease: '',
      findings: '',
      heightCm: '',
      weightKg: '',
      bloodPressure: '',
      bodyTemperature: '',
      listItem: ''
    };
  }

  private getList(kind: MedicalListKind): string[] {
    if (kind === 'allergy') return this.allergyItems;
    if (kind === 'chronic') return this.chronicConditionItems;
    return this.currentMedicationItems;
  }

  private getDraft(kind: MedicalListKind): string {
    if (kind === 'allergy') return this.allergyDraft;
    if (kind === 'chronic') return this.chronicDraft;
    return this.medicationDraft;
  }

  private setDraft(kind: MedicalListKind, value: string): void {
    if (kind === 'allergy') {
      this.allergyDraft = value;
      return;
    }

    if (kind === 'chronic') {
      this.chronicDraft = value;
      return;
    }

    this.medicationDraft = value;
  }

  private patchPatientSummary(source: any): void {
    this.patientSummary = {
      patientId: source?.patientId ?? this.patientId,
      fullName: source?.fullName ?? source?.name ?? this.patientSummary.fullName,
      age: source?.age ?? this.patientSummary.age,
      gender: source?.gender ?? this.patientSummary.gender,
      bloodGroup: source?.bloodGroup ?? this.patientSummary.bloodGroup,
      emergencyContact: source?.emergencyContact ?? source?.contactNumber ?? this.patientSummary.emergencyContact,
      address: source?.address ?? this.patientSummary.address,
      district: source?.district ?? this.patientSummary.district,
      state: source?.state ?? this.patientSummary.state,
      pincode: source?.pincode != null ? String(source.pincode) : this.patientSummary.pincode,
      photoUrl: source?.photoUrl ?? source?.profileImage ?? this.patientSummary.photoUrl
    };
  }

  private patchMedicalForm(profile: any): void {
    this.medicalForm = {
      ...this.medicalForm,
      bloodGroup: profile?.bloodGroup ?? this.patientSummary.bloodGroup ?? '',
      medicalReports: profile?.medicalReports ?? '',
      heightCm: this.toNullableNumber(profile?.heightCm),
      weightKg: this.toNullableNumber(profile?.weightKg),
      bmi: this.toNullableNumber(profile?.bmi),
      bloodPressure: profile?.bloodPressure ?? '',
      bodyTemperature: profile?.bodyTemperature ?? '',
      disease: profile?.lastDisease ?? profile?.disease ?? '',
      findings: profile?.lastFindings ?? profile?.findings ?? '',
      prescription: profile?.lastPrescription ?? profile?.prescription ?? ''
    };

    this.allergyItems = this.splitMedicalList(profile?.allergies);
    this.chronicConditionItems = this.splitMedicalList(profile?.chronicConditions);
    this.currentMedicationItems = this.splitMedicalList(profile?.currentMedication);

    if (!this.patientSummary.bloodGroup && this.medicalForm.bloodGroup) {
      this.patientSummary.bloodGroup = this.medicalForm.bloodGroup;
    }
  }

  private splitMedicalList(value: unknown): string[] {
    return String(value ?? '')
      .split(/\r?\n|,|;/)
      .map(item => item.trim())
      .filter(Boolean)
      .filter((item, index, arr) => arr.findIndex(other => other.toLowerCase() === item.toLowerCase()) === index);
  }

  private joinMedicalItems(items: string[]): string {
    return items
      .map(item => item.trim())
      .filter(Boolean)
      .join('\n');
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private emptySummary(): PatientSummary {
    return {
      fullName: 'Patient',
      age: null,
      gender: '',
      patientId: '',
      bloodGroup: '',
      emergencyContact: '',
      address: '',
      district: '',
      state: '',
      pincode: '',
      photoUrl: ''
    };
  }

  private showMessage(message: string, type: 'success' | 'danger' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3400);
  }
}