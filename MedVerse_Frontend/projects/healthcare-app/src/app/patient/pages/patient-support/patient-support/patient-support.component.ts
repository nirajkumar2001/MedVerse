import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Patient } from '../../../core/models/patient.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';

import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';
import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface PatientFaq {
  question: string;
  answer: string;
  category: string;
}

@Component({
  selector: 'app-patient-support',
  standalone: true,
  imports: [
    CommonModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    LogoutConfirmModalComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './patient-support.component.html',
  styleUrl: './patient-support.component.css'
})
export class PatientSupportComponent implements OnInit, OnDestroy {
  patient!: Patient;
  showLogoutModal = false;

  readonly menuItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/patient/home', icon: 'D', exact: true },
    { label: 'My Profile', route: '/patient/profile', icon: 'P', exact: true },
    { label: 'Emergency Details', route: '/patient/emergency-details', icon: 'E', exact: true },
    { label: 'My Medical Records', route: '/patient/medical-records', icon: 'M', exact: true },
    { label: 'Access Requests', route: '/patient/notifications', icon: 'N', badgeCount: 2, exact: true },
    { label: 'Help & Support', route: '/patient/support', icon: 'H', exact: true }
  ];

  readonly faqs: PatientFaq[] = [
    {
      category: 'Profile',
      question: 'How do I update my personal profile?',
      answer: 'Open My Profile, edit the allowed fields such as contact details and address, then save your changes. System-managed details remain protected.'
    },
    {
      category: 'Emergency Details',
      question: 'Who can see my emergency details?',
      answer: 'Emergency details are available for urgent care situations. They include critical information such as blood group, allergies, conditions, medications, and emergency contact details.'
    },
    {
      category: 'Access Requests',
      question: 'How do I approve or reject doctor access?',
      answer: 'Open Access Requests, review the doctor name and reason, then choose Allow or Reject. You can also decide whether previous medical records should be included.'
    },
    {
      category: 'Medical Records',
      question: 'Can doctors see my previous medical records automatically?',
      answer: 'No. Doctors need your consent. If you allow previous records, they can view older records for the approved session; otherwise they only get limited profile access.'
    },
    {
      category: 'Records Export',
      question: 'Can I download my medical records?',
      answer: 'Yes. Open My Medical Records and use the export controls to download your available records in the supported format.'
    },
    {
      category: 'Security',
      question: 'What should I do if an access request looks unfamiliar?',
      answer: 'Reject the request and contact the healthcare desk. Do not approve access unless you recognize the doctor and understand the stated reason.'
    }
  ];

  private subscriptions = new Subscription();

  constructor(
    private patientService: PatientService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.patientService.getMyProfile().subscribe(patient => {
        this.patient = patient;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  confirmLogout(): void {
    this.showLogoutModal = false;
    this.authService.logout();
  }
}
