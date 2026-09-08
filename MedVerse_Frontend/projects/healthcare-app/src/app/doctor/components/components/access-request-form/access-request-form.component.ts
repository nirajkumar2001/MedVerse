import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AccessRequestService } from '../../../core/services/access-request.service';
import { TrimLeadingSpaceDirective } from '../../../shared/directives/trim-leading-space.directive';
import { FormFieldErrorComponent } from '../../../shared/components/form-field-error/form-field-error.component';

@Component({
  selector: 'app-access-request-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TrimLeadingSpaceDirective,
    FormFieldErrorComponent
  ],
  templateUrl: './access-request-form.component.html',
  styleUrl: './access-request-form.component.css'
})
export class AccessRequestFormComponent {
  @Output() requestSent = new EventEmitter<string>();

  patientId = '';
  accessReason = '';

  patientIdError = '';
  reasonError = '';
  successMessage = '';
  isSubmitting = false;

  constructor(private accessRequestService: AccessRequestService) {}

  onPatientIdInput(): void {
    this.successMessage = '';
    this.patientId = this.patientId.toUpperCase();

    if (!this.patientId) {
      this.patientIdError = '';
      return;
    }

    if (!/^(PAT)?\d*$/.test(this.patientId)) {
      this.patientIdError = 'Patient ID must match PAT + 5 digits.';
      return;
    }

    if (this.patientId.length > 8) {
      this.patientId = this.patientId.slice(0, 8);
    }

    this.patientIdError = '';
  }

  sendAccessRequest(): void {
    this.patientIdError = '';
    this.reasonError = '';
    this.successMessage = '';

    if (!/^(PAT)?\d{5}$/.test(this.patientId.toUpperCase())) {
      this.patientIdError = 'Enter a valid Patient ID, for example PAT00001.';
      return;
    }

    if (!this.accessReason.trim()) {
      this.reasonError = 'Please enter reason for access.';
      return;
    }

    this.isSubmitting = true;
    this.accessRequestService.sendAccessRequestToApi(this.patientId, this.accessReason.trim()).subscribe((response: any) => {
      this.isSubmitting = false;

      if (!response.success) {
        this.patientIdError = response.message;
        return;
      }

      this.successMessage = response.message;
      this.requestSent.emit(response.message);

      this.patientId = '';
      this.accessReason = '';
    });
  }
}
