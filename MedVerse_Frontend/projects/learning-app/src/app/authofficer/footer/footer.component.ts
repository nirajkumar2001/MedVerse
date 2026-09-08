import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-authofficer-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class AuthOfficerFooterComponent {
  currentYear = new Date().getFullYear();

  quickLinks = [
    { label: 'Dashboard', route: '/authofficer/auth-officer-dashboard' },
    { label: 'Verification Queue', route: '/authofficer/verification-queue' },
    { label: 'Approved Cases', route: '/authofficer/approved-cases' },
    { label: 'Rejected Cases', route: '/authofficer/rejected-cases' }
  ];

  resources = [
    { label: 'All Cases', route: '/authofficer/all-cases' },
    { label: 'My Profile', route: '/authofficer/profile' },
    { label: 'Help & Support', route: '/authofficer/support' },
    { label: 'Privacy Policy', route: '/privacy-policy' }
  ];
}
