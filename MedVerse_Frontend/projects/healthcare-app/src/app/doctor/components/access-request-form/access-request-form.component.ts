import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AccessRequestService } from '../../../core/services/access-request.service';
import { TrimLeadingSpaceDirective } from '../../../shared/directives/trim-leading-space.directive';

@Component({
  selector: 'app-access-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TrimLeadingSpaceDirective],
  templateUrl: './access-request-form.component.html',
  styleUrls: ['./access-request-form.component.css']
})
export class AccessRequestFormComponent {
  @Output() requestSent = new EventEmitter<string>();

  patientId = '';
  accessReason = '';
  requestPreviousRecords = false;

  patientIdError = '';
  reasonError = '';

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private readonly accessRequestService: AccessRequestService) {}

  onPatientIdInput(): void {
    this.patientId = String(this.patientId || '')
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 12);

    if (this.patientIdError) {
      this.validatePatientId();
    }
  }

  sendAccessRequest(): void {
    this.clearMessages();

    const isPatientValid = this.validatePatientId();
    const isReasonValid = this.validateReason();

    if (!isPatientValid || !isReasonValid) {
      return;
    }

    this.isSubmitting = true;

    this.accessRequestService
      .sendAccessRequest(
        this.patientId.trim().toUpperCase(),
        this.accessReason.trim(),
        this.requestPreviousRecords
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;

          /*
            Do not show raw backend wording such as
            "AccessNotification created successfully".
            Keep the UI message human-readable and consistent.
          */
          this.successMessage = this.requestPreviousRecords
            ? 'Access notification sent. Patient will see that previous medical records were requested.'
            : 'Access notification sent. Patient can approve access and also choose whether to allow previous medical records.';

          this.requestSent.emit(this.successMessage);

          this.patientId = '';
          this.accessReason = '';
          this.requestPreviousRecords = false;
        },
        error: error => {
          console.error('Unable to send access request:', error);

          this.isSubmitting = false;
          this.errorMessage =
            error?.error?.message ||
            error?.error?.data?.message ||
            error?.error?.data?.error ||
            'Unable to send access request. Please check the patient ID and try again.';
        }
      });
  }

  private validatePatientId(): boolean {
    const value = this.patientId.trim();

    if (!value) {
      this.patientIdError = 'Patient ID is required.';
      return false;
    }

    if (value.length < 4) {
      this.patientIdError = 'Enter a valid patient ID.';
      return false;
    }

    this.patientIdError = '';
    return true;
  }

  private validateReason(): boolean {
    const value = this.accessReason.trim();

    if (!value) {
      this.reasonError = 'Reason for access is required.';
      return false;
    }

    if (value.length < 8) {
      this.reasonError = 'Please enter a more specific clinical reason.';
      return false;
    }

    if (value.length > 240) {
      this.reasonError = 'Reason must be within 240 characters.';
      return false;
    }

    this.reasonError = '';
    return true;
  }


  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.patientIdError = '';
    this.reasonError = '';
  }
}