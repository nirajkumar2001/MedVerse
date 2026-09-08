import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AppNotification } from '../../../core/models/app-notification.model';
import { Doctor } from '../../../core/models/doctor.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { AuthService } from '../../../core/services/auth.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AccessRequestService } from '../../../core/services/access-request.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { NotificationCardComponent } from '../../../shared/components/notification-card/notification-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';

type NotificationFilter = 'new' | 'active' | 'dismissed' | 'completed';

@Component({
  selector: 'app-doctor-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    LogoutConfirmModalComponent,
    ConfirmModalComponent,
    NotificationCardComponent,
    EmptyStateComponent,
    ToastMessageComponent
  ],
  templateUrl: './doctor-notifications.component.html',
  styleUrl: './doctor-notifications.component.css'
})
export class DoctorNotificationsComponent implements OnInit, OnDestroy {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  activeFilter: NotificationFilter = 'new';

  showLogoutModal = false;
  showEndSessionModal = false;
  showMarkAllModal = false;

  pendingEndSessionNotification: AppNotification | null = null;

  showToast = false;
  toastMessage = '';

  private subscriptions = new Subscription();

  constructor(
    private doctorService: DoctorService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private accessRequestService: AccessRequestService,
    private router: Router
  ) {
    this.doctor = this.doctorService.getCurrentDoctor();
    this.updateSidebarItems();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.doctorService.getDoctor().subscribe((doctor: Doctor) => {
        this.doctor = doctor;
      })
    );

    this.subscriptions.add(
      this.notificationService.getNotifications().subscribe((notifications: AppNotification[]) => {
        this.notifications = notifications;
        this.updateSidebarItems();
      })
    );

    this.subscriptions.add(
      this.notificationService.loadDoctorNotifications().subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter(notification => notification.unread).length;
  }

  get newCount(): number {
    return this.notifications.filter(notification => this.isNewNotification(notification)).length;
  }

  get activeCount(): number {
    return this.notifications.filter(notification => this.isActiveSessionNotification(notification)).length;
  }

  get dismissedCount(): number {
    return this.notifications.filter(notification => this.isDismissedNotification(notification)).length;
  }

  get completedCount(): number {
    return this.notifications.filter(notification => this.isCompletedNotification(notification)).length;
  }

  get filteredNotifications(): AppNotification[] {
    if (this.activeFilter === 'new') {
      return this.notifications.filter(notification => this.isNewNotification(notification));
    }

    if (this.activeFilter === 'active') {
      return this.notifications.filter(notification => this.isActiveSessionNotification(notification));
    }

    if (this.activeFilter === 'dismissed') {
      return this.notifications.filter(notification => this.isDismissedNotification(notification));
    }

    if (this.activeFilter === 'completed') {
      return this.notifications.filter(notification => this.isCompletedNotification(notification));
    }

    return this.notifications;
  }

  updateSidebarItems(): void {
    this.sidebarItems = [
      { label: 'Dashboard', icon: 'D', route: '/doctor/home', exact: true },
      { label: 'Emergency Lookup', icon: 'E', route: '/doctor/emergency-lookup', exact: true },
      { label: 'Patient Care', icon: 'C', route: '/doctor/patient-care', badgeCount: this.unreadCount, exact: true },
      { label: 'Doctor Profile', icon: 'P', route: '/doctor/profile', exact: true },
      { label: 'Notifications', icon: 'N', route: '/doctor/notifications', badgeCount: this.unreadCount, exact: true },
      { label: 'Help & Support', icon: 'H', route: '/doctor/support', exact: true }
    ];
  }

  setFilter(filter: NotificationFilter): void {
    this.activeFilter = filter;
  }

  requestEndSession(notification: AppNotification): void {
    if (!notification.sessionId) {
      this.toastMessage = 'Unable to end session because session details are missing.';
      this.showToastMessage();
      return;
    }

    this.pendingEndSessionNotification = notification;
    this.showEndSessionModal = true;
  }

  closeEndSessionModal(): void {
    this.pendingEndSessionNotification = null;
    this.showEndSessionModal = false;
  }

  confirmEndSession(): void {
    const notification = this.pendingEndSessionNotification;

    if (!notification?.sessionId) {
      this.closeEndSessionModal();
      this.toastMessage = 'Unable to end session because session details are missing.';
      this.showToastMessage();
      return;
    }

    this.showEndSessionModal = false;

    this.accessRequestService
      .endSession(notification.sessionId, 'Doctor ended approved access session')
      .subscribe({
        next: response => {
          const updatedNotification = response?.data ?? response;

          if (updatedNotification) {
            this.notificationService.upsertFromBackend(updatedNotification, true);
          }

          this.notificationService.loadDoctorNotifications().subscribe();

          this.pendingEndSessionNotification = null;
          this.activeFilter = 'dismissed';

          this.toastMessage = 'Access session ended successfully.';
          this.showToastMessage();
        },
        error: error => {
          console.error('Error ending session:', error);

          this.pendingEndSessionNotification = null;

          this.toastMessage =
            error?.error?.message ||
            error?.error?.data?.error ||
            'Unable to end session. Please try again.';

          this.showToastMessage();
        }
      });
  }

  openMarkAllModal(): void {
    this.showMarkAllModal = true;
  }

  closeMarkAllModal(): void {
    this.showMarkAllModal = false;
  }

  confirmMarkAllRead(): void {
    this.notificationService.markAllAsRead();
    this.showMarkAllModal = false;

    this.toastMessage = 'All notifications marked as read.';
    this.showToastMessage();
  }

  onNotificationAction(notification: AppNotification): void {
    this.notificationService.markAsRead(notification.id);

    if (notification.sessionId && notification.patientId) {
      this.router.navigate(['/doctor/approved-patient-profile'], {
        queryParams: {
          sessionId: notification.sessionId,
          patientId: notification.patientId,
          previous: notification.canViewPreviousRecords ? 'true' : 'false'
        }
      });
      return;
    }

    this.toastMessage = 'Unable to open patient profile because session details are missing.';
    this.showToastMessage();
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

  private isNewNotification(notification: AppNotification): boolean {
    return notification.accessStatus === 'PENDING';
  }

  private isActiveSessionNotification(notification: AppNotification): boolean {
    return notification.accessStatus === 'APPROVED' && !notification.accessEndedAt;
  }

  private isDismissedNotification(notification: AppNotification): boolean {
    const status = String(notification.accessStatus ?? '').toUpperCase();
    const message = String(notification.message ?? '').toLowerCase();

    if (status === 'REJECTED' || status === 'DENIED') {
      return true;
    }

    if (status !== 'COMPLETED') {
      return false;
    }

    return (
      message.includes('dismiss') ||
      message.includes('ended approved access session') ||
      message.includes('ended access session') ||
      message.includes('without editing')
    );
  }

  private isCompletedNotification(notification: AppNotification): boolean {
    if (notification.accessStatus !== 'COMPLETED') {
      return false;
    }

    return !this.isDismissedNotification(notification);
  }

  private showToastMessage(): void {
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 2800);
  }
}