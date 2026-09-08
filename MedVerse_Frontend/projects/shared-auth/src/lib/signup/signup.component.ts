import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SharedAuthService } from '../shared-auth.service';
import { OtpWebSocketService } from '../otp-websocket.service';

interface SignupForm {
  fullName: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
  document: File | null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  // Add these at the top inside the SignupComponent class
  termsChecked = false;  // For the checkbox
  fullNameTouched = false;  // To track blur for Full Name
  emailTouched = false;     // To track blur for Email
  roleTouched = false;      // To track blur for Role
  passwordTouched = false;  // To track blur for Password
  confirmPasswordTouched = false; // To track blur for Confirm Password
  termsTouched = true;
  documentTouched = true;


  roles: string[] = ['Auth Officer', 'Learner', 'Doctor', 'Patient'];

  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  selectedFileName = 'Upload Document';

  form: SignupForm = {
    fullName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
    document: null
  };

  constructor(
    private router: Router,
    private sharedAuthService: SharedAuthService,
    private otpWebSocketService: OtpWebSocketService
  ) {}

  get hasMinLength(): boolean {
    return this.form.password.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.form.password);
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.form.password);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.form.password);
  }

  get hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.form.password);
  }

  get isPasswordValid(): boolean {
    return (
      this.hasMinLength &&
      this.hasUppercase &&
      this.hasLowercase &&
      this.hasNumber &&
      this.hasSpecialChar
    );
  }

  get passwordMatched(): boolean {
    return this.form.password === this.form.confirmPassword;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB.');
      input.value = '';
      return;
    }

    this.form.document = file;
    this.selectedFileName = file.name;
  }

  onSignup(): void {
    if (
      !this.form.fullName ||
      !this.form.email ||
      !this.form.role ||
      !this.form.password ||
      !this.form.confirmPassword
    ) {
      alert('Please fill all required fields.');
      return;
    }

    if (!this.isPasswordValid) {
      alert('Please complete all password requirements.');
      return;
    }

    if (!this.passwordMatched) {
      alert('Password and Confirm Password do not match.');
      return;
    }

    if (!this.form.document) {
      alert('Please upload verification document.');
      return;
    }

    this.isSubmitting = true;
    const otpRefId = `SIGNUP_${crypto.randomUUID()}`;
    const otpSubscription = this.otpWebSocketService.watchOtp(otpRefId).subscribe({
      next: payload => console.log('[SIGNUP_PAGE_OTP]', payload.otp),
      error: error => console.error('OTP WebSocket failed:', error)
    });

    this.readFileAsDataUrl(this.form.document)
      .then(documentData => this.sharedAuthService.signup({
        name: this.form.fullName,
        email: this.form.email,
        password: this.form.password,
        role: this.sharedAuthService.toBackendRole(this.form.role),
        documentName: this.form.document?.name,
        documentContentType: this.form.document?.type,
        documentData,
        otpRefId
      }).pipe(finalize(() => {
        this.isSubmitting = false;
      })).subscribe({
        next: response => {
          console.log('OTP sent to:', this.form.email);

          this.router.navigate(['/otp-verification'], {
            state: {
              signupData: {
                ...this.form,
                document: null
              },
              otpRefId: response.data?.otpRefId || otpRefId,
              receivedOtp: response.data?.otp
            }
          });
          window.setTimeout(() => otpSubscription.unsubscribe(), 5000);
        },
        error: error => {
          otpSubscription.unsubscribe();
          console.error('Signup failed:', error);
          alert(error?.error?.message || 'Unable to send OTP. Please try again.');
        }
      }))
      .catch(() => {
        otpSubscription.unsubscribe();
        this.isSubmitting = false;
        alert('Unable to read the selected document. Please choose the PDF again.');
      });
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
