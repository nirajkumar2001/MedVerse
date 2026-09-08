import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { Doctor } from '../../../core/models/doctor.model';
import { AppNotification } from '../../../core/models/app-notification.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { AuthService } from '../../../core/services/auth.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { NotificationService } from '../../../core/services/notification.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';

import { DoctorProfileFormComponent } from '../../components/doctor-profile-form/doctor-profile-form.component';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [
    CommonModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    LogoutConfirmModalComponent,
    ToastMessageComponent,
    HealthcareFooterComponent,
    DoctorProfileFormComponent
  ],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css'
})
export class DoctorProfileComponent {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  showLogoutModal = false;
  showToast = false;
  toastMessage = '';

  constructor(
    private doctorService: DoctorService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.doctor = this.doctorService.getCurrentDoctor();
    this.notifications = this.notificationService.getCurrentNotifications();
    this.updateSidebarItems();
    this.loadBackendData();
  }

  get unreadCount(): number {
    return this.notifications.filter(function (notification: AppNotification): boolean {
      return notification.unread;
    }).length;
  }

  get notificationCount(): number {
    return this.notifications.length;
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

  saveDoctorProfile(updatedDoctor: Doctor): void {
    this.doctorService.saveDoctorProfile(updatedDoctor).subscribe((doctor: Doctor) => {
      this.doctor = doctor;

      this.toastMessage = 'Doctor profile updated successfully.';
      this.showToast = true;

      window.setTimeout(this.hideToast.bind(this), 2800);
    });
  }

  onProfileCancel(): void {
    this.toastMessage = 'Profile changes were cancelled.';
    this.showToast = true;

    window.setTimeout(this.hideToast.bind(this), 2200);
  }

  private hideToast(): void {
    this.showToast = false;
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

  private loadBackendData(): void {
    this.doctorService.getDoctor().subscribe((doctor: Doctor) => {
      this.doctor = doctor;
    });

    this.notificationService.loadDoctorNotifications().subscribe((notifications: AppNotification[]) => {
      this.notifications = notifications;
      this.updateSidebarItems();
    });
  }
}
