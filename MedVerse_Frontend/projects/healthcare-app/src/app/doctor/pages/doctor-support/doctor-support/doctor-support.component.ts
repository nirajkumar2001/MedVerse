import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AppNotification } from '../../../core/models/app-notification.model';
import { Doctor } from '../../../core/models/doctor.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';

import { AuthService } from '../../../core/services/auth.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { NotificationService } from '../../../core/services/notification.service';

import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';
import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface SupportFaq {
  question: string;
  answer: string;
  category: string;
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
  styleUrl: './doctor-support.component.css'
})
export class DoctorSupportComponent implements OnInit, OnDestroy {
  doctor: Doctor;
  notifications: AppNotification[] = [];
  sidebarItems: SidebarItem[] = [];
  showLogoutModal = false;

  readonly faqs: SupportFaq[] = [
    {
      category: 'Emergency Lookup',
      question: 'When should I use emergency lookup?',
      answer: 'Use emergency lookup only when urgent care requires quick access to critical patient details such as blood group, allergies, medications, and emergency contacts.'
    },
    {
      category: 'Patient Care',
      question: 'How do I request deeper patient access?',
      answer: 'Open Patient Care, enter the patient ID and reason for access, then send the request. The patient receives a consent notification before full records are shared.'
    },
    {
      category: 'Notifications',
      question: 'Where do approval and rejection updates appear?',
      answer: 'Patient decisions appear in Notifications. You can filter approvals, pending items, denied requests, and general information from that page.'
    },
    {
      category: 'Doctor Profile',
      question: 'Which profile details can I update?',
      answer: 'You can update your phone number, designation, hospital, department, and years of experience from Doctor Profile.'
    },
    {
      category: 'Security',
      question: 'Can I edit patient emergency details from emergency lookup?',
      answer: 'No. Emergency lookup is view-only, so critical information stays protected while still being available during urgent care.'
    }
  ];

  private subscriptions = new Subscription();

  constructor(
    private doctorService: DoctorService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.doctor = this.doctorService.getCurrentDoctor();
    this.notifications = this.notificationService.getCurrentNotifications();
    this.updateSidebarItems();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.doctorService.getDoctor().subscribe((doctor: Doctor) => {
        this.doctor = doctor;
      })
    );

    this.subscriptions.add(
      this.notificationService.getNotifications().subscribe((notifications: AppNotification[]) => {
        this.notifications = notifications;
        this.updateSidebarItems();
      })
    );

    this.subscriptions.add(
      this.notificationService.loadDoctorNotifications().subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter(
      (notification: AppNotification) => notification.unread
    ).length;
  }

  updateSidebarItems(): void {
    this.sidebarItems = [
      { label: 'Dashboard', icon: 'D', route: '/doctor/home', exact: true },
      { label: 'Emergency Lookup', icon: 'E', route: '/doctor/emergency-lookup', exact: true },
      { label: 'Patient Care', icon: 'C', route: '/doctor/patient-care', badgeCount: this.unreadCount, exact: true },
      { label: 'Doctor Profile', icon: 'P', route: '/doctor/profile', exact: true },
      { label: 'Notifications', icon: 'N', route: '/doctor/notifications', badgeCount: this.unreadCount, exact: true },
      { label: 'Help & Support', icon: 'H', route: '/doctor/support', exact: true }
    ];
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
