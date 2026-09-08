import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-footer.component.html',
  styleUrl: './admin-footer.component.css'
})
export class AdminFooterComponent {
  currentYear = new Date().getFullYear();

  quickLinks = [
    { label: 'Dashboard', route: '/admin/dashboard' },
    { label: 'Profiles', route: '/admin/profiles' },
    { label: 'Approved Users', route: '/admin/approved-users' },
    { label: 'Rejected Users', route: '/admin/rejected-users' }
  ];

  resources = [
    { label: 'Reports', route: '/admin/reports' },
    { label: 'Alerts', route: '/admin/alerts' },
    { label: 'Change Password', route: '/change-password' },
    { label: 'Privacy Policy', route: '/privacy-policy' }
  ];
}
