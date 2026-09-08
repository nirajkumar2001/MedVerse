import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Patient } from '../../../core/models/patient.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { AccessRequestService } from '../../../core/services/access-request.service';
import { PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { RealtimeNotificationService } from '../../../core/services/realtime-notification.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type PatientNotificationFilter = 'new' | 'active' | 'dismissed' | 'completed';

type ConsentRequestStatus =
  | 'New'
  | 'Active Session'
  | 'Dismissed'
  | 'Completed';

interface ConsentRequest {
  sessionId: string;
  doctorName: string;
  reason: string;
  allowPrevious: boolean;

  rawStatus: string;
  status: ConsentRequestStatus;

  requestedAt?: string;
  respondedAt?: string;
  accessEndedAt?: string;

  displayNotificationTime?: string;
  displayGrantedTime?: string;
  displayCompletedTime?: string;

  endedBy?: string;
  endReason?: string;
}

@Component({
  selector: 'app-patient-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutSidebarComponent,
    LogoutConfirmModalComponent,
    PageHeaderComponent,
    ToastMessageComponent,
    EmptyStateComponent
  ],
  templateUrl: './patient-notifications.component.html',
  styleUrl: './patient-notifications.component.css'
})
export class PatientNotificationsComponent implements OnInit, OnDestroy {
  private readonly photoStorageKey = 'medverse-patient-profile-photo';

  patient!: Patient;
  patientPhoto = localStorage.getItem(this.photoStorageKey) || '';

  requests: ConsentRequest[] = [];
  activeFilter: PatientNotificationFilter = 'new';

  isLoading = true;

  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'info';

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
      this.patientService.getMyProfile().subscribe((patient: Patient) => {
        this.patient = patient;
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

  get patientPhotoUrl(): string {
    return this.patientPhoto || this.patient?.photoUrl || '';
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

  get filteredRequests(): ConsentRequest[] {
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

  setFilter(filter: PatientNotificationFilter): void {
    this.activeFilter = filter;
  }

  loadRequests(): void {
    this.isLoading = true;

    this.subscriptions.add(
      this.accessRequestService.getForPatient(false).subscribe({
        next: requests => {
          this.requests = this.sortRequests(
            (requests ?? []).map((request: any) => this.toConsentRequest(request))
          );

          this.isLoading = false;
          this.updateMenuBadge();
        },
        error: error => {
          console.error('Unable to load patient access requests:', error);

          this.requests = [];
          this.isLoading = false;
          this.updateMenuBadge();

          this.notify('Unable to load access requests. Please try again.', 'danger');
        }
      })
    );
  }

  approve(request: ConsentRequest): void {
    this.decide(request, 'APPROVE');
  }

  reject(request: ConsentRequest): void {
    this.decide(request, 'DENY');
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
          const updated = (response as any)?.data ?? response;

          if (updated) {
            this.upsertRequest(updated);
          }

          this.activeFilter = 'dismissed';
          this.updateMenuBadge();
          this.notify('Approved session dismissed successfully.', 'success');
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

  private decide(request: ConsentRequest, decision: 'APPROVE' | 'DENY'): void {
    if (!request.sessionId) {
      this.notify('Unable to update request because request details are missing.', 'danger');
      return;
    }

    const previousStatus = request.status;
    request.status = decision === 'APPROVE' ? 'Active Session' : 'Dismissed';
    this.updateMenuBadge();

    this.accessRequestService
      .decide(request.sessionId, decision, request.allowPrevious)
      .subscribe({
        next: response => {
          const updated = (response as any)?.data ?? response;

          if (updated) {
            this.upsertRequest(updated);
          }

          this.activeFilter = decision === 'APPROVE' ? 'active' : 'dismissed';
          this.updateMenuBadge();

          this.notify(
            decision === 'APPROVE'
              ? 'Access request approved. Session is now active.'
              : 'Access request dismissed.',
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
    const rawStatus = String(request?.accessStatus ?? request?.status ?? '').toUpperCase();

    const notificationReceivedAt =
      request?.notifiedAt ??
      request?.assignedDate ??
      request?.createdAt ??
      request?.requestedAt;

    const accessGrantedAt =
      rawStatus === 'APPROVED' || rawStatus === 'COMPLETED'
        ? request?.respondedAt
        : undefined;

    const completedAt = request?.accessEndedAt;

    return {
      sessionId: request?.sessionId ?? '',
      doctorName: request?.doctorName ?? request?.doctorId ?? 'Doctor',
      reason:
        request?.requestMessage ??
        request?.reason ??
        'Medical profile access request',
      allowPrevious: Boolean(
        request?.canViewPreviousRecords ??
          request?.allowPreviousMedicalRecords ??
          request?.allowPrevious
      ),

      rawStatus,
      status: this.toDisplayStatus(rawStatus, request?.endReason),

      requestedAt: notificationReceivedAt,
      respondedAt: accessGrantedAt,
      accessEndedAt: completedAt,

      displayNotificationTime: this.toDisplayTime(notificationReceivedAt),
      displayGrantedTime: this.toDisplayTime(accessGrantedAt),
      displayCompletedTime: this.toDisplayTime(completedAt),

      endedBy: request?.endedBy,
      endReason: request?.endReason
    };
  }

  private sortRequests(requests: ConsentRequest[]): ConsentRequest[] {
    return [...requests].sort((first, second) => {
      return this.requestTime(second) - this.requestTime(first);
    });
  }

  private requestTime(request: ConsentRequest): number {
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

    if (
      normalized === 'APPROVED' ||
      normalized === 'APPROVEDWITHPREVIOUSRECORDS' ||
      normalized === 'APPROVEDPROFILEONLY'
    ) {
      return 'Active Session';
    }

    if (normalized === 'REJECTED' || normalized === 'DENIED') {
      return 'Dismissed';
    }

    if (normalized === 'COMPLETED') {
      return this.isDismissedReason(endReason) ? 'Dismissed' : 'Completed';
    }

    return 'New';
  }

  private isDismissedReason(endReason?: string): boolean {
    const reason = String(endReason ?? '').toLowerCase();

    return (
      reason.includes('dismiss') ||
      reason.includes('ended approved access session') ||
      reason.includes('ended access session') ||
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

  private refreshPatientPhoto(): void {
    this.patientPhoto = localStorage.getItem(this.photoStorageKey) || '';
  }
}