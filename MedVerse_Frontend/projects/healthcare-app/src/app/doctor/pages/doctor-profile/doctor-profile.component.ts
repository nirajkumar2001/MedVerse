import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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
  styleUrls: ['./doctor-profile.component.css']
})
export class DoctorProfileComponent implements OnInit, OnDestroy {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  isLoading = true;
  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'success';

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly doctorService: DoctorService,
    private readonly notificationService: NotificationService,
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
        this.isLoading = false;
      })
    );

    this.subscriptions.add(
      this.notificationService.getNotifications().subscribe(notifications => {
        this.notifications = notifications;
        this.updateSidebarItems();
      })
    );

    this.notificationService.loadDoctorNotifications(false).subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter(notification => notification.unread).length;
  }

  get activeAccessCount(): number {
    return this.notifications.filter(item =>
      String(item.accessStatus || '').toUpperCase() === 'APPROVED' && !item.accessEndedAt
    ).length;
  }

  get completedCount(): number {
    return this.notifications.filter(item =>
      String(item.accessStatus || '').toUpperCase() === 'COMPLETED' || !!item.accessEndedAt
    ).length;
  }

  updateSidebarItems(): void {
    const active = this.notifications.filter(item =>
      String(item.accessStatus || '').toUpperCase() === 'APPROVED' && !item.accessEndedAt
    ).length;

    const pending = this.notifications.filter(item =>
      String(item.accessStatus || '').toUpperCase() === 'PENDING'
    ).length;

    this.sidebarItems = [
      { label: 'Dashboard', icon: 'D', route: '/doctor/home', exact: true },
      { label: 'Emergency Lookup', icon: 'E', route: '/doctor/emergency-lookup', exact: true },
      { label: 'Patient Care', icon: 'C', route: '/doctor/patient-care', badgeCount: active + pending, exact: true },
      { label: 'Doctor Profile', icon: 'P', route: '/doctor/profile', exact: true },
      { label: 'Notifications', icon: 'N', route: '/doctor/notifications', badgeCount: this.unreadCount, exact: true },
      { label: 'Help & Support', icon: 'H', route: '/doctor/support', exact: true }
    ];
  }

  saveDoctorProfile(updatedDoctor: Doctor): void {
    this.doctorService.saveDoctorProfile(updatedDoctor).subscribe({
      next: doctor => {
        this.doctor = doctor;
        this.showMessage('Doctor profile updated successfully.', 'success');
      },
      error: error => {
        console.error('Unable to save doctor profile:', error);
        this.showMessage(error?.error?.message || 'Unable to save doctor profile. Please check required fields.', 'danger');
      }
    });
  }

  uploadDoctorProfileImage(file: File): void {
    this.doctorService.uploadDoctorProfileImage(file).subscribe({
      next: doctor => {
        this.doctor = doctor;
        this.showMessage('Doctor profile photo saved.', 'success');
      },
      error: error => {
        console.error('Unable to save profile photo:', error);
        this.showMessage(error?.error?.message || 'Unable to save profile photo.', 'danger');
      }
    });
  }

  removeDoctorProfileImage(): void {
    this.doctorService.removeDoctorProfileImage().subscribe({
      next: doctor => {
        this.doctor = doctor;
        this.showMessage('Doctor profile photo removed.', 'success');
      },
      error: error => {
        console.error('Unable to remove profile photo:', error);
        this.showMessage(error?.error?.message || 'Unable to remove profile photo.', 'danger');
      }
    });
  }

  onProfileCancel(): void {
    this.showMessage('Profile changes cancelled.', 'info');
  }

  openChangePassword(): void {
    this.router.navigate(['/change-password']);
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

  private showMessage(message: string, type: 'success' | 'danger' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3200);
  }
}