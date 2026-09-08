import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Patient } from '../../../core/models/patient.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';
import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { AlphaOnlyDirective } from '../../../shared/directives/alpha-only.directive';
import { TrimLeadingSpaceDirective } from '../../../shared/directives/trim-leading-space.directive';
import { NoSpecialCharsDirective } from '../../../shared/directives/no-special-chars.directive';

interface PatientProfileForm {
  fullName: string;
  age: number | null;
  gender: 'Male' | 'Female' | 'Other' | '';
  emergencyContact: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
}

interface PatientProfileErrors {
  fullName: string;
  age: string;
  gender: string;
  emergencyContact: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
}

type ToastType = 'success' | 'danger' | 'info';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    HealthcareFooterComponent,
    LogoutConfirmModalComponent,
    ToastMessageComponent,
    AlphaOnlyDirective,
    TrimLeadingSpaceDirective,
    NoSpecialCharsDirective
  ],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css']
})
export class PatientProfileComponent implements OnInit {
  patient: Patient | null = null;

  profileForm: PatientProfileForm = this.emptyForm();

  photoPreview = '';
  selectedPhotoDataUrl = '';
  photoChanged = false;

  isLoading = true;
  isSaving = false;
  isEditMode = false;

  showLogoutModal = false;
  showToast = false;
  toastMessage = '';
  toastType: ToastType = 'success';

  readonly genderOptions: Array<'Male' | 'Female' | 'Other'> = ['Male', 'Female', 'Other'];

  errors: PatientProfileErrors = this.emptyErrors();

  menuItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/patient/home', icon: 'D', exact: true },
    { label: 'My Profile', route: '/patient/profile', icon: 'P', exact: true },
    { label: 'Emergency Details', route: '/patient/emergency-details', icon: 'E', exact: true },
    { label: 'My Medical Records', route: '/patient/medical-records', icon: 'M', exact: true },
    { label: 'Access Requests', route: '/patient/notifications', icon: 'N', exact: true },
    { label: 'Help & Support', route: '/patient/support', icon: 'H', exact: true }
  ];

  constructor(
    private readonly patientService: PatientService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  get patientName(): string {
    return this.patient?.fullName || this.patient?.name || 'Patient';
  }

  get patientId(): string {
    return this.patient?.patientId || this.patient?.userId || '-';
  }

  get patientEmail(): string {
    return this.patient?.email || '-';
  }

  get displayEmergencyContact(): string {
    return this.patient?.emergencyContact || this.patient?.contactNumber || '-';
  }

  get displayAddress(): string {
    const parts = [
      this.patient?.address,
      this.patient?.district,
      this.patient?.state,
      this.patient?.pincode
    ]
      .map(value => String(value || '').trim())
      .filter(Boolean);

    return parts.length ? parts.join(', ') : '-';
  }

  get displayGender(): string {
    return this.patient?.gender || '-';
  }

  get displayAge(): string {
    const age = this.patient?.age;
    return age ? `${age} years` : '-';
  }

  get avatarText(): string {
    return this.patientName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'PT';
  }

  get profileCompletion(): number {
    const values = [
      this.patientName,
      this.patient?.age,
      this.patient?.gender,
      this.displayEmergencyContact !== '-' ? this.displayEmergencyContact : '',
      this.patient?.address,
      this.patient?.district,
      this.patient?.state,
      this.patient?.pincode,
      this.photoPreview
    ];

    const filled = values.filter(value => String(value || '').trim()).length;
    return Math.round((filled / values.length) * 100);
  }

  get canSave(): boolean {
    return this.isEditMode && !this.isSaving && !this.hasErrors();
  }

  loadProfile(): void {
    this.isLoading = true;

    this.patientService.getMyProfile().subscribe({
      next: patient => {
        this.applyPatient(patient);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showMessage('Unable to load patient profile. Please try again.', 'danger');
      }
    });
  }

  enableEditMode(): void {
    this.isEditMode = true;
    this.clearErrors();
  }

  cancelEdit(): void {
    if (!this.patient) {
      return;
    }

    this.profileForm = this.toProfileForm(this.patient);
    this.photoPreview = this.getStoredProfilePhoto() || this.patient.profileImage || this.patient.photoUrl || '';
    this.selectedPhotoDataUrl = '';
    this.photoChanged = false;
    this.clearErrors();
    this.isEditMode = false;
  }

  saveProfile(): void {
    if (!this.isEditMode || !this.patient) {
      return;
    }

    this.validateAll();

    if (this.hasErrors()) {
      this.showMessage('Please correct the highlighted fields before saving.', 'danger');
      return;
    }

    this.isSaving = true;

    const payload: Partial<Patient> = {
      fullName: this.profileForm.fullName.trim(),
      age: Number(this.profileForm.age),
      gender: this.profileForm.gender || 'Other',
      emergencyContact: this.profileForm.emergencyContact.trim(),
      contactNumber: this.profileForm.emergencyContact.trim(),
      address: this.profileForm.address.trim(),
      district: this.profileForm.district.trim(),
      state: this.profileForm.state.trim(),
      pincode: this.profileForm.pincode.trim()
    };

    if (this.photoChanged) {
      payload.photoUrl = this.photoPreview;
      payload.profileImage = this.photoPreview && !this.photoPreview.startsWith('data:image/')
        ? this.photoPreview
        : '';
    }

    this.patientService.updateMyProfile(payload).subscribe({
      next: updatedPatient => {
        const mergedPatient: Patient = {
          ...this.patient!,
          ...updatedPatient,
          fullName: updatedPatient.fullName || payload.fullName || this.patientName,
          name: updatedPatient.name || payload.fullName || this.patientName,
          emergencyContact: updatedPatient.emergencyContact || payload.emergencyContact || '',
          contactNumber: updatedPatient.contactNumber || payload.contactNumber || '',
          profileImage: this.photoPreview || updatedPatient.profileImage || '',
          photoUrl: this.photoPreview || updatedPatient.photoUrl || ''
        };

        if (this.photoChanged) {
          if (this.photoPreview) {
            localStorage.setItem('medverse-patient-profile-photo', this.photoPreview);
          } else {
            localStorage.removeItem('medverse-patient-profile-photo');
          }
        }

        this.applyPatient(mergedPatient);
        this.syncCurrentUser(mergedPatient);
        this.isEditMode = false;
        this.isSaving = false;
        this.showMessage('Profile updated successfully.', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.showMessage('Unable to save profile. Please try again.', 'danger');
      }
    });
  }

  onPhotoSelected(event: Event): void {
    if (!this.isEditMode) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.showMessage('Please select a valid image file.', 'danger');
      input.value = '';
      return;
    }

    const maxSizeInMb = 2;
    if (file.size > maxSizeInMb * 1024 * 1024) {
      this.showMessage(`Profile photo must be less than ${maxSizeInMb} MB.`, 'danger');
      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = (): void => {
      const dataUrl = String(reader.result || '');
      this.selectedPhotoDataUrl = dataUrl;
      this.photoPreview = dataUrl;
      this.photoChanged = true;
      this.showMessage('Profile photo selected. Click Save Changes to apply it.', 'info');
    };

    reader.onerror = (): void => {
      this.showMessage('Unable to read selected image. Please try another file.', 'danger');
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  removePhoto(fileInput?: HTMLInputElement): void {
    if (!this.isEditMode) {
      return;
    }

    this.photoPreview = '';
    this.selectedPhotoDataUrl = '';
    this.photoChanged = true;
    localStorage.removeItem('medverse-patient-profile-photo');

    if (fileInput) {
      fileInput.value = '';
    }

    this.showMessage('Profile photo removed locally. Click Save Changes to keep this view.', 'info');
  }

  validateFullName(): void {
    const value = this.profileForm.fullName.trim();

    if (!value) {
      this.errors.fullName = 'Full name cannot be empty.';
      return;
    }

    if (!/^[a-zA-Z\s.]{2,60}$/.test(value)) {
      this.errors.fullName = 'Full name should contain alphabets only.';
      return;
    }

    this.errors.fullName = '';
  }

  validateAge(): void {
    const value = Number(this.profileForm.age);

    if (this.profileForm.age === null || this.profileForm.age === undefined || String(this.profileForm.age).trim() === '') {
      this.errors.age = 'Age cannot be empty.';
      return;
    }

    if (!Number.isInteger(value)) {
      this.errors.age = 'Age must be a whole number.';
      return;
    }

    if (value < 1 || value > 120) {
      this.errors.age = 'Age must be between 1 and 120 years.';
      return;
    }

    this.errors.age = '';
  }

  validateGender(): void {
    this.errors.gender = this.genderOptions.includes(this.profileForm.gender as 'Male' | 'Female' | 'Other')
      ? ''
      : 'Please select a valid gender.';
  }

  validateEmergencyContact(): void {
    const value = this.profileForm.emergencyContact.trim();

    if (!value) {
      this.errors.emergencyContact = 'Emergency contact number cannot be empty.';
      return;
    }

    if (/[^0-9\s+-]/.test(value)) {
      this.errors.emergencyContact = 'Only digits, spaces, + and - are allowed.';
      return;
    }

    const digitCount = value.replace(/\D/g, '').length;

    if (digitCount < 10 || digitCount > 15) {
      this.errors.emergencyContact = 'Contact must contain 10 to 15 digits.';
      return;
    }

    this.errors.emergencyContact = '';
  }

  validateAddress(): void {
    const value = this.profileForm.address.trim();
    this.errors.address = value.length >= 5 ? '' : 'Address must be at least 5 characters long.';
  }

  validateDistrict(): void {
    const value = this.profileForm.district.trim();
    this.errors.district = /^[a-zA-Z\s]{2,}$/.test(value) ? '' : 'District accepts alphabets only.';
  }

  validateState(): void {
    const value = this.profileForm.state.trim();
    this.errors.state = /^[a-zA-Z\s]{2,}$/.test(value) ? '' : 'State accepts alphabets only.';
  }

  validatePincode(): void {
    const value = this.profileForm.pincode.trim();
    this.errors.pincode = /^\d{6}$/.test(value) ? '' : 'Pincode must be 6 digits.';
  }

  openChangePassword(): void {
    this.router.navigate(['/change-password']);
  }

  goToMedicalRecords(): void {
    this.router.navigate(['/patient/medical-records']);
  }

  goToEmergencyDetails(): void {
    this.router.navigate(['/patient/emergency-details']);
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

  private applyPatient(patient: Patient): void {
    const safePatient = this.normalizePatient(patient);

    const storedPhoto = this.getStoredProfilePhoto();

    this.patient = {
      ...safePatient,
      profileImage: storedPhoto || safePatient.profileImage || '',
      photoUrl: storedPhoto || safePatient.photoUrl || ''
    };

    this.profileForm = this.toProfileForm(this.patient);
    this.photoPreview = storedPhoto || this.patient.profileImage || this.patient.photoUrl || '';
    this.selectedPhotoDataUrl = '';
    this.photoChanged = false;
    this.clearErrors();
  }

  private normalizePatient(patient: Patient): Patient {
    const fallback = this.emptyPatient();

    return {
      ...fallback,
      ...patient,
      patientId: patient?.patientId || patient?.userId || fallback.patientId,
      userId: patient?.userId || patient?.patientId || fallback.userId,
      fullName: patient?.fullName || patient?.name || fallback.fullName,
      name: patient?.name || patient?.fullName || fallback.name,
      email: patient?.email || fallback.email,
      age: Number(patient?.age || 0),
      gender: this.normalizeGender(patient?.gender),
      emergencyContact: patient?.emergencyContact || patient?.contactNumber || '',
      contactNumber: patient?.contactNumber || patient?.emergencyContact || '',
      pincode: patient?.pincode != null ? String(patient.pincode) : '',
      profileImage: patient?.profileImage || patient?.photoUrl || '',
      photoUrl: patient?.photoUrl || patient?.profileImage || '',
      emergencyRecord: {
        bloodGroup: patient?.emergencyRecord?.bloodGroup || '',
        allergies: Array.isArray(patient?.emergencyRecord?.allergies) ? patient.emergencyRecord.allergies : [],
        chronicConditions: Array.isArray(patient?.emergencyRecord?.chronicConditions) ? patient.emergencyRecord.chronicConditions : [],
        currentMedications: Array.isArray(patient?.emergencyRecord?.currentMedications) ? patient.emergencyRecord.currentMedications : []
      }
    };
  }

  private toProfileForm(patient: Patient): PatientProfileForm {
    return {
      fullName: patient.fullName || patient.name || '',
      age: patient.age || null,
      gender: patient.gender || '',
      emergencyContact: patient.emergencyContact || patient.contactNumber || '',
      address: patient.address || '',
      district: patient.district || '',
      state: patient.state || '',
      pincode: patient.pincode || ''
    };
  }

  private validateAll(): void {
    this.validateFullName();
    this.validateAge();
    this.validateGender();
    this.validateEmergencyContact();
    this.validateAddress();
    this.validateDistrict();
    this.validateState();
    this.validatePincode();
  }

  private hasErrors(): boolean {
    return Object.values(this.errors).some(error => error !== '');
  }

  private clearErrors(): void {
    this.errors = this.emptyErrors();
  }

  private emptyErrors(): PatientProfileErrors {
    return {
      fullName: '',
      age: '',
      gender: '',
      emergencyContact: '',
      address: '',
      district: '',
      state: '',
      pincode: ''
    };
  }

  private emptyForm(): PatientProfileForm {
    return {
      fullName: '',
      age: null,
      gender: '',
      emergencyContact: '',
      address: '',
      district: '',
      state: '',
      pincode: ''
    };
  }

  private emptyPatient(): Patient {
    const currentUser = this.getCurrentUser();

    return {
      patientId: currentUser?.userId || '',
      userId: currentUser?.userId || '',
      fullName: currentUser?.name || 'Patient',
      name: currentUser?.name || 'Patient',
      email: currentUser?.email || '',
      age: 0,
      gender: 'Other',
      contactNumber: '',
      emergencyContact: '',
      address: '',
      district: '',
      state: '',
      pincode: '',
      height: null,
      weight: null,
      profileImage: '',
      photoUrl: '',
      photoText: 'No Photo Available',
      emergencyRecord: {
        bloodGroup: '',
        allergies: [],
        chronicConditions: [],
        currentMedications: []
      }
    };
  }

  private normalizeGender(value: unknown): 'Male' | 'Female' | 'Other' {
    const gender = String(value || '').toLowerCase();

    if (gender === 'male') {
      return 'Male';
    }

    if (gender === 'female') {
      return 'Female';
    }

    return 'Other';
  }

  private syncCurrentUser(patient: Patient): void {
    const currentUser = this.getCurrentUser();

    const updatedUser = {
      ...currentUser,
      userId: patient.patientId || patient.userId || currentUser?.userId,
      name: patient.fullName || patient.name || currentUser?.name,
      fullName: patient.fullName || patient.name || currentUser?.fullName,
      email: patient.email || currentUser?.email,
      role: currentUser?.role || 'PATIENT',
      profileImage: this.photoPreview || currentUser?.profileImage || '',
      photoUrl: this.photoPreview || currentUser?.photoUrl || ''
    };

    localStorage.setItem('medverseCurrentUser', JSON.stringify(updatedUser));
  }

  private getCurrentUser(): any {
    const raw = localStorage.getItem('medverseCurrentUser') || localStorage.getItem('currentUser') || localStorage.getItem('user');

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private getStoredProfilePhoto(): string {
    return localStorage.getItem('medverse-patient-profile-photo') || '';
  }

  private showMessage(message: string, type: ToastType = 'success', timeout = 2800): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    window.setTimeout(() => {
      this.showToast = false;
    }, timeout);
  }
}