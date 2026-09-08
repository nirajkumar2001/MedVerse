import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';

import { Patient } from '../../../core/models/patient.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { AccessRequestService } from '../../../core/services/access-request.service';
import { PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { MedicalProfileUpdateService } from '../../../core/services/medical-profile-update.service';
import { RealtimeNotificationService } from '../../../core/services/realtime-notification.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface DashboardAccessRequest {
  sessionId: string;
  doctorName: string;
  doctorId?: string;
  reason: string;
  allowPrevious: boolean;
  status: 'Pending' | 'Active' | 'Denied' | 'Completed' | 'Expired' | 'Revoked';
  rawStatus: string;
  requestedAt?: Date | string;
  respondedAt?: Date | string;
  accessEndedAt?: Date | string;
}

interface RecentActivity {
  title: string;
  time?: string | Date;
  status: string;
  type: string;
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutSidebarComponent,
    LogoutConfirmModalComponent,
    StatCardComponent,
    HealthcareFooterComponent,
    ToastMessageComponent,
    PageHeaderComponent
  ],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  logoSrc = '/shared-assets/Medverse_images/medverse-logo.png';

  patient: Patient | null = null;

  medicalRecord: any = {
    patientId: '',
    currentProfile: {},
    previousRecords: []
  };

  accessRequests: DashboardAccessRequest[] = [];
  recentActivities: RecentActivity[] = [];

  showLogoutModal = false;
  isLoading = true;
  isRequestsLoading = true;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'info';

  private readonly subscriptions = new Subscription();

  menuItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/patient/home', icon: 'D', exact: true },
    { label: 'My Profile', route: '/patient/profile', icon: 'P', exact: true },
    { label: 'Emergency Details', route: '/patient/emergency-details', icon: 'E', exact: true },
    { label: 'My Medical Records', route: '/patient/medical-records', icon: 'M', exact: true },
    { label: 'Access Requests', route: '/patient/notifications', icon: 'N', badgeCount: 0, exact: true },
    { label: 'Help & Support', route: '/patient/support', icon: 'H', exact: true }
  ];

  constructor(
    private readonly patientService: PatientService,
    private readonly accessRequestService: AccessRequestService,
    private readonly authService: AuthService,
    private readonly medicalProfileUpdateService: MedicalProfileUpdateService,
    private readonly realtime: RealtimeNotificationService
  ) {}

  ngOnInit(): void {
    this.realtime.connect();
    this.loadDashboard(true);

    this.subscriptions.add(
      this.realtime.accessNotification$.subscribe(message => {
        if (message) {
          this.loadDashboard(false);
        }
      })
    );

    this.subscriptions.add(
      this.realtime.medicalProfileUpdate$.subscribe(update => {
        if (update) {
          this.loadDashboard(false);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good Morning';
    }

    if (hour < 17) {
      return 'Good Afternoon';
    }

    return 'Good Evening';
  }

  get patientAny(): any {
    return this.patient as any;
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

  get patientId(): string {
    return (
      this.patientAny?.patientId ||
      this.currentProfile?.patientId ||
      this.medicalRecord?.patientId ||
      this.patientAny?.userId ||
      'Patient'
    );
  }

  get currentProfile(): any {
    return this.medicalRecord?.currentProfile ?? {};
  }


  get patientBadgeText(): string {
    return `ID: ${this.patientId}`;
  }

  get patientAvatarText(): string {
    const name = this.patientName || 'Patient';

    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'P';
  }

  get patientPhotoUrl(): string {
    const patientAny = this.patientAny;

    return (
      localStorage.getItem('medverse-patient-profile-photo') ||
      patientAny?.photoUrl ||
      patientAny?.profileImage ||
      patientAny?.profilePicture ||
      patientAny?.imageUrl ||
      ''
    );
  }

  get bloodGroup(): string {
    return this.readMedicalField('bloodGroup') || 'Not recorded';
  }

  get pendingAccessCount(): number {
    return this.pendingRequests.length;
  }

  get pendingRequests(): DashboardAccessRequest[] {
    return this.accessRequests.filter(request => request.status === 'Pending');
  }

  get activeSessions(): DashboardAccessRequest[] {
    return this.accessRequests.filter(request => {
      return request.status === 'Active' && !request.accessEndedAt;
    });
  }

  get activeSessionCount(): number {
    return this.activeSessions.length;
  }

  get completedVisits(): number {
    return Array.isArray(this.medicalRecord?.previousRecords)
      ? this.medicalRecord.previousRecords.length
      : 0;
  }

  get latestAccessRequest(): DashboardAccessRequest | undefined {
    return this.pendingRequests[0];
  }

  get currentAccessRequest(): DashboardAccessRequest | null {
    return this.latestAccessRequest ?? null;
  }

  get allergyCount(): number {
    return this.countItems(
      this.readMedicalField('allergies') ||
      this.patientAny?.emergencyRecord?.allergies
    );
  }

  get chronicConditionCount(): number {
    return this.countItems(
      this.readMedicalField('chronicConditions') ||
      this.patientAny?.emergencyRecord?.chronicConditions
    );
  }

  get medicationCount(): number {
    return this.countItems(
      this.readMedicalField('currentMedication') ||
      this.readMedicalField('currentMedications') ||
      this.patientAny?.emergencyRecord?.currentMedications
    );
  }

  get lastCheckupText(): string {
    return this.formatDate(this.latestMedicalDate());
  }

  loadDashboard(showLoader = true): void {
    if (showLoader) {
      this.isLoading = true;
    }

    this.isRequestsLoading = true;

    this.subscriptions.add(
      forkJoin({
        profile: this.patientService.getMyProfile(),
        requests: this.accessRequestService.getForPatient(false),
        record: this.medicalProfileUpdateService.getMyMedicalRecord()
      }).subscribe({
        next: response => {
          this.patient = this.unwrap(response.profile);

          this.accessRequests = this.sortRequests(
            this.dedupeRequests(
              this.unwrapArray(response.requests).map((request: any) =>
                this.toDashboardAccessRequest(request)
              )
            )
          );

          this.medicalRecord = this.normalizeMedicalRecord(response.record);

          this.recentActivities = this.buildRecentActivities();

          this.isLoading = false;
          this.isRequestsLoading = false;

          this.updateAccessRequestBadge();
        },
        error: error => {
          console.error('Unable to load patient dashboard:', error);

          this.isLoading = false;
          this.isRequestsLoading = false;

          this.accessRequests = [];
          this.recentActivities = [];
          this.updateAccessRequestBadge();

          this.notify('Unable to load dashboard data.', 'danger');
        }
      })
    );
  }

  approveRequest(request: DashboardAccessRequest, allowPreviousRecords: boolean): void {
    if (!request?.sessionId) {
      this.notify('Request details are missing.', 'danger');
      return;
    }

    this.accessRequestService
      .decide(request.sessionId, 'APPROVE', allowPreviousRecords)
      .subscribe({
        next: () => {
          this.notify(
            allowPreviousRecords
              ? 'Doctor access approved with previous medical history.'
              : 'Doctor access approved for emergency profile only.',
            'success'
          );

          this.loadDashboard(false);
        },
        error: error => {
          console.error('Unable to approve access request:', error);

          this.notify(
            error?.error?.message ||
              error?.error?.data?.error ||
              'Unable to approve access request.',
            'danger'
          );
        }
      });
  }

  dismissRequest(request: DashboardAccessRequest): void {
    if (!request?.sessionId) {
      this.notify('Request details are missing.', 'danger');
      return;
    }

    this.accessRequestService
      .decide(
        request.sessionId,
        'DENY',
        false,
        'Patient dismissed the access request from dashboard'
      )
      .subscribe({
        next: () => {
          this.notify('Access request dismissed.', 'success');
          this.loadDashboard(false);
        },
        error: error => {
          console.error('Unable to dismiss access request:', error);

          this.notify(
            error?.error?.message ||
              error?.error?.data?.error ||
              'Unable to dismiss access request.',
            'danger'
          );
        }
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

  formatDate(value?: string | Date): string {
    if (!value) {
      return 'Not recorded';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Not recorded';
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private buildRecentActivities(): RecentActivity[] {
    /*
     * Recent Activity must reflect real access notification records only.
     * Do not add synthetic medical-profile / visit-update activities here,
     * because those are medical records, not notification rows.
     */
    return this.accessRequests
      .map(request => ({
        title: this.accessActivityTitle(request),
        time: this.accessActivityTime(request),
        status: request.status,
        type: request.rawStatus
      }))
      .filter(activity => Boolean(activity.time))
      .filter((activity, index, list) => {
        const key = `${activity.type}|${activity.status}|${this.activityTime(activity.time)}|${activity.title}`;

        return list.findIndex(item => {
          const itemKey = `${item.type}|${item.status}|${this.activityTime(item.time)}|${item.title}`;
          return itemKey === key;
        }) === index;
      })
      .sort((first, second) => {
        return this.activityTime(second.time) - this.activityTime(first.time);
      })
      .slice(0, 6);
  }

  private accessActivityTitle(request: DashboardAccessRequest): string {
    if (request.status === 'Pending') {
      return `Access request from ${request.doctorName}`;
    }

    if (request.status === 'Active') {
      return `Active doctor access for ${request.doctorName}`;
    }

    if (request.status === 'Completed') {
      return `Access session completed with ${request.doctorName}`;
    }

    if (request.status === 'Denied') {
      return `Access request denied for ${request.doctorName}`;
    }

    if (request.status === 'Revoked') {
      return `Access revoked for ${request.doctorName}`;
    }

    if (request.status === 'Expired') {
      return `Access request expired for ${request.doctorName}`;
    }

    return 'Access request updated';
  }

  private updateAccessRequestBadge(): void {
    this.menuItems = this.menuItems.map(item => {
      if (item.label === 'Access Requests') {
        return {
          ...item,
          badgeCount: this.pendingAccessCount
        };
      }

      return item;
    });
  }

  private toDashboardAccessRequest(request: any): DashboardAccessRequest {
    const rawStatus = String(
      request?.accessStatus ??
        request?.status ??
        'PENDING'
    ).toUpperCase();

    return {
      sessionId:
        request?.sessionId ??
        request?.notificationId ??
        request?.requestId ??
        request?.id ??
        `LOCAL-${request?.doctorId ?? request?.doctorName ?? 'DOCTOR'}-${rawStatus}-${request?.notifiedAt ?? request?.createdAt ?? request?.requestedAt ?? Date.now()}`,
      doctorName: request?.doctorName ?? request?.doctorId ?? 'Doctor',
      doctorId: request?.doctorId,
      reason:
        request?.requestMessage ??
        request?.reason ??
        'Doctor requested access to your emergency medical profile.',
      allowPrevious: Boolean(
        request?.canViewPreviousRecords ??
          request?.allowPreviousMedicalRecords ??
          request?.allowPrevious
      ),
      status: this.toStatus(rawStatus),
      rawStatus,
      requestedAt:
        request?.notifiedAt ??
        request?.assignedDate ??
        request?.createdAt ??
        request?.requestedAt,
      respondedAt: request?.respondedAt,
      accessEndedAt: request?.accessEndedAt
    };
  }

  private dedupeRequests(requests: DashboardAccessRequest[]): DashboardAccessRequest[] {
    const latestBySession = new Map<string, DashboardAccessRequest>();

    requests.forEach(request => {
      const key = request.sessionId || `${request.doctorId ?? request.doctorName}-${request.rawStatus}-${this.requestTime(request)}`;
      const existing = latestBySession.get(key);

      if (!existing || this.requestTime(request) >= this.requestTime(existing)) {
        latestBySession.set(key, request);
      }
    });

    return Array.from(latestBySession.values());
  }

  private sortRequests(requests: DashboardAccessRequest[]): DashboardAccessRequest[] {
    return [...requests].sort((first, second) => {
      return this.requestTime(second) - this.requestTime(first);
    });
  }

  private requestTime(request: DashboardAccessRequest): number {
    const value =
      request.accessEndedAt ??
      request.respondedAt ??
      request.requestedAt;

    if (!value) {
      return 0;
    }

    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private toStatus(status: string): DashboardAccessRequest['status'] {
    const normalized = String(status ?? '').toUpperCase();

    if (
      normalized === 'APPROVED' ||
      normalized === 'APPROVEDWITHPREVIOUSRECORDS' ||
      normalized === 'APPROVEDPROFILEONLY'
    ) {
      return 'Active';
    }

    if (
      normalized === 'REJECTED' ||
      normalized === 'DENIED'
    ) {
      return 'Denied';
    }

    if (normalized === 'COMPLETED') {
      return 'Completed';
    }

    if (normalized === 'REVOKED') {
      return 'Revoked';
    }

    if (normalized === 'EXPIRED') {
      return 'Expired';
    }

    return 'Pending';
  }


  private get previousRecords(): any[] {
    return Array.isArray(this.medicalRecord?.previousRecords)
      ? this.medicalRecord.previousRecords
      : [];
  }

  private normalizeMedicalRecord(response: any): any {
    const record = this.unwrap(response) ?? {};
    const currentProfile =
      record?.currentProfile ??
      record?.profile ??
      record?.medicalProfile ??
      {};

    const previousRecords = Array.isArray(record?.previousRecords)
      ? record.previousRecords
      : Array.isArray(record?.medicalHistory)
        ? record.medicalHistory
        : Array.isArray(record?.visits)
          ? record.visits
          : [];

    return {
      ...record,
      patientId:
        record?.patientId ||
        currentProfile?.patientId ||
        this.patientAny?.patientId ||
        this.patientAny?.userId ||
        '',
      currentProfile,
      previousRecords
    };
  }

  private readMedicalField(fieldName: string): any {
    const currentValue = this.currentProfile?.[fieldName];

    if (this.hasValue(currentValue)) {
      return currentValue;
    }

    const latestVisit = this.latestVisit();
    const latestValue = latestVisit?.[fieldName];

    if (this.hasValue(latestValue)) {
      return latestValue;
    }

    if (fieldName === 'currentMedication') {
      const medicineValue = this.currentProfile?.currentMedications || latestVisit?.currentMedications;

      if (this.hasValue(medicineValue)) {
        return medicineValue;
      }
    }

    return '';
  }

  private latestMedicalDate(): string | Date | undefined {
    const latestVisit = this.latestVisit();

    return (
      this.currentProfile?.lastUpdatedAt ||
      this.currentProfile?.updatedAt ||
      latestVisit?.dateOfUpdate ||
      latestVisit?.updatedAt ||
      latestVisit?.createdAt ||
      this.currentProfile?.createdAt
    );
  }

  private visitActivityTitle(visit: any): string {
    const disease = String(visit?.disease || visit?.lastDisease || '').trim();
    const doctor = String(visit?.doctorName || visit?.doctorId || '').trim();

    if (disease && doctor) {
      return `${disease} visit updated by ${doctor}`;
    }

    if (disease) {
      return `${disease} visit record updated`;
    }

    if (doctor) {
      return `Medical visit updated by ${doctor}`;
    }

    return 'Medical visit record updated';
  }

  private visitActivityTime(visit: any): string | Date | undefined {
    return visit?.dateOfUpdate || visit?.updatedAt || visit?.createdAt || visit?.lastUpdatedAt;
  }

  private accessActivityTime(request: DashboardAccessRequest): string | Date | undefined {
    return request.accessEndedAt || request.respondedAt || request.requestedAt;
  }

  private activityTime(value?: string | Date): number {
    if (!value) {
      return 0;
    }

    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private hasValue(value: any): boolean {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  private latestVisit(): any | null {
    const visits = this.previousRecords;

    if (visits.length === 0) {
      return null;
    }

    return [...visits].sort((first: any, second: any) => {
      const firstTime = this.activityTime(this.visitActivityTime(first));
      const secondTime = this.activityTime(this.visitActivityTime(second));

      return secondTime - firstTime;
    })[0];
  }

  private countItems(value: any): number {
    if (!value) {
      return 0;
    }

    if (Array.isArray(value)) {
      return value
        .flatMap(item => this.normalizeListValue(item))
        .filter(Boolean)
        .length;
    }

    return this.normalizeListValue(value).length;
  }

  private normalizeListValue(value: any): string[] {
    if (value === null || value === undefined) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.flatMap(item => this.normalizeListValue(item));
    }

    const raw = String(value).trim();

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed.flatMap(item => this.normalizeListValue(item));
      }
    } catch {
      // Value is a normal text field, not JSON.
    }

    return raw
      .split(/[,;|\n]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  private unwrap(response: any): any {
    return response?.data ?? response ?? null;
  }

  private unwrapArray(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.result)) {
      return response.result;
    }

    if (Array.isArray(response?.content)) {
      return response.content;
    }

    return [];
  }

  private notify(message: string, type: 'success' | 'danger' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    window.setTimeout(() => {
      this.showToast = false;
    }, 2800);
  }
}