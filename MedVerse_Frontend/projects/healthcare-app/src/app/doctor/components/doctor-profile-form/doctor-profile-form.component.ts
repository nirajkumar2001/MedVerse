import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Doctor } from '../../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-profile-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-profile-form.component.html',
  styleUrls: ['./doctor-profile-form.component.css']
})
export class DoctorProfileFormComponent {
  private internalDoctor: Doctor = this.emptyDoctor();

  editableDoctor: Doctor = this.emptyDoctor();
  photoPreview = '';
  isEditMode = false;

  readonly departmentOptions = [
    'Cardiology',
    'Pulmonology',
    'Neurology',
    'Gastroenterology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics',
    'Oncology',
    'General Medicine',
    'Endocrinology',
    'Nephrology',
    'Gynecology',
    'Psychiatry',
    'ENT',
    'Ophthalmology'
  ];

  errors = {
    phone: '',
    designation: '',
    hospital: '',
    department: '',
    experience: ''
  };

  @Input()
  set doctor(value: Doctor) {
    const next = value || this.emptyDoctor();
    const preserveDraft = this.isEditMode && this.editableDoctor?.doctorId === next.doctorId;

    this.internalDoctor = {
      ...next,
      phone: String(next.phone || '').replace(/\D/g, '').slice(-10)
    };

    if (!preserveDraft) {
      this.editableDoctor = { ...this.internalDoctor };
      this.photoPreview = this.internalDoctor.profileImage || '';
      this.clearErrors();
      this.isEditMode = false;
      return;
    }

    this.editableDoctor = {
      ...this.editableDoctor,
      profileImage: next.profileImage || this.editableDoctor.profileImage || ''
    };
  }

  get doctor(): Doctor {
    return this.internalDoctor;
  }

  @Output() saved = new EventEmitter<Doctor>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() passwordChangeRequested = new EventEmitter<void>();
  @Output() photoSelected = new EventEmitter<File>();
  @Output() photoRemoved = new EventEmitter<void>();

  enableEditMode(): void {
    this.isEditMode = true;
  }

  saveProfile(): void {
    if (!this.isEditMode) {
      return;
    }

    this.validateAll();

    if (this.hasErrors()) {
      return;
    }

    const nextDoctor: Doctor = {
      ...this.editableDoctor,
      phone: String(this.editableDoctor.phone || '').replace(/\D/g, '').slice(-10),
      designation: String(this.editableDoctor.designation || '').trim(),
      hospital: String(this.editableDoctor.hospital || '').trim(),
      department: String(this.editableDoctor.department || '').trim(),
      experience: Number(this.editableDoctor.experience || 0),
      profileImage: this.photoPreview || this.editableDoctor.profileImage || ''
    };

    this.saved.emit(nextDoctor);
    this.internalDoctor = { ...nextDoctor };
    this.isEditMode = false;
  }

  resetForm(): void {
    this.editableDoctor = { ...this.internalDoctor };
    this.photoPreview = this.internalDoctor.profileImage || '';
    this.clearErrors();
    this.isEditMode = false;
    this.cancelled.emit();
  }

  changePassword(): void {
    this.passwordChangeRequested.emit();
  }

  validatePhone(): void {
    this.editableDoctor.phone = String(this.editableDoctor.phone || '').replace(/\D/g, '').slice(0, 10);

    if (!this.editableDoctor.phone) {
      this.errors.phone = 'Phone number cannot be empty.';
      return;
    }

    if (!/^\d{10}$/.test(this.editableDoctor.phone)) {
      this.errors.phone = 'Phone number must be exactly 10 digits.';
      return;
    }

    this.errors.phone = '';
  }

  validateDesignation(): void {
    const value = String(this.editableDoctor.designation || '').trim();

    if (!value) {
      this.errors.designation = 'Designation cannot be empty.';
      return;
    }

    if (!/^[a-zA-Z\s.]+$/.test(value)) {
      this.errors.designation = 'Use alphabets, spaces and dot only.';
      return;
    }

    this.errors.designation = '';
  }

  validateHospital(): void {
    const value = String(this.editableDoctor.hospital || '').trim();

    if (!value) {
      this.errors.hospital = 'Hospital / Institution cannot be empty.';
      return;
    }

    if (value.length < 3) {
      this.errors.hospital = 'Minimum 3 characters required.';
      return;
    }

    this.errors.hospital = '';
  }

  validateDepartment(): void {
    const value = String(this.editableDoctor.department || '').trim();

    this.errors.department = value ? '' : 'Please select a department.';
  }

  validateExperience(): void {
    const value = Number(this.editableDoctor.experience);

    if (this.editableDoctor.experience === null || this.editableDoctor.experience === undefined || String(this.editableDoctor.experience).trim() === '') {
      this.errors.experience = 'Experience cannot be empty.';
      return;
    }

    if (!Number.isInteger(value) || value < 0 || value > 60) {
      this.errors.experience = 'Enter a valid experience between 0 and 60 years.';
      return;
    }

    this.errors.experience = '';
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
      alert('Please select a valid image file.');
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Profile photo must be less than 2 MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (): void => {
      this.photoPreview = String(reader.result || '');
      this.editableDoctor.profileImage = this.photoPreview;
      this.photoSelected.emit(file);
    };
    reader.readAsDataURL(file);
  }

  removePhoto(input: HTMLInputElement): void {
    if (!this.isEditMode) {
      return;
    }

    this.photoPreview = '';
    this.editableDoctor.profileImage = '';
    input.value = '';
    this.photoRemoved.emit();
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined || String(value).trim() === '') {
      return 'Not updated';
    }

    return String(value);
  }

  private validateAll(): void {
    this.validatePhone();
    this.validateDesignation();
    this.validateHospital();
    this.validateDepartment();
    this.validateExperience();
  }

  private hasErrors(): boolean {
    return Object.values(this.errors).some(Boolean);
  }

  private clearErrors(): void {
    this.errors = {
      phone: '',
      designation: '',
      hospital: '',
      department: '',
      experience: ''
    };
  }

  private emptyDoctor(): Doctor {
    return {
      doctorId: '',
      fullName: 'Doctor',
      email: '',
      phone: '',
      designation: '',
      hospital: '',
      department: '',
      experience: 0,
      initials: 'DR',
      profileImage: ''
    };
  }
}