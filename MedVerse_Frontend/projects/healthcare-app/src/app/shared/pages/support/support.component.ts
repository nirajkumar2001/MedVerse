import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { SidebarItem } from '../../../core/models/sidebar-item.model';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutSidebarComponent } from '../../components/layout-sidebar/layout-sidebar.component';
import { HealthcareFooterComponent } from '../../components/healthcare-footer/healthcare-footer.component';
import { LogoutConfirmModalComponent } from '../../components/logout-confirm-modal/logout-confirm-modal.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutSidebarComponent, PageHeaderComponent, HealthcareFooterComponent, LogoutConfirmModalComponent],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class SupportComponent {
  category = 'Access and consent';
  message = '';
  submitted = false;
  submitting = false;
  errorMessage = '';
  showLogoutModal = false;

  private readonly apiBaseUrl = 'http://localhost:9090/api/v1';

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  get isPatient(): boolean {
    return this.router.url.startsWith('/patient');
  }

  get root(): string {
    return this.isPatient ? 'Patient Portal' : 'Doctor Portal';
  }

  get homeRoute(): string {
    return this.isPatient ? '/patient/home' : '/doctor/home';
  }

  get menuItems(): SidebarItem[] {
    if (this.isPatient) {
      return [
        { label: 'Dashboard', icon: 'D', route: '/patient/home', exact: true },
        { label: 'Emergency Details', icon: 'E', route: '/patient/emergency-details', exact: true },
        { label: 'My Medical Records', icon: 'M', route: '/patient/medical-records', exact: true },
        { label: 'Access Requests', icon: 'N', route: '/patient/notifications', badgeCount: 3, exact: true },
        { label: 'My Profile', icon: 'P', route: '/patient/profile', exact: true },
        { label: 'Help & Support', icon: 'H', route: '/patient/support', exact: true }
      ];
    }

    return [
      { label: 'Dashboard', icon: 'D', route: '/doctor/home', exact: true },
      { label: 'Emergency Lookup', icon: 'E', route: '/doctor/emergency-lookup', exact: true },
      { label: 'Patient Care', icon: 'C', route: '/doctor/patient-care', badgeCount: 3, exact: true },
      { label: 'Doctor Profile', icon: 'P', route: '/doctor/profile', exact: true },
      { label: 'Notifications', icon: 'N', route: '/doctor/notifications', badgeCount: 3, exact: true },
      { label: 'Help & Support', icon: 'H', route: '/doctor/support', exact: true }
    ];
  }

  submitConcern(): void {
    const trimmed = this.message.trim();
    if (trimmed.length < 5) {
      this.errorMessage = 'Please describe your concern in at least 5 characters.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.http.post(`${this.apiBaseUrl}/support/tickets`, {
      category: this.category,
      message: trimmed,
      userRole: this.isPatient ? 'PATIENT' : 'DOCTOR'
    }, { withCredentials: true }).subscribe({
      next: () => this.completeSubmit(),
      error: () => this.completeSubmit()
    });
  }

  private completeSubmit(): void {
    const stored = JSON.parse(localStorage.getItem('medverse-support-concerns') || '[]');
    stored.unshift({
      category: this.category,
      message: this.message.trim(),
      role: this.isPatient ? 'PATIENT' : 'DOCTOR',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('medverse-support-concerns', JSON.stringify(stored.slice(0, 25)));
    this.message = '';
    this.submitting = false;
    this.submitted = true;
    setTimeout(() => this.submitted = false, 2800);
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
}
