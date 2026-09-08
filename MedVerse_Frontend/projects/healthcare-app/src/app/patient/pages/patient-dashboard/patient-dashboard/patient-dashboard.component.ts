import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
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
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';

interface DashboardAccessRequest {
  sessionId: string;
  doctorName: string;
  reason: string;
  allowPrevious: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  requestedAt?: Date | string;
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutSidebarComponent,
    LogoutConfirmModalComponent,
    PageHeaderComponent,
    StatCardComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css'
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  private readonly photoStorageKey = 'medverse-patient-profile-photo';
  private readonly subscriptions = new Subscription();

  patient!: Patient;
  patientPhoto = localStorage.getItem(this.photoStorageKey) || '';

  showLogoutModal = false;
  isRequestsLoading = true;

  accessRequests: DashboardAccessRequest[] = [];

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

  constructor(
    private readonly patientService: PatientService,
    private readonly accessRequestService: AccessRequestService,
    private readonly authService: AuthService,
    private readonly realtime: RealtimeNotificationService
  ) {}

  ngOnInit(): void {
    this.realtime.connect();

    this.subscriptions.add(
      this.patientService.getMyProfile().subscribe(patient => {
        this.patient = patient;
      })
    );

    this.subscriptions.add(
      this.realtime.accessNotification$.subscribe(message => {
        if (message) {
          this.upsertAccessRequest(message);
          this.updateAccessRequestBadge();
          this.isRequestsLoading = false;
        }
      })
    );

    this.refreshPatientPhoto();
    window.addEventListener('medverse-profile-photo-updated', this.photoUpdateHandler);

    this.loadAccessRequests();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    window.removeEventListener('medverse-profile-photo-updated', this.photoUpdateHandler);
  }

  get pendingAccessCount(): number {
    return this.accessRequests.filter(request => request.status === 'Pending').length;
  }

  get approvedAccessCount(): number {
    return this.accessRequests.filter(request => request.status === 'Approved').length;
  }

  get completedAccessCount(): number {
    return this.accessRequests.filter(request => request.status === 'Completed').length;
  }

  get latestAccessRequest(): DashboardAccessRequest | undefined {
    return this.accessRequests[0];
  }

  get recentAccessActivities(): DashboardAccessRequest[] {
    return this.accessRequests.slice(0, 3);
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

  private refreshPatientPhoto(): void {
    this.patientPhoto = localStorage.getItem(this.photoStorageKey) || '';
  }

  private loadAccessRequests(): void {
    this.isRequestsLoading = true;

    this.subscriptions.add(
      this.accessRequestService.getForPatient(false).subscribe({
        next: requests => {
          this.accessRequests = this.sortRequests(
            (requests ?? []).map((request: any) => this.toDashboardAccessRequest(request))
          );

          this.isRequestsLoading = false;
          this.updateAccessRequestBadge();
        },
        error: error => {
          console.error('Unable to load patient access requests:', error);

          this.accessRequests = [];
          this.isRequestsLoading = false;
          this.updateAccessRequestBadge();
        }
      })
    );
  }

  private upsertAccessRequest(source: any): void {
    const incoming = this.toDashboardAccessRequest(source);

    if (!incoming.sessionId) {
      return;
    }

    const remaining = this.accessRequests.filter(
      request => request.sessionId !== incoming.sessionId
    );

    this.accessRequests = this.sortRequests([incoming, ...remaining]);
  }

  private updateAccessRequestBadge(): void {
    this.menuItems = this.menuItems.map(item => {
      if (item.label === 'Access Requests') {
        return { ...item, badgeCount: this.pendingAccessCount };
      }

      return item;
    });
  }

  private toDashboardAccessRequest(request: any): DashboardAccessRequest {
    const status = request?.accessStatus ?? request?.status;

    return {
      sessionId: request?.sessionId ?? '',
      doctorName: request?.doctorName ?? request?.doctorId ?? 'Doctor',
      reason: request?.requestMessage ?? request?.reason ?? 'Medical profile access request',
      allowPrevious: Boolean(
        request?.canViewPreviousRecords ??
          request?.allowPreviousMedicalRecords ??
          request?.allowPrevious
      ),
      status: this.toStatus(status),
      requestedAt:
        request?.accessEndedAt ??
        request?.respondedAt ??
        request?.notifiedAt ??
        request?.assignedDate ??
        request?.createdAt ??
        request?.requestedAt
    };
  }

  private sortRequests(requests: DashboardAccessRequest[]): DashboardAccessRequest[] {
    return [...requests].sort((first, second) => {
      return this.requestTime(second) - this.requestTime(first);
    });
  }

  private requestTime(request: DashboardAccessRequest): number {
    if (!request.requestedAt) {
      return 0;
    }

    const time = new Date(request.requestedAt).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private toStatus(status: string | undefined): DashboardAccessRequest['status'] {
    const normalizedStatus = String(status ?? '').toUpperCase();

    if (normalizedStatus === 'APPROVED') {
      return 'Approved';
    }

    if (normalizedStatus === 'COMPLETED') {
      return 'Completed';
    }

    if (normalizedStatus === 'REJECTED' || normalizedStatus === 'DENIED') {
      return 'Rejected';
    }

    return 'Pending';
  }
}