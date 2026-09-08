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

interface DashboardStat {
  label: string;
  value: number;
  helper: string;
  icon: string;
}

interface WorkflowLink {
  title: string;
  text: string;
  route: string;
  label: string;
}

@Component({
  selector: 'app-doctor-dashboard',
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
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  isLoading = true;
  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'success';

  readonly workflowLinks: WorkflowLink[] = [
    {
      title: 'Emergency Lookup',
      text: 'Search patient emergency details quickly using patient ID or profile information.',
      route: '/doctor/emergency-lookup',
      label: 'Open Lookup'
    },
    {
      title: 'Patient Care Queue',
      text: 'Review pending, approved, and completed access sessions from one clinical queue.',
      route: '/doctor/patient-care',
      label: 'View Queue'
    },
    {
      title: 'Notifications',
      text: 'Track patient approval, denial, reminders, and session completion updates.',
      route: '/doctor/notifications',
      label: 'View Updates'
    }
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
    return this.notifications.filter(notification => notification.unread).length;
  }

  get pendingCount(): number {
    return this.notifications.filter(item => this.statusOf(item) === 'PENDING').length;
  }

  get approvedCount(): number {
    return this.notifications.filter(item => this.statusOf(item) === 'APPROVED' && !item.accessEndedAt).length;
  }

  get completedCount(): number {
    return this.notifications.filter(item => this.statusOf(item) === 'COMPLETED').length;
  }

  get deniedCount(): number {
    return this.notifications.filter(item => ['REJECTED', 'DENIED'].includes(this.statusOf(item))).length;
  }

  get uniquePatientCount(): number {
    const patients = new Set<string>();

    this.notifications.forEach(item => {
      if (item.patientId && ['APPROVED', 'COMPLETED'].includes(this.statusOf(item))) {
        patients.add(item.patientId);
      }
    });

    return patients.size;
  }

  get dashboardStats(): DashboardStat[] {
    return [
      {
        label: 'Patients Treated',
        value: this.uniquePatientCount,
        helper: 'Approved or completed care sessions',
        icon: '✚'
      },
      {
        label: 'Pending Consent',
        value: this.pendingCount,
        helper: 'Waiting for patient decision',
        icon: '⏳'
      },
      {
        label: 'Active Sessions',
        value: this.approvedCount,
        helper: 'Ready for medical profile update',
        icon: '●'
      },
      {
        label: 'Completed Visits',
        value: this.completedCount,
        helper: 'Medical profile updates saved',
        icon: '✓'
      }
    ];
  }

  get recentNotifications(): AppNotification[] {
    return this.notifications.slice(0, 4);
  }

  updateSidebarItems(): void {
    this.sidebarItems = [
      { label: 'Dashboard', icon: 'D', route: '/doctor/home', exact: true },
      { label: 'Emergency Lookup', icon: 'E', route: '/doctor/emergency-lookup', exact: true },
      { label: 'Patient Care', icon: 'C', route: '/doctor/patient-care', badgeCount: this.approvedCount + this.pendingCount, exact: true },
      { label: 'Doctor Profile', icon: 'P', route: '/doctor/profile', exact: true },
      { label: 'Notifications', icon: 'N', route: '/doctor/notifications', badgeCount: this.unreadCount, exact: true },
      { label: 'Help & Support', icon: 'H', route: '/doctor/support', exact: true }
    ];
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
        console.error('Unable to load doctor dashboard notifications:', error);
        this.isLoading = false;
        this.showMessage('Unable to load doctor dashboard data.', 'danger');
      }
    });
  }

  onAccessRequestSent(message: string): void {
    this.showMessage(this.normalizeAccessRequestMessage(message), 'success');
    this.reloadNotifications();
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

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  sendReminder(notification: AppNotification): void {
    if (!notification.sessionId) {
      this.showMessage('Unable to send reminder because approved access details are missing.', 'danger');
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

  openApprovedProfile(notification: AppNotification): void {
    if (!notification.sessionId || !notification.patientId) {
      this.showMessage('Approved access or patient details are missing.', 'danger');
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

  formatStatus(notification: AppNotification): string {
    const status = this.statusOf(notification);

    if (status === 'APPROVED' && !notification.accessEndedAt) {
      return 'Approved / Active';
    }

    if (status === 'PENDING') {
      return 'Pending patient consent';
    }

    if (status === 'COMPLETED') {
      return 'Completed';
    }

    if (status === 'REJECTED' || status === 'DENIED') {
      return 'Denied';
    }

    return status || 'Update';
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