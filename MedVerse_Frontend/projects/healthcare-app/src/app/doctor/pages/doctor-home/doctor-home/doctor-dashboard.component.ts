import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
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
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { NotificationCardComponent } from '../../../shared/components/notification-card/notification-card.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';

import { AccessRequestFormComponent } from '../../components/access-request-form/access-request-form.component';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    LogoutConfirmModalComponent,
    StatCardComponent,
    NotificationCardComponent,
    ToastMessageComponent,
    HealthcareFooterComponent,
    AccessRequestFormComponent
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css'
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  showLogoutModal = false;
  showToast = false;
  toastMessage = '';

  private subscriptions = new Subscription();

  constructor(
    private doctorService: DoctorService,
    private notificationService: NotificationService,
    private accessRequestService: AccessRequestService,
    private authService: AuthService
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
    return this.notifications.filter(
      (notification: AppNotification) => notification.unread
    ).length;
  }

  get recentNotifications(): AppNotification[] {
    return this.notifications.slice(0, 3);
  }
  get pendingRequestCount(): number {
  return this.notifications.filter(
    notification => notification.accessStatus === 'PENDING'
  ).length;
}

get approvedSessionCount(): number {
  return this.notifications.filter(
    notification => notification.accessStatus === 'APPROVED'
  ).length;
}

get completedSessionCount(): number {
  return this.notifications.filter(
    notification => notification.accessStatus === 'COMPLETED'
  ).length;
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

  onAccessRequestSent(message: string): void {
    this.toastMessage = message;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  dismissNotification(notificationId: number): void {
    this.notificationService.dismissNotification(notificationId);
  }

  onEndSession(notification: AppNotification): void {
    if (!notification.sessionId) {
      this.toastMessage = 'Unable to end session because session ID is missing.';
      this.showToastMessage();
      return;
    }

    if (notification.accessStatus !== 'APPROVED') {
      this.toastMessage = 'Only approved sessions can be ended.';
      this.showToastMessage();
      return;
    }

    this.accessRequestService.endSession(
      notification.sessionId,
      'Doctor ended approved access session without editing patient profile'
    ).subscribe({
      next: (res) => {
        const updatedNotification = res?.data ?? res;

        this.notificationService.upsertFromBackend(updatedNotification, true);

        this.toastMessage = 'Access session ended successfully.';
        this.showToastMessage();

        this.notificationService.loadDoctorNotifications().subscribe();
      },
      error: (err) => {
        console.error('Error ending session:', err);

        this.toastMessage =
          err?.error?.message ||
          err?.error?.data?.error ||
          'Unable to end session. Please try again.';

        this.showToastMessage();
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

  private showToastMessage(): void {
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}