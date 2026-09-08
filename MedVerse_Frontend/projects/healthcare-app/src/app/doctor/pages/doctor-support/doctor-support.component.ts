import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { Doctor } from '../../../core/models/doctor.model';
import { AppNotification } from '../../../core/models/app-notification.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { NotificationService } from '../../../core/services/notification.service';

import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';

interface GuideStep {
  number: string;
  title: string;
  text: string;
  route: string;
  action: string;
}

interface FaqItem {
  category: string;
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-doctor-support',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    LogoutConfirmModalComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './doctor-support.component.html',
  styleUrls: ['./doctor-support.component.css']
})
export class DoctorSupportComponent implements OnInit, OnDestroy {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];

  showLogoutModal = false;

  readonly guideSteps: GuideStep[] = [
    {
      number: '01',
      title: 'Search emergency profile',
      text: 'Use Emergency Lookup when urgent care needs quick access to patient identity, contact, blood group, allergies, chronic conditions, medication, and vitals.',
      route: '/doctor/emergency-lookup',
      action: 'Open lookup'
    },
    {
      number: '02',
      title: 'Send consent request',
      text: 'From Dashboard or Patient Care, enter Patient ID and clinical reason. Previous records access is optional and must be approved by the patient.',
      route: '/doctor/home',
      action: 'Go to dashboard'
    },
    {
      number: '03',
      title: 'Track patient decision',
      text: 'Use Notifications to track pending, approved, denied, reminders, active sessions, and completed update messages.',
      route: '/doctor/notifications',
      action: 'View notifications'
    },
    {
      number: '04',
      title: 'Update medical profile',
      text: 'Open an approved session from Patient Care or Notifications. Save the current visit update only after verifying clinical details.',
      route: '/doctor/patient-care',
      action: 'Open queue'
    }
  ];

  readonly faqItems: FaqItem[] = [
    {
      category: 'Emergency Lookup',
      question: 'What can I search in Emergency Lookup?',
      answer: 'You can search by Patient ID, patient name, emergency contact, address, district, state, pincode, or available blood-group text. Matching records update as you type.',
      open: true
    },
    {
      category: 'Consent Access',
      question: 'Why do I need to send an access request?',
      answer: 'Patient medical profile editing requires patient consent. The request contains the patient ID, clinical reason, and whether previous medical records are requested.',
      open: false
    },
    {
      category: 'Patient Decision',
      question: 'Where do approvals and denials appear?',
      answer: 'Approvals, denials, reminders, and completed session updates appear on Doctor Notifications. Active approved sessions are also visible from Patient Care.',
      open: false
    },
    {
      category: 'Medical Update',
      question: 'What happens after I save a patient medical update?',
      answer: 'The backend saves the current visit update, refreshes the patient current medical profile, and completes the active access session according to your workflow.',
      open: false
    },
    {
      category: 'Previous Records',
      question: 'Why can I not see previous medical records?',
      answer: 'Previous records are visible only when the patient approves access with previous records. Profile-only approval does not expose full history.',
      open: false
    },
    {
      category: 'Profile',
      question: 'Which doctor profile fields can I update?',
      answer: 'You can update phone number, designation, hospital or institution, department, years of experience, and profile photo. Doctor ID, name, and email are identity fields.',
      open: false
    },
    {
      category: 'Emergency Contact',
      question: 'Where does patient emergency contact come from?',
      answer: 'Emergency contact is entered from Patient Profile and is reflected in Emergency Lookup for doctor-side urgent care reference.',
      open: false
    },
    {
      category: 'Security',
      question: 'Can I edit patient general profile data?',
      answer: 'No. Patient general profile details are controlled by the patient. Doctors update only medical profile and visit-related medical information after consent.',
      open: false
    },
    {
      category: 'Notifications',
      question: 'Why is the sidebar notification count changing?',
      answer: 'The count is based on unread notifications and active/pending access sessions. It updates when notifications are loaded or when session state changes.',
      open: false
    },
    {
      category: 'Best Practice',
      question: 'What should I write in the access reason?',
      answer: 'Use a clear clinical reason such as follow-up consultation, emergency support, lab review, or current visit update. Avoid vague text.',
      open: false
    }
  ];

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly doctorService: DoctorService,
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService
  ) {
    this.doctor = this.doctorService.getCurrentDoctor();
    this.updateSidebarItems();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.doctorService.getDoctor().subscribe(doctor => {
        this.doctor = doctor;
      })
    );

    this.subscriptions.add(
      this.notificationService.getNotifications().subscribe(notifications => {
        this.notifications = notifications;
        this.updateSidebarItems();
      })
    );

    this.notificationService.loadDoctorNotifications(false).subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter(item => item.unread).length;
  }

  updateSidebarItems(): void {
    const active = this.notifications.filter(item =>
      String(item.accessStatus || '').toUpperCase() === 'APPROVED' && !item.accessEndedAt
    ).length;

    const pending = this.notifications.filter(item =>
      String(item.accessStatus || '').toUpperCase() === 'PENDING'
    ).length;

    this.sidebarItems = [
      { label: 'Dashboard', icon: 'D', route: '/doctor/home', exact: true },
      { label: 'Emergency Lookup', icon: 'E', route: '/doctor/emergency-lookup', exact: true },
      { label: 'Patient Care', icon: 'C', route: '/doctor/patient-care', badgeCount: active + pending, exact: true },
      { label: 'Doctor Profile', icon: 'P', route: '/doctor/profile', exact: true },
      { label: 'Notifications', icon: 'N', route: '/doctor/notifications', badgeCount: this.unreadCount, exact: true },
      { label: 'Help & Support', icon: 'H', route: '/doctor/support', exact: true }
    ];
  }

  toggleFaq(item: FaqItem): void {
    item.open = !item.open;
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