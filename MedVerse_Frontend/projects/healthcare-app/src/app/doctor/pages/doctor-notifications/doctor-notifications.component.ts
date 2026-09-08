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

type NotificationFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'DENIED';

@Component({
  selector: 'app-doctor-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    LogoutConfirmModalComponent,
    ToastMessageComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './doctor-notifications.component.html',
  styleUrls: ['./doctor-notifications.component.css']
})
export class DoctorNotificationsComponent implements OnInit, OnDestroy {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  activeFilter: NotificationFilter = 'ALL';
  isLoading = true;
  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'success';

  readonly filters: { key: NotificationFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'DENIED', label: 'Denied' }
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

    this.reloadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter(item => item.unread).length;
  }

  get pendingCount(): number {
    return this.countByStatus('PENDING');
  }

  get approvedCount(): number {
    return this.notifications.filter(item => this.statusOf(item) === 'APPROVED' && !item.accessEndedAt).length;
  }

  get completedCount(): number {
    return this.countByStatus('COMPLETED');
  }

  get deniedCount(): number {
    return this.notifications.filter(item => ['REJECTED', 'DENIED'].includes(this.statusOf(item))).length;
  }

  get filteredNotifications(): AppNotification[] {
    if (this.activeFilter === 'ALL') {
      return this.notifications;
    }

    if (this.activeFilter === 'DENIED') {
      return this.notifications.filter(item => ['REJECTED', 'DENIED'].includes(this.statusOf(item)));
    }

    if (this.activeFilter === 'APPROVED') {
      return this.notifications.filter(item => this.statusOf(item) === 'APPROVED' && !item.accessEndedAt);
    }

    return this.notifications.filter(item => this.statusOf(item) === this.activeFilter);
  }

  updateSidebarItems(): void {
    this.sidebarItems = [
      { label: 'Dashboard', icon: 'D', route: '/doctor/home', exact: true },
      { label: 'Emergency Lookup', icon: 'E', route: '/doctor/emergency-lookup', exact: true },
      { label: 'Patient Care', icon: 'C', route: '/doctor/patient-care', badgeCount: this.pendingCount + this.approvedCount, exact: true },
      { label: 'Doctor Profile', icon: 'P', route: '/doctor/profile', exact: true },
      { label: 'Notifications', icon: 'N', route: '/doctor/notifications', badgeCount: this.unreadCount, exact: true },
      { label: 'Help & Support', icon: 'H', route: '/doctor/support', exact: true }
    ];
  }

  setFilter(filter: NotificationFilter): void {
    this.activeFilter = filter;
  }

  reloadNotifications(): void {
    this.isLoading = true;

    this.notificationService.loadDoctorNotifications(false).subscribe({
      next: notifications => {
        this.notifications = this.sortNotifications(notifications);
        this.updateSidebarItems();
        this.isLoading = false;
      },
      error: error => {
        console.error('Unable to load doctor notifications:', error);
        this.isLoading = false;
        this.showMessage('Unable to load notifications.', 'danger');
      }
    });
  }

  markAsRead(notification: AppNotification): void {
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
    this.showMessage('All notifications marked as read.', 'success');
  }

  openApprovedProfile(notification: AppNotification): void {
    if (!notification.sessionId || !notification.patientId) {
      this.showMessage('Approved access details are missing for this notification.', 'danger');
      return;
    }

    if (this.statusOf(notification) !== 'APPROVED' || notification.accessEndedAt) {
      this.showMessage('Only active approved access can be opened for editing.', 'info');
      return;
    }

    const context = {
      sessionId: notification.sessionId,
      patientId: notification.patientId,
      previous: Boolean(notification.canViewPreviousRecords),
      storedAt: Date.now()
    };

    this.storeApprovedProfileContext(context);

    this.router.navigate(['/doctor/approved-patient-profile'], {
      state: { approvedProfileContext: context }
    });
  }

  sendReminder(notification: AppNotification): void {
    if (!notification.sessionId) {
      this.showMessage('Approved access details are missing.', 'danger');
      return;
    }

    this.accessRequestService.sendReminder(notification.sessionId).subscribe({
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

  endApprovedSession(notification: AppNotification): void {
    if (!notification.sessionId) {
      this.showMessage('Approved access details are missing.', 'danger');
      return;
    }

    this.accessRequestService
      .endSession(notification.sessionId, 'Doctor ended approved access session without editing patient profile')
      .subscribe({
        next: response => {
          const updated = response?.data ?? response;
          if (updated) {
            this.notificationService.upsertFromBackend(updated, false);
          }
          this.reloadNotifications();
          this.showMessage('Approved access ended.', 'success');
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

  statusOf(notification: AppNotification): string {
    return String(notification.accessStatus || '').toUpperCase();
  }

  statusLabel(notification: AppNotification): string {
    const status = this.statusOf(notification);

    if (status === 'APPROVED' && !notification.accessEndedAt) {
      return 'Approved / Active';
    }

    if (status === 'PENDING') {
      return 'Pending Consent';
    }

    if (status === 'COMPLETED') {
      return 'Completed';
    }

    if (status === 'REJECTED' || status === 'DENIED') {
      return 'Denied';
    }

    return status || 'Update';
  }

  trackByNotification(_: number, item: AppNotification): string | number {
    return item.sessionId || item.id;
  }

  private countByStatus(status: string): number {
    return this.notifications.filter(item => this.statusOf(item) === status).length;
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