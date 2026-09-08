// import { CommonModule } from '@angular/common';
// import { Component, OnInit } from '@angular/core';
// import { RouterLink } from '@angular/router';

// type UserRole =
//   | 'LEARNER'
//   | 'DOCTOR'
//   | 'PATIENT'
//   | 'AUTH_OFFICER'
//   | 'ADMIN';

// interface FooterLink {
//   label: string;
//   route: string;
// }

// interface FooterConfig {
//   roleLabel: string;
//   description: string;
//   ctaText: string;
//   ctaRoute: string;
//   quickLinks: FooterLink[];
//   resources: FooterLink[];
// }

// @Component({
//   selector: 'app-footer',
//   standalone: true,
//   imports: [CommonModule, RouterLink],
//   templateUrl: './footer.component.html',
//   styleUrl: './footer.component.css'
// })
// export class FooterComponent implements OnInit {
//   currentYear = new Date().getFullYear();

//   currentRole: UserRole = 'LEARNER';

//   footerConfig!: FooterConfig;

//   private readonly footerByRole: Record<UserRole, FooterConfig> = {
//     LEARNER: {
//       roleLabel: 'Learner Platform',
//       description:
//         'Explore approved medical cases, submit new learning cases, save important cases, and grow through real clinical scenarios.',
//       ctaText: 'Submit a Case',
//       ctaRoute: '/learner/submit-new-case',
//       quickLinks: [
//         { label: 'Dashboard', route: '/learner/profile' },
//         { label: 'My Cases', route: '/learner/submissions' },
//         { label: 'Explore Cases', route: '/learner/explore-cases' },
//         { label: 'Saved Cases', route: '/learner/bookmarks' }
//       ],
//       resources: [
//         { label: 'Case Guidelines', route: '/learner/guidelines' },
//         { label: 'Case Templates', route: '/learner/templates' },
//         { label: 'Notifications', route: '/learner/notifications' },
//         { label: 'Help & Support', route: '/learner/support' }
//       ]
//     },

//     DOCTOR: {
//       roleLabel: 'Doctor Portal',
//       description:
//         'Manage patients, appointments, medical records, and clinical case interactions from one secure workspace.',
//       ctaText: 'View Patients',
//       ctaRoute: '/doctor/patients',
//       quickLinks: [
//         { label: 'Dashboard', route: '/doctor/dashboard' },
//         { label: 'Patients', route: '/doctor/patients' },
//         { label: 'Appointments', route: '/doctor/appointments' },
//         { label: 'Medical Records', route: '/doctor/records' }
//       ],
//       resources: [
//         { label: 'Clinical Cases', route: '/doctor/cases' },
//         { label: 'Notifications', route: '/doctor/notifications' },
//         { label: 'Profile', route: '/doctor/profile' },
//         { label: 'Help & Support', route: '/doctor/support' }
//       ]
//     },

//     PATIENT: {
//       roleLabel: 'Patient Portal',
//       description:
//         'Access your health records, appointments, doctors, and important medical updates in a simple secure space.',
//       ctaText: 'View Records',
//       ctaRoute: '/patient/records',
//       quickLinks: [
//         { label: 'Dashboard', route: '/patient/dashboard' },
//         { label: 'My Profile', route: '/patient/profile' },
//         { label: 'Medical Records', route: '/patient/records' },
//         { label: 'Appointments', route: '/patient/appointments' }
//       ],
//       resources: [
//         { label: 'Doctors', route: '/patient/doctors' },
//         { label: 'Notifications', route: '/patient/notifications' },
//         { label: 'Privacy', route: '/privacy-policy' },
//         { label: 'Help & Support', route: '/patient/support' }
//       ]
//     },

//     AUTH_OFFICER: {
//       roleLabel: 'Authentication Officer',
//       description:
//         'Review submitted medical cases, approve valid cases, reject incomplete cases, and maintain trusted case publishing.',
//       ctaText: 'Review Pending Cases',
//       ctaRoute: '/auth-officer/pending-cases',
//       quickLinks: [
//         { label: 'Dashboard', route: '/auth-officer/dashboard' },
//         { label: 'Pending Cases', route: '/auth-officer/pending-cases' },
//         { label: 'Approved Cases', route: '/auth-officer/approved-cases' },
//         { label: 'Rejected Cases', route: '/auth-officer/rejected-cases' }
//       ],
//       resources: [
//         { label: 'Profile', route: '/auth-officer/profile' },
//         { label: 'Notifications', route: '/auth-officer/notifications' },
//         { label: 'Review Guidelines', route: '/auth-officer/guidelines' },
//         { label: 'Help & Support', route: '/auth-officer/support' }
//       ]
//     },

//     ADMIN: {
//       roleLabel: 'Admin Console',
//       description:
//         'Manage users, approve or revoke access, monitor reports, and control platform-level operations.',
//       ctaText: 'Manage Profiles',
//       ctaRoute: '/admin/profiles',
//       quickLinks: [
//         { label: 'Dashboard', route: '/admin/dashboard' },
//         { label: 'Profiles', route: '/admin/profiles' },
//         { label: 'Doctors', route: '/admin/doctors' },
//         { label: 'Patients', route: '/admin/patients' }
//       ],
//       resources: [
//         { label: 'Auth Officers', route: '/admin/auth-officers' },
//         { label: 'Reports', route: '/admin/reports' },
//         { label: 'Settings', route: '/admin/settings' },
//         { label: 'Help & Support', route: '/admin/support' }
//       ]
//     }
//   };

//   ngOnInit(): void {
//     this.currentRole = this.getRoleFromStorage();
//     this.footerConfig = this.footerByRole[this.currentRole];
//   }

//   private getRoleFromStorage(): UserRole {
//     const role = localStorage.getItem('role') as UserRole | null;

//     if (
//       role === 'LEARNER' ||
//       role === 'DOCTOR' ||
//       role === 'PATIENT' ||
//       role === 'AUTH_OFFICER' ||
//       role === 'ADMIN'
//     ) {
//       return role;
//     }

//     return 'LEARNER';
//   }
// }

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  quickLinks = [
    { label: 'Dashboard', route: '/' },
    { label: 'My Cases', route: '/learner/submissions' },
    { label: 'Explore Cases', route: '/learner/explore-cases' },
    { label: 'Submit Case', route: '/learner/submit-new-case' }
  ];

  resources = [
    { label: 'Terms and Conditions', route: '/terms-conditions' },
    // { label: 'Case Templates', route: '/learner/templates' },
    { label: 'Help & Support', route: '/support' },
    { label: 'Privacy Policy', route: '/privacy-policy' }
  ];
}