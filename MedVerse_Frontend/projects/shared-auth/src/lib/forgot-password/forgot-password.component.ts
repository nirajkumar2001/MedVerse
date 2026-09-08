import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SharedAuthService } from '../shared-auth.service';
import { OtpWebSocketService } from '../otp-websocket.service';

@Component({
  selector: 'lib-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  identifier = '';
  isSending = false;
  message = '';
  errorMessage = '';

  constructor(
    private readonly sharedAuthService: SharedAuthService,
    private readonly otpWebSocketService: OtpWebSocketService,
    private readonly router: Router
  ) {}

  sendOtp(): void {
    const identifier = this.identifier.trim();

    if (!identifier) {
      this.errorMessage = 'Enter your email address or User ID.';
      return;
    }

    this.isSending = true;
    this.message = '';
    this.errorMessage = '';
    const otpRefId = `RESET_${crypto.randomUUID()}`;

    // Subscribe before the REST call so the WebSocket OTP can be captured immediately.
    const otpSubscription = this.otpWebSocketService.watchOtp(otpRefId).subscribe({
      next: payload => console.log('[FORGOT_PASSWORD_OTP]', payload.otp),
      error: error => console.error('OTP WebSocket failed:', error)
    });

    this.sharedAuthService.forgotPassword({ identifier, otpRefId })
      .pipe(finalize(() => {
        this.isSending = false;
      }))
      .subscribe({
        next: response => {
          this.message = response.message || 'OTP sent successfully.';
          this.router.navigate(['/reset-password'], {
            state: {
              identifier,
              otpRefId: response.data?.otpRefId || otpRefId
            }
          });
          window.setTimeout(() => otpSubscription.unsubscribe(), 5000);
        },
        error: error => {
          otpSubscription.unsubscribe();
          console.error('Forgot password failed:', error);
          this.errorMessage = error?.error?.message || 'Could not send OTP. Please try again.';
        }
      });
  }

}
