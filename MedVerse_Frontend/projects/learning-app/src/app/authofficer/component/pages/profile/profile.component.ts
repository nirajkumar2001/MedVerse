import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthOfficerFooterComponent } from '../../../footer/footer.component';
import { AuthOfficerApiService, AuthOfficerProfile } from '../../../services/authofficer-api.service';

interface ProfileInfo {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  hospitalName: string;
  experienceYears: string;
}

interface InfoItem {
  label: string;
  icon: string;
  key: keyof ProfileInfo;
  type: 'text' | 'email' | 'tel';
  editable: boolean;
  control?: 'input' | 'department';
}

interface ProfileErrors {
  phone: string;
  department: string;
  hospitalName: string;
  experienceYears: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, AuthOfficerFooterComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  isSidebarCollapsed = false;
  readonly departmentOptions = [
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'pulmonology', label: 'Pulmonology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'gastroenterology', label: 'Gastroenterology' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'general', label: 'General Medicine' },
    { value: 'endocrinology', label: 'Endocrinology' },
    { value: 'nephrology', label: 'Nephrology' },
    { value: 'gynecology', label: 'Gynecology' },
    { value: 'psychiatry', label: 'Psychiatry' },
    { value: 'ent', label: 'ENT (Ear, Nose & Throat)' },
    { value: 'ophthalmology', label: 'Ophthalmology' }
  ];

  isEditing = false;
  showPopup = false;
  currentProfileImage = '';
  errors: ProfileErrors = {
    phone: '',
    department: '',
    hospitalName: '',
    experienceYears: ''
  };

  officer = {
    role: 'Authentication Officer',
    officerId: '',
    status: ''
  };

  profile: ProfileInfo = {
    fullName: '',
    email: '',
    phone: '',
    department: '',
    hospitalName: '',
    experienceYears: ''
  };

  backupProfile: ProfileInfo = { ...this.profile };

  popupData = {
    title: '',
    message: '',
    type: 'success'
  };

  infoItems: InfoItem[] = [
    {
      label: 'Full Name',
      icon: '👤',
      key: 'fullName',
      type: 'text',
      editable: false
    },
    {
      label: 'Email',
      icon: '✉️',
      key: 'email',
      type: 'email',
      editable: false
    },
    {
      label: 'Phone',
      icon: '📞',
      key: 'phone',
      type: 'tel',
      editable: true
    },
    {
      label: 'Department',
      icon: '🏢',
      key: 'department',
      type: 'text',
      editable: true,
      control: 'department'
    },
    {
      label: 'Hospital Name',
      icon: '🏥',
      key: 'hospitalName',
      type: 'text',
      editable: true
    },
    {
      label: 'Experience Years',
      icon: '💼',
      key: 'experienceYears',
      type: 'text',
      editable: true
    }
  ];

  constructor(
    private readonly authOfficerApi: AuthOfficerApiService,
    private readonly router: Router,
    private readonly location: Location
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  toggleEdit(): void {
    this.backupProfile = { ...this.profile };
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.profile = { ...this.backupProfile };
    this.clearErrors();
    this.isEditing = false;
  }

  saveChanges(): void {
    this.validateProfile();
    if (this.hasErrors()) {
      return;
    }

    const requestedProfile = this.toApiProfile();

    this.authOfficerApi.updateProfile(requestedProfile).subscribe(profile => {
      this.applyProfile(profile);
      this.isEditing = false;

      if (!this.didEditableFieldsPersist(requestedProfile, profile)) {
        this.showCustomPopup(
          'Profile Not Saved',
          'The save API responded, but the database did not return the updated profile fields.',
          'error'
        );
        return;
      }

      this.showCustomPopup(
        'Profile Updated',
        'Your profile information has been updated successfully.',
        'success'
      );
    }, () => {
      this.showCustomPopup(
        'Profile Not Saved',
        'The backend did not save your changes. Please check the profile update API.',
        'error'
      );
    });
  }

  showCustomPopup(title: string, message: string, type: string): void {
    this.popupData = { title, message, type };
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
  }

  goBack(): void {
    this.location.back();
  }

  changePassword(): void {
    this.router.navigate(['/change-password']);
  }

  validateField(key: 'phone' | 'department' | 'hospitalName' | 'experienceYears'): void {
    if (key === 'phone') {
      this.validatePhone();
      return;
    }
    if (key === 'department') {
      this.validateDepartment();
      return;
    }
    if (key === 'hospitalName') {
      this.validateHospital();
      return;
    }
    if (key === 'experienceYears') {
      this.validateExperience();
    }
  }

  getError(key: keyof ProfileInfo): string {
    if (key === 'phone' || key === 'department' || key === 'hospitalName' || key === 'experienceYears') {
      return this.errors[key];
    }
    return '';
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.showCustomPopup('Photo Not Saved', 'Please upload an image file.', 'error');
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.showCustomPopup('Photo Not Saved', 'Profile photo should be less than 2MB.', 'error');
      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const nextImage = String(reader.result || '');
      this.currentProfileImage = nextImage;

      this.authOfficerApi.uploadProfileImage(file).subscribe(uploadedProfile => {
        this.applyProfile(uploadedProfile);
        if (!uploadedProfile.profileImage) {
          this.showCustomPopup(
            'Photo Not Saved',
            'The image upload API completed, but the database did not return a saved profile image.',
            'error'
          );
          return;
        }

        this.showCustomPopup(
          'Profile Photo Updated',
          'Your profile photo has been saved in the database.',
          'success'
        );
      }, () => {
        this.showCustomPopup(
          'Photo Not Saved',
          'The backend did not save your profile photo. Please check the profile image API.',
          'error'
        );
      });
    };

    reader.onerror = () => {
      this.showCustomPopup(
        'Photo Not Saved',
        'Unable to read the selected image.',
        'error'
      );
    };

    reader.readAsDataURL(file);
  }

  departmentLabel(value: string): string {
    return this.departmentOptions.find(option => option.value === this.normalizeDepartment(value))?.label || value;
  }

  onProfileImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.style.display = 'none';
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Logged out successfully');
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  get profileImage(): string {
    return this.currentProfileImage;
  }

  private loadProfile(): void {
    this.authOfficerApi.getProfile(this.toApiProfile()).subscribe(profile => {
      this.applyProfile(profile);
    });
  }

  private applyProfile(profile: AuthOfficerProfile): void {
    this.profile = {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      department: this.normalizeDepartment(profile.department),
      hospitalName: profile.hospitalName,
      experienceYears: profile.experienceYears
    };
    this.backupProfile = { ...this.profile };
    this.officer = {
      role: profile.role || 'Authentication Officer',
      officerId: profile.officerId,
      status: profile.status
    };
    this.currentProfileImage = profile.profileImage || '';
  }

  private toApiProfile(): AuthOfficerProfile {
    return {
      fullName: this.profile.fullName,
      email: this.profile.email,
      phone: this.profile.phone,
      department: this.profile.department,
      hospitalName: this.profile.hospitalName,
      experienceYears: this.profile.experienceYears,
      officerId: this.officer.officerId,
      role: this.officer.role,
      status: this.officer.status,
      profileImage: this.currentProfileImage
    };
  }

  private didEditableFieldsPersist(requested: AuthOfficerProfile, saved: AuthOfficerProfile): boolean {
    return this.toComparablePhone(requested.phone) === this.toComparablePhone(saved.phone) &&
      this.normalizeDepartment(requested.department) === this.normalizeDepartment(saved.department) &&
      requested.hospitalName === saved.hospitalName &&
      requested.experienceYears === saved.experienceYears;
  }

  private toComparablePhone(value: string): string {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  private normalizeDepartment(value: string): string {
    const normalized = String(value || '').trim().toLowerCase();
    const match = this.departmentOptions.find(option =>
      option.value === normalized ||
      option.label.toLowerCase() === normalized
    );
    return match?.value || normalized;
  }

  private validateProfile(): void {
    this.validatePhone();
    this.validateDepartment();
    this.validateHospital();
    this.validateExperience();
  }

  private validatePhone(): void {
    const digits = String(this.profile.phone || '').replace(/\D/g, '');
    const backendDigits = digits.length > 10 ? digits.slice(-10) : digits;

    if (!digits) {
      this.errors.phone = 'Phone number cannot be empty.';
      return;
    }
    if (backendDigits.length !== 10) {
      this.errors.phone = 'Phone number must contain 10 digits.';
      return;
    }
    if (!/^[6-9]/.test(backendDigits)) {
      this.errors.phone = 'Phone number must start with 6, 7, 8, or 9.';
      return;
    }
    this.errors.phone = '';
  }

  private validateDepartment(): void {
    const value = this.normalizeDepartment(this.profile.department);
    if (!value) {
      this.errors.department = 'Please select a department.';
      return;
    }
    if (!this.departmentOptions.some(option => option.value === value)) {
      this.errors.department = 'Please select a valid department.';
      return;
    }
    this.profile.department = value;
    this.errors.department = '';
  }

  private validateHospital(): void {
    const value = String(this.profile.hospitalName || '').trim();
    if (!value) {
      this.errors.hospitalName = 'Hospital name cannot be empty.';
      return;
    }
    if (value.includes('  ')) {
      this.errors.hospitalName = 'Hospital name should not contain consecutive spaces.';
      return;
    }
    if (!/^[A-Za-z0-9 &'().,-]+$/.test(value)) {
      this.errors.hospitalName = 'Hospital name contains unsupported characters.';
      return;
    }
    this.profile.hospitalName = value;
    this.errors.hospitalName = '';
  }

  private validateExperience(): void {
    const value = Number(this.profile.experienceYears);
    if (String(this.profile.experienceYears || '').trim() === '') {
      this.errors.experienceYears = 'Experience cannot be empty.';
      return;
    }
    if (!Number.isInteger(value)) {
      this.errors.experienceYears = 'Experience must be a whole number.';
      return;
    }
    if (value < 0 || value > 90) {
      this.errors.experienceYears = 'Experience must be between 0 and 90 years.';
      return;
    }
    this.profile.experienceYears = String(value);
    this.errors.experienceYears = '';
  }

  private hasErrors(): boolean {
    return Object.values(this.errors).some(Boolean);
  }

  private clearErrors(): void {
    this.errors = {
      phone: '',
      department: '',
      hospitalName: '',
      experienceYears: ''
    };
  }
}
