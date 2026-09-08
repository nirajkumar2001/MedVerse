import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { Patient } from '../../../core/models/patient.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { AccessRequestService } from '../../../core/services/access-request.service';
import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { RealtimeNotificationService } from '../../../core/services/realtime-notification.service';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';
import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';

type PatientNotificationFilter = 'all' | 'new' | 'active' | 'dismissed' | 'completed';

type ConsentRequestStatus =
  | 'New'
  | 'Active Session'
  | 'Dismissed'
  | 'Completed'
  | 'Expired'
  | 'Revoked';

interface ConsentRequest {
  sessionId: string;
  doctorName: string;
  doctorId?: string;
  patientId?: string;
  reason: string;
  allowPrevious: boolean;
  read: boolean;

  rawStatus: string;
  status: ConsentRequestStatus;

  requestedAt?: string;
  respondedAt?: string;
  accessEndedAt?: string;
  expiresAt?: string;

  displayNotificationTime?: string;
  displayGrantedTime?: string;
  displayCompletedTime?: string;
  displayExpiryTime?: string;

  endedBy?: string;
  endReason?: string;
  rejectionReason?: string;
  accessDurationDays?: number;
}

@Component({
  selector: 'app-patient-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LayoutSidebarComponent,
    LogoutConfirmModalComponent,
    PageHeaderComponent,
    ToastMessageComponent,
    EmptyStateComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './patient-notifications.component.html',
  styleUrls: ['./patient-notifications.component.css']
})
export class PatientNotificationsComponent implements OnInit, OnDestroy {
  private readonly photoStorageKey = 'medverse-patient-profile-photo';

  patient: Patient | null = null;
  patientPhoto = localStorage.getItem(this.photoStorageKey) || '';

  requests: ConsentRequest[] = [];
  activeFilter: PatientNotificationFilter = 'all';

  isLoading = true;
  isRefreshing = false;

  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'info';

  readonly filters: Array<{ key: PatientNotificationFilter; label: string; helper: string }> = [
    { key: 'all', label: 'All', helper: 'Complete access history' },
    { key: 'new', label: 'New', helper: 'Awaiting your consent' },
    { key: 'active', label: 'Active', helper: 'Currently approved' },
    { key: 'dismissed', label: 'Denied', helper: 'Requests denied or closed by you' },
    { key: 'completed', label: 'Completed', helper: 'Doctor session finished' }
  ];

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
    private readonly accessRequestService: AccessRequestService,
    private readonly patientService: PatientService,
    private readonly authService: AuthService,
    private readonly realtime: RealtimeNotificationService
  ) {}

  ngOnInit(): void {
    this.realtime.connect();

    this.subscriptions.add(
      this.patientService.getMyProfile().subscribe({
        next: response => {
          this.patient = this.unwrap(response);
        },
        error: error => {
          console.error('Unable to load patient profile:', error);
          this.patient = null;
        }
      })
    );

    this.subscriptions.add(
      this.realtime.accessNotification$.subscribe(message => {
        if (!message) {
          return;
        }

        this.upsertRequest(message);
        this.updateMenuBadge();
        this.isLoading = false;
      })
    );

    this.refreshPatientPhoto();
    window.addEventListener('medverse-profile-photo-updated', this.photoUpdateHandler);

    this.loadRequests();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    window.removeEventListener('medverse-profile-photo-updated', this.photoUpdateHandler);
  }

  get patientAny(): any {
    return this.patient as any;
  }

  get patientBadgeText(): string {
    const id =
      this.patientAny?.patientId ||
      this.patientAny?.userId ||
      this.patientAny?.id ||
      'Patient';

    return `ID: ${id}`;
  }

  get patientAvatarText(): string {
    const name =
      this.patientAny?.fullName ||
      this.patientAny?.name ||
      this.patientAny?.patientName ||
      this.patientAny?.email ||
      'Patient';

    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'P';
  }

  get patientPhotoUrl(): string {
    return (
      this.patientPhoto ||
      this.patientAny?.photoUrl ||
      this.patientAny?.profilePhotoUrl ||
      this.patientAny?.profileImage ||
      this.patientAny?.imageUrl ||
      ''
    );
  }

  get totalCount(): number {
    return this.requests.length;
  }

  get newCount(): number {
    return this.requests.filter(request => request.status === 'New').length;
  }

  get activeCount(): number {
    return this.requests.filter(request => request.status === 'Active Session').length;
  }

  get dismissedCount(): number {
    return this.requests.filter(request => request.status === 'Dismissed').length;
  }

  get completedCount(): number {
    return this.requests.filter(request => request.status === 'Completed').length;
  }

  get unreadCount(): number {
    return this.requests.filter(request => !request.read).length;
  }

  get latestRequest(): ConsentRequest | null {
    return this.requests[0] ?? null;
  }

  get filteredRequests(): ConsentRequest[] {
    if (this.activeFilter === 'all') {
      return this.requests;
    }

    if (this.activeFilter === 'new') {
      return this.requests.filter(request => request.status === 'New');
    }

    if (this.activeFilter === 'active') {
      return this.requests.filter(request => request.status === 'Active Session');
    }

    if (this.activeFilter === 'dismissed') {
      return this.requests.filter(request => request.status === 'Dismissed');
    }

    if (this.activeFilter === 'completed') {
      return this.requests.filter(request => request.status === 'Completed');
    }

    return this.requests;
  }

  getFilterCount(filter: PatientNotificationFilter): number {
    if (filter === 'all') {
      return this.totalCount;
    }

    if (filter === 'new') {
      return this.newCount;
    }

    if (filter === 'active') {
      return this.activeCount;
    }

    if (filter === 'dismissed') {
      return this.dismissedCount;
    }

    return this.completedCount;
  }

  setFilter(filter: PatientNotificationFilter): void {
    this.activeFilter = filter;
  }

  loadRequests(): void {
    this.isLoading = true;
    this.fetchRequests(false);
  }

  refreshRequests(): void {
    this.isRefreshing = true;
    this.fetchRequests(true);
  }

  approve(request: ConsentRequest): void {
    this.decide(request, 'APPROVE');
  }

  reject(request: ConsentRequest): void {
    this.decide(request, 'DENY');
  }

  markAsRead(request: ConsentRequest): void {
    if (!request.sessionId || request.read) {
      return;
    }

    const previous = request.read;
    request.read = true;

    this.accessRequestService.markAsRead(request.sessionId).subscribe({
      next: response => {
        const updated = this.unwrap(response);

        if (updated) {
          this.upsertRequest(updated);
        }
      },
      error: error => {
        console.error('Unable to mark access request read:', error);
        request.read = previous;
        this.notify('Unable to mark this request as read.', 'danger');
      }
    });
  }

  dismissActiveSession(request: ConsentRequest): void {
    if (!request.sessionId) {
      this.notify('Unable to dismiss session because request details are missing.', 'danger');
      return;
    }

    const previousStatus = request.status;
    request.status = 'Dismissed';
    this.updateMenuBadge();

    this.accessRequestService
      .endSession(request.sessionId, 'Patient dismissed the approved access session')
      .subscribe({
        next: response => {
          const updated = this.unwrap(response);

          if (updated) {
            this.upsertRequest(updated);
          }

          this.activeFilter = 'dismissed';
          this.updateMenuBadge();
          this.notify('Approved session ended successfully.', 'success');
        },
        error: error => {
          console.error('Unable to dismiss approved session:', error);

          request.status = previousStatus;
          this.updateMenuBadge();

          this.notify(
            error?.error?.message ||
              error?.error?.data?.error ||
              'Unable to dismiss session. Please try again.',
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

  trackBySession(_: number, request: ConsentRequest): string {
    return request.sessionId;
  }

  private fetchRequests(isRefresh: boolean): void {
    this.subscriptions.add(
      this.accessRequestService.getForPatient(false).subscribe({
        next: response => {
          const requestList = this.unwrapArray(response);

          this.requests = this.sortRequests(
            this.dedupeRequests(
              requestList.map((request: any) => this.toConsentRequest(request))
            )
          );

          this.isLoading = false;
          this.isRefreshing = false;
          this.updateMenuBadge();

          if (isRefresh) {
            this.notify('Access requests refreshed.', 'success');
          }
        },
        error: error => {
          console.error('Unable to load patient access requests:', error);

          this.requests = [];
          this.isLoading = false;
          this.isRefreshing = false;
          this.updateMenuBadge();

          this.notify('Unable to load access requests. Please try again.', 'danger');
        }
      })
    );
  }

  private decide(request: ConsentRequest, decision: 'APPROVE' | 'DENY'): void {
    if (!request.sessionId) {
      this.notify('Unable to update request because request details are missing.', 'danger');
      return;
    }

    const previousStatus = request.status;
    request.status = decision === 'APPROVE' ? 'Active Session' : 'Dismissed';
    this.updateMenuBadge();

    this.accessRequestService
      .decide(
        request.sessionId,
        decision,
        request.allowPrevious,
        decision === 'DENY' ? 'Patient rejected the access request' : ''
      )
      .subscribe({
        next: response => {
          const updated = this.unwrap(response);

          if (updated) {
            this.upsertRequest(updated);
          }

          this.activeFilter = decision === 'APPROVE' ? 'active' : 'dismissed';
          this.updateMenuBadge();

          this.notify(
            decision === 'APPROVE'
              ? 'Access request approved. Session is now active.'
              : 'Access request denied.',
            'success'
          );
        },
        error: error => {
          console.error('Unable to update access request:', error);

          request.status = previousStatus;
          this.updateMenuBadge();

          this.notify(
            error?.error?.message ||
              error?.error?.data?.error ||
              'Unable to update request. Please try again.',
            'danger'
          );
        }
      });
  }

  private upsertRequest(source: any): void {
    const incoming = this.toConsentRequest(source);

    if (!incoming.sessionId) {
      return;
    }

    const remaining = this.requests.filter(
      request => request.sessionId !== incoming.sessionId
    );

    this.requests = this.sortRequests([incoming, ...remaining]);
  }

  private toConsentRequest(request: any): ConsentRequest {
    const rawStatus = String(request?.accessStatus ?? request?.status ?? 'PENDING').toUpperCase();

    const notificationReceivedAt =
      request?.notifiedAt ??
      request?.assignedDate ??
      request?.createdAt ??
      request?.requestedAt;

    const accessGrantedAt =
      rawStatus === 'APPROVED' || rawStatus === 'COMPLETED'
        ? request?.respondedAt
        : undefined;

    const completedAt = request?.accessEndedAt || request?.revokedAt;
    const status = this.toDisplayStatus(rawStatus, request?.endReason);

    return {
      sessionId:
        request?.sessionId ??
        request?.notificationId ??
        request?.requestId ??
        request?.id ??
        '',
      doctorName: request?.doctorName ?? request?.doctorId ?? 'Doctor',
      doctorId: request?.doctorId,
      patientId: request?.patientId,
      reason:
        request?.requestMessage ??
        request?.reason ??
        'Doctor requested access to your medical profile.',
      allowPrevious: Boolean(
        request?.canViewPreviousRecords ??
          request?.allowPreviousMedicalRecords ??
          request?.allowPrevious
      ),
      read: request?.read === true,

      rawStatus,
      status,

      requestedAt: notificationReceivedAt,
      respondedAt: accessGrantedAt,
      accessEndedAt: completedAt,
      expiresAt: request?.expiresAt,

      displayNotificationTime: this.toDisplayTime(notificationReceivedAt),
      displayGrantedTime: this.toDisplayTime(accessGrantedAt),
      displayCompletedTime: this.toDisplayTime(completedAt),
      displayExpiryTime: this.toDisplayTime(request?.expiresAt),

      endedBy: request?.endedBy,
      endReason: request?.endReason,
      rejectionReason: request?.rejectionReason,
      accessDurationDays: request?.accessDurationDays
    };
  }

  private dedupeRequests(requests: ConsentRequest[]): ConsentRequest[] {
    const latestBySession = new Map<string, ConsentRequest>();

    requests.forEach(request => {
      if (!request.sessionId) {
        return;
      }

      const existing = latestBySession.get(request.sessionId);

      if (!existing || this.requestTime(request) >= this.requestTime(existing)) {
        latestBySession.set(request.sessionId, request);
      }
    });

    return Array.from(latestBySession.values());
  }

  private sortRequests(requests: ConsentRequest[]): ConsentRequest[] {
    return [...requests].sort((first, second) => this.requestTime(second) - this.requestTime(first));
  }

  private requestTime(request: ConsentRequest): number {
    const value =
      request.accessEndedAt ??
      request.respondedAt ??
      request.requestedAt ??
      request.expiresAt;

    if (!value) {
      return 0;
    }

    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private updateMenuBadge(): void {
    this.menuItems = this.menuItems.map(item => {
      if (item.route === '/patient/notifications') {
        return {
          ...item,
          badgeCount: this.newCount
        };
      }

      return item;
    });
  }

  private notify(message: string, type: 'success' | 'danger' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    window.setTimeout(() => {
      this.showToast = false;
    }, 2600);
  }

  private toDisplayStatus(status: string, endReason?: string): ConsentRequestStatus {
    const normalized = String(status ?? '').toUpperCase();

    if (normalized === 'PENDING') {
      return 'New';
    }

    if (normalized === 'APPROVED') {
      return 'Active Session';
    }

    if (normalized === 'REJECTED' || normalized === 'DENIED') {
      return 'Dismissed';
    }

    if (normalized === 'COMPLETED') {
      return this.isDismissedReason(endReason) ? 'Dismissed' : 'Completed';
    }

    if (normalized === 'REVOKED') {
      return 'Revoked';
    }

    if (normalized === 'EXPIRED') {
      return 'Expired';
    }

    return 'New';
  }

  private isDismissedReason(endReason?: string): boolean {
    const reason = String(endReason ?? '').toLowerCase();

    return (
      reason.includes('dismiss') ||
      reason.includes('ended approved access session') ||
      reason.includes('without editing')
    );
  }

  private toDisplayTime(value?: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  private refreshPatientPhoto(): void {
    this.patientPhoto = localStorage.getItem(this.photoStorageKey) || '';
  }
}