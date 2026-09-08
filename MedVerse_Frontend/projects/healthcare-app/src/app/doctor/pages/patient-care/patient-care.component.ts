import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { Doctor } from '../../../core/models/doctor.model';
import { AppNotification } from '../../../core/models/app-notification.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { AuthService } from '../../../core/services/auth.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AccessRequestService } from '../../../core/services/access-request.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';
import { AccessRequestFormComponent } from '../../components/access-request-form/access-request-form.component';

type CareFilter = 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'DENIED' | 'ALL';

@Component({
  selector: 'app-patient-care',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    LogoutConfirmModalComponent,
    ToastMessageComponent,
    HealthcareFooterComponent,
    AccessRequestFormComponent
  ],
  templateUrl: './patient-care.component.html',
  styleUrls: ['./patient-care.component.css']
})
export class PatientCareComponent implements OnInit, OnDestroy {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  activeFilter: CareFilter = 'ACTIVE';
  isLoading = true;
  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'success';

  readonly filters: { key: CareFilter; label: string }[] = [
    { key: 'ACTIVE', label: 'Active Sessions' },
    { key: 'PENDING', label: 'Pending Consent' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'DENIED', label: 'Denied' },
    { key: 'ALL', label: 'All' }
  ];

  private readonly subscriptions = new Subscription();
  private readonly approvedProfileContextKey = 'medverse-approved-profile-context';

  constructor(
    private readonly doctorService: DoctorService,
    private readonly notificationService: NotificationService,
    private readonly accessRequestService: AccessRequestService,
    private readonly authService: AuthService,
    private readonly router: Router
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
        this.notifications = this.sortNotifications(notifications);
        this.updateSidebarItems();
      })
    );

    this.reloadSessions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter(item => item.unread).length;
  }

  get activeSessions(): AppNotification[] {
    return this.notifications.filter(item => this.statusOf(item) === 'APPROVED' && !item.accessEndedAt);
  }

  get pendingSessions(): AppNotification[] {
    return this.notifications.filter(item => this.statusOf(item) === 'PENDING');
  }

  get completedSessions(): AppNotification[] {
    return this.notifications.filter(item => this.statusOf(item) === 'COMPLETED');
  }

  get deniedSessions(): AppNotification[] {
    return this.notifications.filter(item => ['REJECTED', 'DENIED'].includes(this.statusOf(item)));
  }

  get visibleSessions(): AppNotification[] {
    if (this.activeFilter === 'ACTIVE') {
      return this.activeSessions;
    }

    if (this.activeFilter === 'PENDING') {
      return this.pendingSessions;
    }

    if (this.activeFilter === 'COMPLETED') {
      return this.completedSessions;
    }

    if (this.activeFilter === 'DENIED') {
      return this.deniedSessions;
    }

    return this.notifications;
  }

  updateSidebarItems(): void {
    this.sidebarItems = [
      { label: 'Dashboard', icon: 'D', route: '/doctor/home', exact: true },
      { label: 'Emergency Lookup', icon: 'E', route: '/doctor/emergency-lookup', exact: true },
      { label: 'Patient Care', icon: 'C', route: '/doctor/patient-care', badgeCount: this.activeSessions.length + this.pendingSessions.length, exact: true },
      { label: 'Doctor Profile', icon: 'P', route: '/doctor/profile', exact: true },
      { label: 'Notifications', icon: 'N', route: '/doctor/notifications', badgeCount: this.unreadCount, exact: true },
      { label: 'Help & Support', icon: 'H', route: '/doctor/support', exact: true }
    ];
  }

  setFilter(filter: CareFilter): void {
    this.activeFilter = filter;
  }

  reloadSessions(): void {
    this.isLoading = true;

    this.notificationService.loadDoctorNotifications(false).subscribe({
      next: notifications => {
        this.notifications = this.sortNotifications(notifications);
        this.updateSidebarItems();
        this.isLoading = false;
      },
      error: error => {
        console.error('Unable to load patient care sessions:', error);
        this.isLoading = false;
        this.showMessage('Unable to load patient care sessions.', 'danger');
      }
    });
  }

  onAccessRequestSent(message: string): void {
    this.showMessage(this.normalizeAccessRequestMessage(message), 'success');
    this.reloadSessions();
  }
  private normalizeAccessRequestMessage(message: unknown): string {
  const cleanMessage = String(message || '').trim().toLowerCase();

  if (
    !cleanMessage ||
    cleanMessage.includes('accessnotification created') ||
    cleanMessage.includes('accessnotification curated') ||
    cleanMessage.includes('[object object]')
  ) {
    return 'Access notification sent to patient.';
  }

  return String(message);
}

  openApprovedProfile(session: AppNotification): void {
    if (!session.sessionId || !session.patientId) {
      this.showMessage('Approved access or patient details are missing.', 'danger');
      return;
    }

    const context = {
      sessionId: session.sessionId,
      patientId: session.patientId,
      previous: Boolean(session.canViewPreviousRecords),
      storedAt: Date.now()
    };

    this.storeApprovedProfileContext(context);

    this.router.navigate(['/doctor/approved-patient-profile'], {
      state: { approvedProfileContext: context }
    });
  }

  sendReminder(session: AppNotification): void {
    if (!session.sessionId) {
      this.showMessage('Approved access details are missing.', 'danger');
      return;
    }

    this.accessRequestService.sendReminder(session.sessionId).subscribe({
      next: response => {
        const updated = response?.data ?? response;
        if (updated) {
          this.notificationService.upsertFromBackend(updated, false);
        }
        this.showMessage('Reminder sent to patient.', 'success');
      },
      error: error => {
        console.error('Unable to send reminder:', error);
        this.showMessage(error?.error?.message || 'Unable to send reminder.', 'danger');
      }
    });
  }

  endSession(session: AppNotification): void {
    if (!session.sessionId) {
      this.showMessage('Approved access details are missing.', 'danger');
      return;
    }

    this.accessRequestService.endSession(session.sessionId, 'Doctor ended approved access without editing patient profile').subscribe({
      next: response => {
        const updated = response?.data ?? response;
        if (updated) {
          this.notificationService.upsertFromBackend(updated, false);
        }
        this.reloadSessions();
        this.showMessage('Approved access ended successfully.', 'success');
      },
      error: error => {
        console.error('Unable to end session:', error);
        this.showMessage(error?.error?.message || 'Unable to end session.', 'danger');
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

  statusOf(session: AppNotification): string {
    return String(session.accessStatus || '').toUpperCase();
  }

  statusLabel(session: AppNotification): string {
    const status = this.statusOf(session);

    if (status === 'APPROVED' && !session.accessEndedAt) {
      return 'Active approved access';
    }

    if (status === 'PENDING') {
      return 'Waiting for consent';
    }

    if (status === 'COMPLETED') {
      return 'Completed';
    }

    if (status === 'DENIED' || status === 'REJECTED') {
      return 'Denied';
    }

    return status || 'Access';
  }

  trackBySession(_: number, session: AppNotification): string | number {
    return session.sessionId || session.id;
  }

  private sortNotifications(notifications: AppNotification[]): AppNotification[] {
    return [...notifications].sort((a, b) => {
      const first = new Date(a.completedAt || a.accessGrantedAt || a.notificationReceivedAt || a.time || 0).getTime();
      const second = new Date(b.completedAt || b.accessGrantedAt || b.notificationReceivedAt || b.time || 0).getTime();
      return second - first;
    });
  }

  private storeApprovedProfileContext(context: any): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    try {
      sessionStorage.setItem(this.approvedProfileContextKey, JSON.stringify(context));
    } catch {
      // Non-blocking. Navigation state still carries the context for the next page.
    }
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