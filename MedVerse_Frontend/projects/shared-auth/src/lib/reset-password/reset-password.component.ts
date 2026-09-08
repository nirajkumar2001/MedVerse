import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { SharedAuthService } from '../shared-auth.service';
import { OtpWebSocketService } from '../otp-websocket.service';

@Component({
  selector: 'lib-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs?: QueryList<ElementRef<HTMLInputElement>>;

  readonly resendCooldownSeconds = 15;
  readonly maxResendAttempts = 5;
  identifier = '';
  otpRefId = '';
  otpDigits = ['', '', '', '', '', ''];
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  isVerifying = false;
  isResetting = false;
  otpVerified = false;
  secondsRemaining = this.resendCooldownSeconds;
  resendAttempts = 0;
  resendLimitMessage = '';
  message = '';
  errorMessage = '';
  receivedOtp = '';
  receivedOtpMessage = '';
  showOtpDropdown = false;
  private otpSubscription?: Subscription;
  private timerId?: number;

  constructor(
    private readonly sharedAuthService: SharedAuthService,
    private readonly otpWebSocketService: OtpWebSocketService,
    private readonly router: Router
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state ?? history.state;
    this.identifier = state?.['identifier'] || '';
    this.otpRefId = state?.['otpRefId'] || '';
  }

  ngOnInit(): void {
    this.hydrateOtpFromStorage();
    this.subscribeToOtp();
    this.timerId = window.setInterval(() => {
      if (this.secondsRemaining > 0) {
        this.secondsRemaining -= 1;
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.otpSubscription?.unsubscribe();
    if (this.timerId) {
      window.clearInterval(this.timerId);
    }
  }

  get otp(): string {
    return this.otpDigits.join('');
  }

  get timerText(): string {
    const minutes = Math.floor(this.secondsRemaining / 60).toString().padStart(2, '0');
    const seconds = (this.secondsRemaining % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  get canResendOtp(): boolean {
    return this.secondsRemaining <= 0 && !this.resendLimitMessage && this.resendAttempts < this.maxResendAttempts;
  }

  get rules(): Array<{ label: string; valid: boolean }> {
    return [
      { label: 'At least 8 characters', valid: this.newPassword.length >= 8 },
      { label: 'At least 1 uppercase letter', valid: /[A-Z]/.test(this.newPassword) },
      { label: 'At least 1 number', valid: /\d/.test(this.newPassword) },
      { label: 'At least 1 special character', valid: /[^A-Za-z0-9]/.test(this.newPassword) }
    ];
  }

  get isPasswordValid(): boolean {
    return this.rules.every(rule => rule.valid);
  }

  updateOtp(value: string, index: number): void {
    const digit = value.replace(/\D/g, '').slice(-1);
    this.otpDigits[index] = digit;

    if (digit && index < this.otpDigits.length - 1) {
      this.otpInputs?.get(index + 1)?.nativeElement.focus();
    }
  }

  handleOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      this.otpInputs?.get(index - 1)?.nativeElement.focus();
    }
  }

  verifyOtp(): void {
    if (this.otp.length !== 6) {
      this.errorMessage = 'Enter the 6-digit OTP.';
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';

    window.setTimeout(() => {
      this.otpVerified = true;
      this.isVerifying = false;
      this.message = 'OTP verified. Set your new password.';
    }, 350);
  }

  resetPassword(): void {
    if (this.otp.length !== 6) {
      this.errorMessage = 'Verify the 6-digit OTP first.';
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

    this.isResetting = true;
    this.message = '';
    this.errorMessage = '';

    this.sharedAuthService.resetPassword({
      identifier: this.identifier,
      otpRefId: this.otpRefId,
      otp: this.otp,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    })
      .pipe(finalize(() => {
        this.isResetting = false;
      }))
      .subscribe({
        next: response => {
          this.message = response.message || 'Password reset successfully.';
          this.router.navigate(['/login']);
        },
        error: error => {
          console.error('Reset password failed:', error);
          this.errorMessage = error?.error?.message || 'Could not reset password. Please try again.';
        }
      });
  }

  resendOtp(): void {
    if (!this.canResendOtp) {
      return;
    }

    this.otpDigits = ['', '', '', '', '', ''];
    this.message = '';
    this.errorMessage = '';
    this.receivedOtp = '';
    this.receivedOtpMessage = 'Waiting for new OTP...';
    this.secondsRemaining = this.resendCooldownSeconds;

    this.sharedAuthService.resendPasswordResetOtp(this.otpRefId).subscribe({
      next: response => {
        this.resendAttempts++;
        this.message = response.message || 'A new OTP has been sent.';
        console.log('[RESET_PASSWORD_RESEND_OTP_REQUESTED]', this.otpRefId);
        if (this.resendAttempts >= this.maxResendAttempts) {
          this.lockResend();
        }
      },
      error: error => {
        console.error('Resend reset OTP failed:', error);
        this.errorMessage = error?.error?.message || 'Unable to resend OTP. Please start password reset again.';
        if (this.errorMessage.toLowerCase().includes('max otp resend limit')) {
          this.lockResend();
        }
      }
    });
  }

  private fillOtpFromDigits(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    this.otpDigits = ['', '', '', '', '', ''];
    digits.split('').forEach((digit, index) => {
      this.otpDigits[index] = digit;
    });
    this.errorMessage = '';
  }

  private lockResend(): void {
    this.secondsRemaining = 0;
    this.resendLimitMessage = 'You have reached the max OTP resend limit. Please try after some time.';
  }

  private subscribeToOtp(): void {
    if (!this.otpRefId) {
      return;
    }

    this.otpSubscription = this.otpWebSocketService.watchOtp(this.otpRefId).subscribe({
      next: payload => {
        this.receivedOtp = payload.otp;
        this.receivedOtpMessage = `OTP received in real time for session ${payload.sessionId}`;
        console.log('[RESET_PASSWORD_PAGE_OTP]', payload.otp);
      },
      error: error => console.error('OTP WebSocket failed:', error)
    });
  }

  private hydrateOtpFromStorage(): void {
    const storedOtp = this.otpRefId ? sessionStorage.getItem(`medverse-otp:${this.otpRefId}`) : '';
    if (!storedOtp) {
      return;
    }

    this.receivedOtp = storedOtp;
    this.receivedOtpMessage = `OTP loaded from real-time session ${this.otpRefId}`;
    console.log('[RESET_PASSWORD_STORED_OTP]', storedOtp);
  }

}
