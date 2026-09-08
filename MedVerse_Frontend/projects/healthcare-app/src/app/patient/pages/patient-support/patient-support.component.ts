import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { Patient } from '../../../core/models/patient.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { AccessRequestService } from '../../../core/services/access-request.service';
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
  keywords: string;
}

interface SupportTopic {
  icon: string;
  title: string;
  description: string;
  route: string;
  action: string;
}

@Component({
  selector: 'app-patient-support',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    LogoutConfirmModalComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './patient-support.component.html',
  styleUrls: ['./patient-support.component.css']
})
export class PatientSupportComponent implements OnInit, OnDestroy {
  private readonly photoStorageKey = 'medverse-patient-profile-photo';

  patient: Patient | null = null;
  patientPhoto = localStorage.getItem(this.photoStorageKey) || '';

  searchTerm = '';
  selectedCategory = 'All';
  pendingAccessCount = 0;
  showLogoutModal = false;
  isLoading = true;

  menuItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/patient/home', icon: 'D', exact: true },
    { label: 'My Profile', route: '/patient/profile', icon: 'P', exact: true },
    { label: 'Emergency Details', route: '/patient/emergency-details', icon: 'E', exact: true },
    { label: 'My Medical Records', route: '/patient/medical-records', icon: 'M', exact: true },
    { label: 'Access Requests', route: '/patient/notifications', icon: 'N', badgeCount: 0, exact: true },
    { label: 'Help & Support', route: '/patient/support', icon: 'H', exact: true }
  ];

  readonly supportTopics: SupportTopic[] = [
    {
      icon: 'PR',
      title: 'Profile & personal details',
      description: 'Update your name, address, profile photo, and emergency contact number from one place.',
      route: '/patient/profile',
      action: 'Open Profile'
    },
    {
      icon: 'ER',
      title: 'Emergency details',
      description: 'View critical emergency information. Medical fields are doctor-managed and patient-visible.',
      route: '/patient/emergency-details',
      action: 'View Emergency Details'
    },
    {
      icon: 'AR',
      title: 'Access requests',
      description: 'Approve, reject, or close doctor access sessions with clear consent control.',
      route: '/patient/notifications',
      action: 'Manage Requests'
    },
    {
      icon: 'MR',
      title: 'Medical records',
      description: 'Review doctor-updated visit history, disease notes, prescription, and medical documents.',
      route: '/patient/medical-records',
      action: 'Open Records'
    }
  ];

  readonly categories = [
    'All',
    'Profile',
    'Emergency Details',
    'Access Requests',
    'Medical Records',
    'Security'
  ];

  readonly faqs: PatientFaq[] = [
    {
      category: 'Profile',
      question: 'Which details can I edit in my patient profile?',
      answer: 'You can edit your general personal details such as name, age, gender, address, emergency contact number, and profile picture. Medical fields are not editable by patients.',
      keywords: 'profile edit personal name age gender address emergency contact photo'
    },
    {
      category: 'Profile',
      question: 'Will my emergency contact update in doctor emergency lookup?',
      answer: 'Yes. The emergency contact number saved in your patient profile is used by the emergency details and doctor emergency lookup flow.',
      keywords: 'emergency contact doctor lookup profile phone number'
    },
    {
      category: 'Emergency Details',
      question: 'Why can I only view emergency medical fields?',
      answer: 'Emergency medical fields such as blood group, allergies, chronic conditions, medication, vitals, and findings are doctor-managed to keep clinical information trusted and accurate.',
      keywords: 'emergency details blood group allergies chronic medication doctor managed view only'
    },
    {
      category: 'Access Requests',
      question: 'How do I approve or reject doctor access?',
      answer: 'Open Access Requests, review the doctor name and purpose, choose whether previous records can be included, then approve or reject the request.',
      keywords: 'approve reject doctor access request consent previous records'
    },
    {
      category: 'Access Requests',
      question: 'Can I stop an active doctor access session?',
      answer: 'Yes. In Access Requests, active sessions can be dismissed by you. After dismissal, the session moves out of the active section.',
      keywords: 'active session dismiss stop doctor access'
    },
    {
      category: 'Medical Records',
      question: 'Can I edit my medical records?',
      answer: 'No. Medical records are updated by doctors after approved access. You can view your current medical profile and previous records from My Medical Records.',
      keywords: 'medical records edit doctor updated view previous history'
    },
    {
      category: 'Medical Records',
      question: 'Where can I see previous visit history?',
      answer: 'Open My Medical Records to see doctor-updated visit history, disease information, findings, prescription, and available medical documents.',
      keywords: 'previous visit history disease findings prescription documents'
    },
    {
      category: 'Security',
      question: 'What should I do if an access request looks unfamiliar?',
      answer: 'Reject the request and contact support. Do not approve access unless you recognize the doctor and understand the reason for the request.',
      keywords: 'unknown request unfamiliar reject support security'
    },
    {
      category: 'Security',
      question: 'Why does MedVerse require consent for doctor access?',
      answer: 'Consent protects your medical privacy. Doctors can request access, but you stay in control of approval and whether previous records are included.',
      keywords: 'consent privacy previous records doctor permission'
    }
  ];

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly patientService: PatientService,
    private readonly accessRequestService: AccessRequestService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPatientProfile();
    this.loadAccessBadge();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get patientAny(): any {
    return this.patient as any;
  }

  get patientName(): string {
    return (
      this.patientAny?.fullName ||
      this.patientAny?.name ||
      this.patientAny?.patientName ||
      'Patient'
    );
  }

  get patientBadgeText(): string {
    const id =
      this.patientAny?.patientId ||
      this.patientAny?.userId ||
      this.patientAny?.id ||
      'Patient';

    return `ID: ${id}`;
  }

  get patientAvatarText(): string {
    return this.patientName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'P';
  }

  get patientPhotoUrl(): string {
    return (
      this.patientPhoto ||
      this.patientAny?.photoUrl ||
      this.patientAny?.profileImage ||
      this.patientAny?.profilePicture ||
      this.patientAny?.imageUrl ||
      ''
    );
  }

  get filteredFaqs(): PatientFaq[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.faqs.filter(faq => {
      const matchesCategory = this.selectedCategory === 'All' || faq.category === this.selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack = `${faq.category} ${faq.question} ${faq.answer} ${faq.keywords}`.toLowerCase();
      return haystack.includes(term);
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
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

  private loadPatientProfile(): void {
    this.isLoading = true;

    this.subscriptions.add(
      this.patientService.getMyProfile().subscribe({
        next: response => {
          this.patient = this.unwrap(response);
          this.isLoading = false;
        },
        error: error => {
          console.error('Unable to load patient profile for support page:', error);
          this.patient = null;
          this.isLoading = false;
        }
      })
    );
  }

  private loadAccessBadge(): void {
    this.subscriptions.add(
      this.accessRequestService.getForPatient(false).subscribe({
        next: response => {
          const requests = this.unwrapArray(response);
          this.pendingAccessCount = requests.filter((request: any) => {
            return String(request?.accessStatus ?? request?.status ?? '').toUpperCase() === 'PENDING';
          }).length;
          this.updateMenuBadge();
        },
        error: error => {
          console.error('Unable to load patient support access badge:', error);
          this.pendingAccessCount = 0;
          this.updateMenuBadge();
        }
      })
    );
  }

  private updateMenuBadge(): void {
    this.menuItems = this.menuItems.map(item => {
      if (item.route === '/patient/notifications') {
        return {
          ...item,
          badgeCount: this.pendingAccessCount
        };
      }

      return item;
    });
  }

  private unwrap(response: any): any {
    return response?.data ?? response ?? null;
  }

  private unwrapArray(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.result)) {
      return response.result;
    }

    if (Array.isArray(response?.content)) {
      return response.content;
    }

    return [];
  }
}
