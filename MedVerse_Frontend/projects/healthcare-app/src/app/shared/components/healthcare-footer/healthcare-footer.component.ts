import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

type FooterRole = 'PATIENT' | 'DOCTOR';

interface FooterLink {
  label: string;
  route: string;
}

interface FooterConfig {
  roleLabel: string;
  roleTagline: string;
  description: string;
  platformLinks: FooterLink[];
  resourceLinks: FooterLink[];
  supportRoute: string;
}

@Component({
  selector: 'app-healthcare-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './healthcare-footer.component.html',
  styleUrls: ['./healthcare-footer.component.css']
})
export class HealthcareFooterComponent implements OnInit {
  @Input() tagline = 'Your Health, Our Priority';

  readonly logoSrc = '/shared-assets/Medverse_images/medverselogo.png';
  currentYear = new Date().getFullYear();
  currentRole: FooterRole = 'PATIENT';
  footerConfig!: FooterConfig;

  private readonly footerByRole: Record<FooterRole, FooterConfig> = {
    PATIENT: {
      roleLabel: 'Patient Portal',
      roleTagline: 'Personal health access',
      description:
        'MedVerse helps patients view medical records, emergency details, access requests, and secure healthcare updates from one trusted portal.',
      supportRoute: '/patient/support',
      platformLinks: [
        { label: 'Dashboard', route: '/patient/home' },
        { label: 'My Profile', route: '/patient/profile' },
        { label: 'My Medical Records', route: '/patient/medical-records' },
        { label: 'Emergency Details', route: '/patient/emergency-details' }
      ],
      resourceLinks: [
        { label: 'Access Requests', route: '/patient/notifications' },
        { label: 'Help & Support', route: '/patient/support' }
      ]
    },
    DOCTOR: {
      roleLabel: 'Doctor Portal',
      roleTagline: 'Clinical care workspace',
      description:
        'MedVerse supports doctors with secure patient access, emergency lookup, approved records, and connected healthcare workflows.',
      supportRoute: '/doctor/support',
      platformLinks: [
        { label: 'Dashboard', route: '/doctor/home' },
        { label: 'Patient Care', route: '/doctor/patient-care' },
        { label: 'Emergency Lookup', route: '/doctor/emergency-lookup' },
        { label: 'Notifications', route: '/doctor/notifications' }
      ],
      resourceLinks: [
        { label: 'Profile', route: '/doctor/profile' },
        { label: 'Notifications', route: '/doctor/notifications' },
        { label: 'Help & Support', route: '/doctor/support' }
      ]
    }
  };

  ngOnInit(): void {
    this.currentRole = this.resolveCurrentRole();
    this.footerConfig = this.footerByRole[this.currentRole];
  }

  private resolveCurrentRole(): FooterRole {
    const storedRole = this.getStoredRole();

    if (storedRole === 'DOCTOR') {
      return 'DOCTOR';
    }

    if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/doctor')) {
      return 'DOCTOR';
    }

    return 'PATIENT';
  }

  private getStoredRole(): string {
    if (typeof localStorage === 'undefined') {
      return '';
    }

    const rawUser = localStorage.getItem('medverseCurrentUser') || localStorage.getItem('currentUser');

    if (!rawUser) {
      return '';
    }

    try {
      const user = JSON.parse(rawUser);
      return String(user?.role || user?.data?.role || user?.user?.role || user?.roleName || '')
        .replace(/[_\s-]/g, '')
        .toUpperCase();
    } catch {
      return '';
    }
  }
}
