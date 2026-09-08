import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { Doctor } from '../../../core/models/doctor.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';
import { AppNotification } from '../../../core/models/app-notification.model';

import { AuthService } from '../../../core/services/auth.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  EmergencyLookupService,
  EmergencyPatientDetails,
  EmergencyPatientSummary
} from '../../../core/services/emergency-lookup.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';

@Component({
  selector: 'app-emergency-lookup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    LogoutConfirmModalComponent,
    ToastMessageComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './emergency-lookup.component.html',
  styleUrl: './emergency-lookup.component.css'
})
export class EmergencyLookupComponent implements OnInit, OnDestroy {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  searchQuery = '';
  isSearching = false;
  hasSearched = false;

  selectedPatient: EmergencyPatientDetails | null = null;
  matchedPatients: EmergencyPatientSummary[] = [];

  expandedPatientId = '';
  expandedPatientDetails: EmergencyPatientDetails | null = null;
  loadingExpandedPatientId = '';

  resultMessage = '';

  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'info';

  private readonly subscriptions = new Subscription();
  private readonly expandedDetailsCache = new Map<string, EmergencyPatientDetails>();

  constructor(
    private readonly doctorService: DoctorService,
    private readonly notificationService: NotificationService,
    private readonly emergencyLookupService: EmergencyLookupService,
    private readonly authService: AuthService
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

  get hasSelectedPatient(): boolean {
    return this.selectedPatient !== null;
  }

  get hasMultipleResults(): boolean {
    return this.matchedPatients.length > 0;
  }

  get selectedPatientPhotoUrl(): string {
    return this.selectedPatient?.photoUrl || '';
  }

  get fullAddress(): string {
    return this.formatAddress(this.selectedPatient);
  }

  get allergiesList(): string[] {
    return this.toList(this.selectedPatient?.allergies);
  }

  get chronicConditionsList(): string[] {
    return this.toList(this.selectedPatient?.chronicConditions);
  }

  get currentMedicationList(): string[] {
    return this.toList(this.selectedPatient?.currentMedication);
  }

  get latestHeight(): string {
    return this.formatHeight(this.selectedPatient);
  }

  get latestWeight(): string {
    return this.formatWeight(this.selectedPatient);
  }

  get latestBmi(): string {
    return this.formatBmi(this.selectedPatient);
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

  searchPatient(): void {
    const query = this.searchQuery.trim();

    if (!query) {
      this.showMessage(
        'Enter Patient ID, name, address, district, state, pincode, or emergency contact number.',
        'danger'
      );
      return;
    }

    this.isSearching = true;
    this.hasSearched = true;

    this.selectedPatient = null;
    this.matchedPatients = [];
    this.expandedPatientId = '';
    this.expandedPatientDetails = null;
    this.loadingExpandedPatientId = '';
    this.resultMessage = '';

    this.emergencyLookupService.searchPatient(query).subscribe({
      next: response => {
        this.isSearching = false;
        this.resultMessage = response.message;

        if (response.resultType === 'SINGLE' && response.patientDetails) {
          this.selectedPatient = response.patientDetails;
          this.matchedPatients = [];
          this.expandedPatientId = '';
          this.expandedPatientDetails = null;
          return;
        }

        this.selectedPatient = null;
        this.matchedPatients = response.patients ?? [];
        this.expandedPatientId = '';
        this.expandedPatientDetails = null;

        if (this.matchedPatients.length === 0) {
          this.showMessage(response.message || 'No matching patient found.', 'info');
        }
      },
      error: error => {
        console.error('Emergency lookup failed:', error);

        this.isSearching = false;
        this.selectedPatient = null;
        this.matchedPatients = [];
        this.expandedPatientId = '';
        this.expandedPatientDetails = null;

        this.showMessage(
          error?.error?.message ||
            error?.error?.data?.error ||
            'Unable to search patient. Please try again.',
          'danger'
        );
      }
    });
  }

  openPatient(patient: EmergencyPatientSummary): void {
    if (!patient.patientId) {
      this.showMessage('Unable to open this patient because Patient ID is missing.', 'danger');
      return;
    }

    if (this.expandedPatientId === patient.patientId) {
      this.collapsePatient();
      return;
    }

    const cachedDetails = this.expandedDetailsCache.get(patient.patientId);

    if (cachedDetails) {
      this.expandedPatientId = patient.patientId;
      this.expandedPatientDetails = cachedDetails;
      this.loadingExpandedPatientId = '';
      return;
    }

    this.expandedPatientId = patient.patientId;
    this.expandedPatientDetails = null;
    this.loadingExpandedPatientId = patient.patientId;

    this.emergencyLookupService.getPatientDetails(patient.patientId).subscribe({
      next: details => {
        this.loadingExpandedPatientId = '';

        if (!details) {
          this.expandedPatientId = '';
          this.expandedPatientDetails = null;
          this.showMessage('Unable to load patient emergency details.', 'danger');
          return;
        }

        this.expandedDetailsCache.set(patient.patientId, details);
        this.expandedPatientDetails = details;
        this.resultMessage = 'Patient emergency details loaded successfully.';
      },
      error: error => {
        console.error('Unable to load patient details:', error);

        this.loadingExpandedPatientId = '';
        this.expandedPatientId = '';
        this.expandedPatientDetails = null;

        this.showMessage(
          error?.error?.message ||
            error?.error?.data?.error ||
            'Unable to load patient emergency details.',
          'danger'
        );
      }
    });
  }

  collapsePatient(): void {
    this.expandedPatientId = '';
    this.expandedPatientDetails = null;
    this.loadingExpandedPatientId = '';
  }

  isPatientExpanded(patient: EmergencyPatientSummary): boolean {
    return this.expandedPatientId === patient.patientId;
  }

  isPatientLoading(patient: EmergencyPatientSummary): boolean {
    return this.loadingExpandedPatientId === patient.patientId;
  }

  getExpandedPatientDetails(patient: EmergencyPatientSummary): EmergencyPatientDetails | null {
    if (!this.isPatientExpanded(patient)) {
      return null;
    }

    return this.expandedPatientDetails;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.hasSearched = false;
    this.isSearching = false;

    this.selectedPatient = null;
    this.matchedPatients = [];
    this.expandedPatientId = '';
    this.expandedPatientDetails = null;
    this.loadingExpandedPatientId = '';
    this.resultMessage = '';
  }

  patientPhotoUrl(patient: EmergencyPatientSummary | EmergencyPatientDetails | null): string {
    return patient?.photoUrl || '';
  }

  patientInitial(patient: EmergencyPatientSummary | EmergencyPatientDetails | null): string {
    return patient?.name ? patient.name.charAt(0).toUpperCase() : 'P';
  }

  formatAddress(patient: EmergencyPatientSummary | EmergencyPatientDetails | null): string {
    if (!patient) {
      return 'Not available';
    }

    const parts = [
      patient.address,
      patient.district,
      patient.state,
      patient.pincode
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Not available';
  }

  formatHeight(patient: EmergencyPatientDetails | null): string {
    const value = patient?.heightCm;
    return value ? `${value} cm` : 'Not recorded';
  }

  formatWeight(patient: EmergencyPatientDetails | null): string {
    const value = patient?.weightKg;
    return value ? `${value} kg` : 'Not recorded';
  }

  formatBmi(patient: EmergencyPatientDetails | null): string {
    const value = patient?.bmi;
    return value ? String(value) : 'Not recorded';
  }

  listFrom(value?: string | null): string[] {
    return this.toList(value);
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

  private toList(value?: string | null): string[] {
    if (!value) {
      return [];
    }

    return String(value)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  private showMessage(message: string, type: 'success' | 'danger' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 2800);
  }
}