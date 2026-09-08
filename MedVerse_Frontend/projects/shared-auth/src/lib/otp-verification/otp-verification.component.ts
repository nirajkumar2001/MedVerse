import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { SharedAuthService } from '../shared-auth.service';
import { OtpWebSocketMessage, OtpWebSocketService } from '../otp-websocket.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './otp-verification.component.html',
  styleUrl: './otp-verification.component.css'
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly resendCooldownSeconds = 15;
  readonly maxResendAttempts = 3;
  signupData: any = null;
  email = '';
  otp: string[] = ['', '', '', '', '', ''];

  timer = this.resendCooldownSeconds;
  canResend = false;
  resendAttempts = 0;
  resendLimitMessage = '';
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private redirectIntervalId: ReturnType<typeof setInterval> | null = null;
  private otpSubscription?: Subscription;

  isVerifying = false;
  errorMessage = '';
  successMessage = '';
  showAccountCreatedPopup = false;
  createdUserId = '';
  redirectSeconds = 60;
  receivedOtp = '';
  receivedOtpMessage = '';
  showOtpDropdown = true;

  constructor(
    private router: Router,
    private sharedAuthService: SharedAuthService,
    private otpWebSocketService: OtpWebSocketService
  ) {}

  ngOnInit(): void {
    const navigationState = history.state;

    if (!navigationState.signupData) {
      alert('Signup data not found. Please signup again.');
      this.router.navigate(['/signup']);
      return;
    }

    this.signupData = navigationState.signupData;
    this.email = this.signupData.email;
    this.signupData.otpRefId = navigationState.otpRefId;
    this.applyOtpFallback(navigationState.receivedOtp, 'signup response');

    this.subscribeToOtp();
    this.hydrateOtpFromStorage();
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.redirectIntervalId) {
      clearInterval(this.redirectIntervalId);
    }
    this.otpSubscription?.unsubscribe();
  }

  get enteredOtp(): string {
    return this.otp.join('');
  }

  get isOtpComplete(): boolean {
    return this.enteredOtp.length === 6 && this.otp.every(value => value !== '');
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');

    if (value.length > 1) {
      this.fillOtpFromDigits(value, index);
      return;
    }

    this.otp[index] = value;
    input.value = this.otp[index];

    this.errorMessage = '';

    if (value && index < 5) {
      const nextInput = this.otpInputs.toArray()[index + 1];
      nextInput.nativeElement.focus();
    }
  }

  onOtpFocus(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !input.value && index > 0) {
      const previousInput = this.otpInputs.toArray()[index - 1];
      previousInput.nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6);

    if (!digits) return;

    this.fillOtpFromDigits(digits, 0);
  }

  trackByIndex(index: number): number {
    return index;
  }

  verifyOtp(): void {
    if (!this.isOtpComplete) {
      this.errorMessage = 'Please enter the complete 6-digit OTP.';
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.sharedAuthService.verifyOtp({
      otpRefId: this.signupData.otpRefId,
      otp: this.enteredOtp,
      identifier: this.email,
      deviceId: this.getDeviceId(),
      deviceType: 'WEB',
      deviceModel: navigator.userAgent,
      osVersion: navigator.platform,
      appVersion: '1.0'
    })
      .pipe(finalize(() => {
        this.isVerifying = false;
      }))
      .subscribe({
        next: response => {
          console.log('OTP verified successfully.');
          this.createdUserId = response.data?.userId || this.signupData?.userId || '';
          this.successMessage = '';
          this.showAccountCreatedPopup = true;
          this.startRedirectCountdown();
        },
        error: error => {
          console.error('OTP verification failed:', error);
          this.errorMessage = error?.error?.message || 'Invalid OTP. Please try again.';
        }
      });
  }

  goToLogin(): void {
    this.clearRedirectCountdown();
    this.router.navigate(['/login']);
  }

  resendOtp(): void {
    if (!this.canResend) return;
    if (this.resendAttempts >= this.maxResendAttempts) {
      this.lockResend();
      return;
    }

    this.otp = ['', '', '', '', '', ''];
    this.errorMessage = '';
    this.successMessage = '';
    this.receivedOtp = '';
    this.receivedOtpMessage = 'Waiting for new OTP...';

    this.timer = this.resendCooldownSeconds;
    this.canResend = false;
    this.startTimer();

    this.sharedAuthService.resendOtp(this.signupData.otpRefId).subscribe({
      next: response => {
        this.resendAttempts++;
        this.successMessage = response.message || 'A new OTP has been sent.';
        this.applyOtpFallback(response.data?.otp, 'resend response');
        console.log('[RESEND_OTP_REQUESTED]', this.signupData.otpRefId);
        if (this.resendAttempts >= this.maxResendAttempts) {
          this.lockResend();
        }
        setTimeout(() => {
          this.successMessage = '';
        }, 2500);
      },
      error: error => {
        console.error('Resend OTP failed:', error);
        this.errorMessage = error?.error?.message || 'Unable to resend OTP. Please signup again.';
        if (this.errorMessage.toLowerCase().includes('max otp resend limit')) {
          this.lockResend();
          return;
        }
        this.canResend = !this.resendLimitMessage;
      }
    });
  }

  private startTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.timer--;

      if (this.timer <= 0) {
        this.canResend = this.resendAttempts < this.maxResendAttempts;
        if (this.intervalId) {
          clearInterval(this.intervalId);
        }
      }
    }, 1000);
  }

  private lockResend(): void {
    this.canResend = false;
    this.resendLimitMessage = 'You have reached the max OTP resend limit. Please try after some time.';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private fillOtpFromDigits(value: string, startIndex: number): void {
    const digits = value.replace(/[^0-9]/g, '').slice(0, 6 - startIndex);

    digits.split('').forEach((digit, offset) => {
      this.otp[startIndex + offset] = digit;
    });

    this.errorMessage = '';

    setTimeout(() => {
      const inputs = this.otpInputs.toArray();
      const nextIndex = Math.min(startIndex + digits.length, 5);
      inputs[nextIndex]?.nativeElement.focus();
      inputs[nextIndex]?.nativeElement.select();
    });
  }

  private subscribeToOtp(): void {
    const otpRefId = this.signupData?.otpRefId;
    if (!otpRefId) {
      return;
    }

    this.otpSubscription = new Subscription();
    this.otpSubscription.add(this.otpWebSocketService.otpMessages$.subscribe(payload => {
      if (payload.otpRefId === otpRefId || payload.sessionId === otpRefId) {
        this.applyReceivedOtp(payload, 'shared session');
      }
    }));

    this.otpSubscription.add(this.otpWebSocketService.watchOtp(otpRefId).subscribe({
      next: payload => this.applyReceivedOtp(payload, 'real time'),
      error: error => console.error('OTP WebSocket failed:', error)
    }));
  }

  private hydrateOtpFromStorage(): void {
    const otpRefId = this.signupData?.otpRefId;
    const storedOtp = otpRefId ? sessionStorage.getItem(`medverse-otp:${otpRefId}`) : '';
    if (!storedOtp) {
      return;
    }

    this.receivedOtp = storedOtp;
    this.receivedOtpMessage = `OTP loaded from real-time session ${otpRefId}`;
    this.showOtpDropdown = true;
    console.log('[OTP_VERIFICATION_PAGE_STORED_OTP]', storedOtp);
  }

  private applyOtpFallback(otp: string | undefined, source: string): void {
    if (!otp) {
      return;
    }

    const otpRefId = this.signupData?.otpRefId;
    if (otpRefId) {
      sessionStorage.setItem(`medverse-otp:${otpRefId}`, otp);
    }
    this.receivedOtp = otp;
    this.receivedOtpMessage = `OTP loaded from ${source}`;
    this.showOtpDropdown = true;
    console.log('[OTP_VERIFICATION_PAGE_FALLBACK_OTP]', otp);
  }

  private applyReceivedOtp(payload: OtpWebSocketMessage, source: string): void {
    this.receivedOtp = payload.otp;
    this.receivedOtpMessage = `OTP received from ${source} for session ${payload.sessionId}`;
    this.showOtpDropdown = true;
    console.log('[OTP_VERIFICATION_PAGE_OTP]', payload.otp);
  }

  private getDeviceId(): string {
    const storageKey = 'medverseDeviceId';
    let deviceId = localStorage.getItem(storageKey);

    if (!deviceId) {
      deviceId = `WEB_${crypto.randomUUID()}`;
      localStorage.setItem(storageKey, deviceId);
    }

    return deviceId;
  }

  private startRedirectCountdown(): void {
    this.clearRedirectCountdown();
    this.redirectSeconds = 60;

    this.redirectIntervalId = setInterval(() => {
      this.redirectSeconds--;

      if (this.redirectSeconds <= 0) {
        this.goToLogin();
      }
    }, 1000);
  }

  private clearRedirectCountdown(): void {
    if (this.redirectIntervalId) {
      clearInterval(this.redirectIntervalId);
      this.redirectIntervalId = null;
    }
  }
}
