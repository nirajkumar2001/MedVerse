import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MedAuthRole, RoleRedirectService } from '../role-redirect.service';
import { BackendRole, SharedAuthService } from '../shared-auth.service';

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  form = {
    userId: '',
    password: ''
  };

  showPassword = false;
  isLoggingIn = false;
  isCheckingSession = true;
  accountPopupOpen = false;
  accountPopupTitle = '';
  accountPopupMessage = '';
  accountPopupUserId = '';
  accountPopupSeconds = 30;

  private accountPopupTimerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly roleRedirect: RoleRedirectService,
    private readonly sharedAuthService: SharedAuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const queryStatus = this.route.snapshot.queryParamMap.get('accountStatus');
    if (this.isBlockedAuthStatus(queryStatus || undefined)) {
      this.isCheckingSession = false;
      this.sharedAuthService.clearClientSession();
      this.showAccountStatusPopup(queryStatus || undefined, this.route.snapshot.queryParamMap.get('userId') || this.form.userId);
      return;
    }

    this.sharedAuthService.getCurrentSession().subscribe(session => {
      this.isCheckingSession = false;

      if (!session) {
        this.sharedAuthService.clearClientSession();
        return;
      }

      if (this.isBlockedAuthStatus(session.authStatus)) {
        this.sharedAuthService.logout().subscribe({
          next: () => this.sharedAuthService.clearClientSession(),
          error: () => this.sharedAuthService.clearClientSession()
        });
        this.showAccountStatusPopup(session.authStatus, session.userId);
        return;
      }

      localStorage.setItem('medverseCurrentUser', JSON.stringify(session));
      this.roleRedirect.redirectToRole(this.toMedAuthRole(session.role));
    });
  }

  ngOnDestroy(): void {
    this.clearAccountPopupCountdown();
  }

  onLogin(): void {
    if (this.isCheckingSession) {
      return;
    }

    if (!this.form.userId || !this.form.password) {
      alert('Please enter User ID / Email and Password.');
      return;
    }

    this.isLoggingIn = true;

    const loginRequest = {
      userId: this.form.userId,
      password: this.form.password,
      deviceId: this.getDeviceId(),
      deviceType: 'WEB',
      deviceModel: navigator.userAgent,
      osVersion: navigator.platform,
      appVersion: '1.0'
    };

    this.sharedAuthService.login(loginRequest)
      .pipe(finalize(() => {
        this.isLoggingIn = false;
      }))
      .subscribe({
        next: response => {
          if (response.data?.status !== 'SUCCESS') {
            if (response.data?.status === 'PROFILE_PENDING' || response.data?.authStatus === 'PENDING') {
              this.sharedAuthService.clearClientSession();
              this.showAccountStatusPopup('PENDING', response.data?.userId || this.form.userId);
              return;
            }

            if (response.data?.status === 'ACCOUNT_SUSPENDED' || response.data?.authStatus === 'SUSPENDED') {
              this.sharedAuthService.clearClientSession();
              this.showAccountStatusPopup('SUSPENDED', response.data?.userId || this.form.userId);
              return;
            }

            if (response.data?.status === 'DEVICE_LIMIT_EXCEEDED') {
              this.router.navigate(['/device-limit-reached'], {
                state: {
                  loginRequest,
                  loginResponse: response.data
                }
              });
              return;
            }

            if (response.data?.status === 'PROFILE_REJECTED') {
              this.router.navigate(['/profile-rejected'], {
                state: {
                  loginRequest,
                  loginResponse: response.data
                }
              });
              return;
            }

            alert(response.message || 'Login could not be completed.');
            return;
          }

          const responseRole = response.data?.role;
          if (this.isBlockedAuthStatus(response.data?.authStatus)) {
            this.sharedAuthService.clearClientSession();
            this.showAccountStatusPopup(response.data?.authStatus, response.data?.userId || this.form.userId);
            return;
          }

          localStorage.setItem('medverseCurrentUser', JSON.stringify(response.data));
          this.storeAuthTokens(response);
          this.roleRedirect.redirectToBackendRole(responseRole || '');
        },
        error: error => {
          console.error('Login failed:', error);
          const errorMessage = error?.error?.message || error?.error?.data?.error || '';
          const normalizedErrorMessage = String(errorMessage).toLowerCase();
          if (error?.status === 403 &&
            (normalizedErrorMessage.includes('suspended') ||
              normalizedErrorMessage.includes('disabled') ||
              normalizedErrorMessage.includes('document'))) {
            this.sharedAuthService.clearClientSession();
            this.showAccountStatusPopup('SUSPENDED', this.form.userId);
            return;
          }

          if (error?.status >= 500) {
            this.router.navigate(['/internal-server']);
            return;
          }
          alert(errorMessage || 'Login failed. Please check your credentials.');
        }
      });
  }

  login(): void {
    this.onLogin();
  }

  private toMedAuthRole(role?: BackendRole): MedAuthRole {
    switch (role) {
      case 'LEARNER':
        return 'learner';
      case 'PATIENT':
        return 'patient';
      case 'DOCTOR':
        return 'doctor';
      case 'AUTHOFFICER':
        return 'authOfficer';
      case 'ADMIN':
        return 'admin';
      default:
        return 'learner';
    }
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

  private storeAuthTokens(response: any): void {
    const data = response?.data || {};
    const accessToken = response?.accessToken || response?.token || data.accessToken || data.token || data.jwtToken;
    const refreshToken = response?.refreshToken || data.refreshToken;

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('authToken', accessToken);
    }

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  goToLoginNow(): void {
    this.closeAccountStatusPopup();
    this.router.navigate(['/login']);
  }

  private showAccountStatusPopup(status: string | undefined, userId: string): void {
    const normalizedStatus = String(status || '').toUpperCase();
    this.accountPopupUserId = userId;
    this.accountPopupSeconds = 30;
    this.accountPopupOpen = true;
    this.form = {
      userId: '',
      password: ''
    };
    this.showPassword = false;

    if (normalizedStatus === 'SUSPENDED') {
      this.accountPopupTitle = 'Account suspended';
      this.accountPopupMessage = 'Your account is suspended because the verification document was rejected multiple times. Please create another account if you want to use this service.';
    } else {
      this.accountPopupTitle = 'Account in verification';
      this.accountPopupMessage = 'Your account is in the verification stage. Once your account is verified, you can login.';
    }

    this.startAccountPopupCountdown();
  }

  private startAccountPopupCountdown(): void {
    this.clearAccountPopupCountdown();
    this.accountPopupTimerId = setInterval(() => {
      this.accountPopupSeconds--;

      if (this.accountPopupSeconds <= 0) {
        this.goToLoginNow();
      }
    }, 1000);
  }

  private closeAccountStatusPopup(): void {
    this.accountPopupOpen = false;
    this.clearAccountPopupCountdown();
  }

  private clearAccountPopupCountdown(): void {
    if (this.accountPopupTimerId) {
      clearInterval(this.accountPopupTimerId);
      this.accountPopupTimerId = null;
    }
  }

  private isBlockedAuthStatus(status: string | undefined): boolean {
    const normalizedStatus = String(status || '').toUpperCase();
    return normalizedStatus === 'PENDING' || normalizedStatus === 'SUSPENDED';
  }
}
