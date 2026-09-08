import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedAuthService } from '../shared-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isUpdating = false;
  message = '';
  errorMessage = '';
  showSuccessPopup = false;

  constructor(
    private readonly sharedAuthService: SharedAuthService,
    private readonly router: Router
  ) {}

  get rules(): Array<{ label: string; valid: boolean }> {
    return [
      { label: 'At least 8 characters', valid: this.newPassword.length >= 8 },
      { label: 'At least 1 uppercase letter (A-Z)', valid: /[A-Z]/.test(this.newPassword) },
      { label: 'At least 1 number (0-9)', valid: /\d/.test(this.newPassword) },
      { label: 'At least 1 special character (e.g., !@#$%^&*)', valid: /[^A-Za-z0-9]/.test(this.newPassword) }
    ];
  }

  get isPasswordValid(): boolean {
    return this.rules.every(rule => rule.valid);
  }

  updatePassword(): void {
    if (!this.currentPassword) {
      this.errorMessage = 'Enter your current password.';
      return;
    }

    if (!this.isPasswordValid) {
      this.errorMessage = 'Please meet all password requirements.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirm password do not match.';
      return;
    }

    this.isUpdating = true;
    this.message = '';
    this.errorMessage = '';

    this.sharedAuthService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    })
      .pipe(finalize(() => {
        this.isUpdating = false;
      }))
      .subscribe({
        next: response => {
          this.message = response.message || 'Password updated successfully.';
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.showSuccessPopup = true;
        },
        error: error => {
          console.error('Change password failed:', error);
          this.errorMessage = error?.error?.message || 'Could not update password. Please try again.';
        }
      });
  }

  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
    this.sharedAuthService.clearClientSession();
    this.router.navigate(['/login']);
  }

}
