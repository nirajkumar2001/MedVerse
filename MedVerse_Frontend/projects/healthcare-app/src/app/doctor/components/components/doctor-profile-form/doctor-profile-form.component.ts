import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Doctor } from '../../../core/models/doctor.model';

import { AlphaOnlyDirective } from '../../../shared/directives/alpha-only.directive';
import { TrimLeadingSpaceDirective } from '../../../shared/directives/trim-leading-space.directive';
import { NoSpecialCharsDirective } from '../../../shared/directives/no-special-chars.directive';

import { FormFieldErrorComponent } from '../../../shared/components/form-field-error/form-field-error.component';
import { ProfileReadonlyFieldComponent } from '../../../shared/components/profile-readonly-field/profile-readonly-field.component';

@Component({
  selector: 'app-doctor-profile-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AlphaOnlyDirective,
    TrimLeadingSpaceDirective,
    NoSpecialCharsDirective,
    FormFieldErrorComponent,
    ProfileReadonlyFieldComponent
  ],
  templateUrl: './doctor-profile-form.component.html',
  styleUrl: './doctor-profile-form.component.css'
})
export class DoctorProfileFormComponent {
  private internalDoctor!: Doctor;
  private readonly photoStorageKey = 'medverse-doctor-profile-photo';

  editableDoctor!: Doctor;
  photoPreview = localStorage.getItem(this.photoStorageKey) || '';

  errors = {
    phone: '',
    designation: '',
    hospital: '',
    department: '',
    experience: ''
  };

  @Input()
  set doctor(value: Doctor) {
    this.internalDoctor = value;
    this.editableDoctor = { ...value };
    this.clearErrors();
  }

  get doctor(): Doctor {
    return this.internalDoctor;
  }

  @Output() saved = new EventEmitter();
  @Output() cancelled = new EventEmitter();

  validatePhone(): void {
    const value = this.editableDoctor.phone.trim();

    if (!value) {
      this.errors.phone = 'Phone number cannot be empty.';
      return;
    }

    if (/[^0-9\s+-]/.test(value)) {
      this.errors.phone = 'Phone number can only contain digits, spaces, + or -.';
      return;
    }

    this.errors.phone = '';
  }

  validateDesignation(): void {
    const value = this.editableDoctor.designation.trim();

    if (value === '' || /[^a-zA-Z\s]/.test(value)) {
      this.errors.designation = 'Designation accepts alphabets only and cannot be empty.';
      return;
    }

    this.errors.designation = '';
  }

  validateDepartment(): void {
    const value = this.editableDoctor.department.trim();

    if (value === '' || /[^a-zA-Z\s]/.test(value)) {
      this.errors.department = 'Department accepts alphabets only and cannot be empty.';
      return;
    }

    this.errors.department = '';
  }

  validateHospital(): void {
    const value = this.editableDoctor.hospital.trim();

    if (value.length < 3 || /[^a-zA-Z0-9\s-]/.test(value)) {
      this.errors.hospital = 'Hospital accepts letters, numbers, spaces and hyphen only. Minimum 3 characters required.';
      return;
    }

    this.errors.hospital = '';
  }

  validateExperience(): void {
    const value = Number(this.editableDoctor.experience);

    if (Number.isNaN(value) || value < 0 || value > 60) {
      this.errors.experience = 'Please enter a valid experience between 0 and 60 years.';
      return;
    }

    this.errors.experience = '';
  }

  saveProfile(): void {
    this.validatePhone();
    this.validateDesignation();
    this.validateHospital();
    this.validateDepartment();
    this.validateExperience();

    if (this.hasErrors()) {
      return;
    }

    this.saved.emit({ ...this.editableDoctor });
  }

  resetForm(): void {
    this.editableDoctor = { ...this.internalDoctor };
    this.clearErrors();
    this.cancelled.emit();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (): void => {
      this.photoPreview = String(reader.result || '');
      localStorage.setItem(this.photoStorageKey, this.photoPreview);
    };
    reader.readAsDataURL(file);
  }

  removePhoto(input: HTMLInputElement): void {
    this.photoPreview = '';
    input.value = '';
    localStorage.removeItem(this.photoStorageKey);
  }

  private hasErrors(): boolean {
    return (
      this.errors.phone !== '' ||
      this.errors.designation !== '' ||
      this.errors.hospital !== '' ||
      this.errors.department !== '' ||
      this.errors.experience !== ''
    );
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
}
