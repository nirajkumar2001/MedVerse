import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { ActiveDevice, BackendRole, LoginApiRequest, LoginResponse, SharedAuthService } from '../shared-auth.service';
import { MedAuthRole, RoleRedirectService } from '../role-redirect.service';

@Component({
  selector: 'lib-device-limit-reached',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-limit-reached.component.html',
  styleUrl: './device-limit-reached.component.css'
})
export class DeviceLimitReachedComponent {
  readonly maxDevices = 3;
  selectedDeviceRefId = 'windows-pc';
  isContinuing = false;
  errorMessage = '';

  private readonly loginRequest?: LoginApiRequest;
  private readonly loginResponse?: LoginResponse;

  devices: ActiveDevice[] = [
    {
      deviceRefId: 'macbook-pro',
      deviceName: 'MacBook Pro',
      browser: 'Chrome',
      location: 'Noida, India',
      lastActive: 'Active now',
      os: 'mac',
      isActiveNow: true
    },
    {
      deviceRefId: 'iphone-15',
      deviceName: 'iPhone 15',
      browser: 'Safari',
      location: 'Noida, India',
      lastActive: '2 hours ago',
      os: 'ios'
    },
    {
      deviceRefId: 'windows-pc',
      deviceName: 'Windows PC',
      browser: 'Edge',
      location: 'Noida, India',
      lastActive: 'Yesterday',
      os: 'windows'
    }
  ];

  currentDevice: ActiveDevice = {
    deviceRefId: 'current-login',
    deviceName: 'New login attempt',
    browser: 'This device',
    location: 'Noida, India',
    lastActive: 'Just now',
    os: 'web',
    isCurrentDevice: true
  };

  constructor(
    private readonly router: Router,
    private readonly sharedAuthService: SharedAuthService,
    private readonly roleRedirect: RoleRedirectService
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state ?? history.state;
    this.loginRequest = state?.['loginRequest'];
    this.loginResponse = state?.['loginResponse'];

    if (this.loginResponse?.activeDevices?.length) {
      this.devices = this.loginResponse.activeDevices.map(device => this.normalizeDevice(device));
      this.selectedDeviceRefId = this.devices[0].deviceRefId;
    }

    if (this.loginResponse?.currentLoginDevice) {
      this.currentDevice = this.loginResponse.currentLoginDevice;
    }
  }

  selectDevice(deviceRefId: string): void {
    this.selectedDeviceRefId = deviceRefId;
    this.errorMessage = '';
  }

  cancel(): void {
    this.router.navigate(['/login']);
  }

  logoutAndContinue(): void {
    const selectedDevice = this.devices.find(device => device.deviceRefId === this.selectedDeviceRefId);

    if (!selectedDevice) {
      this.errorMessage = 'Select a device to log out before continuing.';
      return;
    }

    if (!this.loginRequest) {
      this.devices = this.devices.filter(device => device.deviceRefId !== selectedDevice.deviceRefId);
      this.router.navigate(['/login']);
      return;
    }

    const loginRequest = this.loginRequest;
    this.isContinuing = true;
    this.errorMessage = '';

    this.sharedAuthService.logoutDevice({
      tempToken: this.loginResponse?.tempToken,
      userId: this.loginRequest.userId,
      deviceRefId: selectedDevice.deviceRefId
    })
      .pipe(
        switchMap(() => this.sharedAuthService.login(loginRequest)),
        finalize(() => {
          this.isContinuing = false;
        })
      )
      .subscribe({
        next: response => {
          if (response.data?.status !== 'SUCCESS') {
            this.errorMessage = response.message || 'Login could not be completed after logging out the selected device.';
            return;
          }

          localStorage.setItem('medverseCurrentUser', JSON.stringify(response.data));
          this.roleRedirect.redirectToRole(this.toMedAuthRole(response.data.role));
        },
        error: error => {
          console.error('Device logout failed:', error);
          this.errorMessage = error?.error?.message || 'Could not log out the selected device. Please try again.';
        }
      });
  }

  getDeviceInitial(device: ActiveDevice): string {
    if (device.os === 'windows') {
      return 'W';
    }

    if (device.os === 'ios') {
      return 'M';
    }

    if (device.os === 'mac') {
      return 'D';
    }

    return 'N';
  }

  private normalizeDevice(device: ActiveDevice): ActiveDevice {
    const model = device.deviceName || device.deviceModel || device.deviceType || 'Active Device';
    const os = device.os || this.inferOs(model, device.osVersion);

    return {
      ...device,
      deviceName: model,
      browser: device.browser || device.osVersion || 'Web session',
      location: device.location || 'Noida, India',
      lastActive: device.lastActive || (device.createdAt ? 'Logged in' : 'Active session'),
      os
    };
  }

  private inferOs(model?: string, osVersion?: string): string {
    const value = `${model || ''} ${osVersion || ''}`.toLowerCase();

    if (value.includes('iphone') || value.includes('ios')) {
      return 'ios';
    }

    if (value.includes('windows')) {
      return 'windows';
    }

    if (value.includes('mac')) {
      return 'mac';
    }

    return 'web';
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

}
