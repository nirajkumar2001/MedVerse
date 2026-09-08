import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Patient } from '../../../core/models/patient.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';
import { PatientService } from '../../../core/services/patient.service';
import { LayoutSidebarComponent } from '../../components/layout-sidebar/layout-sidebar.component';
import { HealthcareFooterComponent } from '../../components/healthcare-footer/healthcare-footer.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutSidebarComponent, PageHeaderComponent, HealthcareFooterComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  patient?: Patient;
  auditAlerts = true;
  consentReminders = true;
  emailSummary = false;
  profileVisibility = 'Role based';
  darkTheme = false;
  compactMode = false;

  constructor(
    private router: Router,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.darkTheme = localStorage.getItem('medverse-theme') === 'dark';
    this.compactMode = localStorage.getItem('medverse-density') === 'compact';
    this.applyPreferences();

    if (this.isPatient) {
      this.patientService.getMyProfile().subscribe(patient => {
        this.patient = patient;
      });
    }
  }

  toggleTheme(): void {
    this.darkTheme = !this.darkTheme;
    localStorage.setItem('medverse-theme', this.darkTheme ? 'dark' : 'light');
    this.applyPreferences();
  }

  toggleDensity(): void {
    this.compactMode = !this.compactMode;
    localStorage.setItem('medverse-density', this.compactMode ? 'compact' : 'comfortable');
    this.applyPreferences();
  }

  get isPatient(): boolean {
    return this.router.url.startsWith('/patient');
  }

  get root(): string {
    return this.isPatient ? 'Patient Portal' : 'Doctor Portal';
  }

  get homeRoute(): string {
    return this.isPatient ? '/patient/home' : '/doctor/home';
  }

  get headerBadgeText(): string {
    if (this.isPatient) {
      return this.patient ? `ID: ${this.patient.patientId}` : 'ID';
    }

    return 'Secure';
  }

  get headerAvatarText(): string {
    return this.isPatient && this.patient ? this.patient.fullName.charAt(0) : 'MV';
  }

  get headerAvatarImage(): string {
    return this.isPatient && this.patient ? (this.patient.profileImage || this.patient.photoUrl || '') : '';
  }

  get menuItems(): SidebarItem[] {
    const prefix = this.isPatient ? '/patient' : '/doctor';
    const common = [
      { label: 'Dashboard', icon: 'D', route: `${prefix}/home`, exact: true },
      { label: this.isPatient ? 'Emergency Details' : 'Emergency Lookup', icon: 'E', route: this.isPatient ? '/patient/emergency-details' : '/doctor/emergency-lookup', exact: true },
      ...(this.isPatient ? [{ label: 'My Medical Records', icon: 'M', route: '/patient/medical-records', exact: true }] : []),
      { label: this.isPatient ? 'Access Requests' : 'Notifications', icon: 'N', route: this.isPatient ? '/patient/notifications' : '/doctor/notifications', badgeCount: 3, exact: true },
      { label: this.isPatient ? 'My Profile' : 'Doctor Profile', icon: 'P', route: `${prefix}/profile`, exact: true },
      { label: 'Help & Support', icon: 'H', route: `${prefix}/support`, exact: true }
    ];
    return common;
  }

  private applyPreferences(): void {
    document.body.classList.toggle('theme-dark', this.darkTheme);
    document.body.classList.toggle('density-compact', this.compactMode);
  }
}
