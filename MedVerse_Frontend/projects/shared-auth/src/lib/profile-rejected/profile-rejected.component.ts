import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LoginApiRequest, LoginResponse, SharedAuthService } from '../shared-auth.service';
import { RoleRedirectService } from '../role-redirect.service';

@Component({
  selector: 'lib-profile-rejected',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile-rejected.component.html',
  styleUrl: './profile-rejected.component.css'
})
export class ProfileRejectedComponent {
  private readonly loginRequest?: Pick<LoginApiRequest, 'userId' | 'password'>;
  readonly loginResponse?: LoginResponse;

  selectedFile: File | null = null;
  uploadedFileName = '';
  isSubmitting = false;

  constructor(
    private readonly router: Router,
    private readonly sharedAuthService: SharedAuthService,
    private readonly roleRedirect: RoleRedirectService
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state ?? history.state;
    this.loginRequest = state?.['loginRequest'];
    this.loginResponse = state?.['loginResponse'];

    if (!this.loginRequest?.userId || !this.loginRequest?.password) {
      this.router.navigate(['/login']);
    }
  }

  get rejectionReason(): string {
    const adminRemark = this.loginResponse?.reviewRemark?.trim();
    if (adminRemark) {
      return `Your submitted verification document was not accepted. ${adminRemark}`;
    }
    return 'Your submitted verification document was not accepted. Upload a corrected PDF so admin can review your profile again.';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.selectedFile = null;
      this.uploadedFileName = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Max file size is 10 MB.');
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.uploadedFileName = file.name;
  }

  resubmit(): void {
    if (!this.loginRequest || !this.selectedFile) {
      alert('Please upload corrected PDF document.');
      return;
    }

    this.isSubmitting = true;
    this.readFileAsDataUrl(this.selectedFile)
      .then(documentData => {
        this.sharedAuthService.resubmitRejectedProfile({
          userId: this.loginRequest!.userId,
          password: this.loginRequest!.password,
          documentName: this.selectedFile!.name,
          documentContentType: this.selectedFile!.type,
          documentData
        })
          .pipe(finalize(() => {
            this.isSubmitting = false;
          }))
          .subscribe({
            next: () => {
              this.loginPendingUser();
            },
            error: error => {
              if (error?.status >= 500) {
                this.router.navigate(['/internal-server']);
                return;
              }
              alert(error?.error?.message || 'Unable to resubmit document.');
            }
          });
      })
      .catch(() => {
        this.isSubmitting = false;
        alert('Unable to read the selected document.');
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

  private loginPendingUser(): void {
    if (!this.loginRequest) {
      this.router.navigate(['/login']);
      return;
    }

    this.sharedAuthService.login({
      userId: this.loginRequest.userId,
      password: this.loginRequest.password,
      deviceId: this.getDeviceId(),
      deviceType: 'WEB',
      deviceModel: navigator.userAgent,
      osVersion: navigator.platform,
      appVersion: '1.0'
    }).subscribe({
      next: response => {
        if (response.data?.status === 'DEVICE_LIMIT_EXCEEDED') {
          this.router.navigate(['/device-limit-reached'], {
            state: {
              loginRequest: {
                userId: this.loginRequest!.userId,
                password: this.loginRequest!.password,
                deviceId: this.getDeviceId(),
                deviceType: 'WEB',
                deviceModel: navigator.userAgent,
                osVersion: navigator.platform,
                appVersion: '1.0'
              },
              loginResponse: response.data
            }
          });
          return;
        }

        if (response.data?.status === 'SUCCESS') {
          localStorage.setItem('medverseCurrentUser', JSON.stringify(response.data));
          this.roleRedirect.redirectToBackendRole(response.data.role);
          return;
        }

        this.router.navigate(['/login']);
      },
      error: error => {
        if (error?.status >= 500) {
          this.router.navigate(['/internal-server']);
          return;
        }
        this.router.navigate(['/login']);
      }
    });
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
}
