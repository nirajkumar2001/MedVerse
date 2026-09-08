// import { CommonModule } from '@angular/common';
// import { Component, EventEmitter, OnInit, Output } from '@angular/core';
// import { RouterLink, RouterLinkActive } from '@angular/router';

// type UserRole =
//   | 'LEARNER'
//   | 'DOCTOR'
//   | 'PATIENT'
//   | 'AUTH_OFFICER'
//   | 'ADMIN';

// type SidebarIcon =
//   | 'dashboard'
//   | 'profile'
//   | 'create'
//   | 'cases'
//   | 'explore'
//   | 'saved'
//   | 'notifications'
//   | 'approve'
//   | 'patients'
//   | 'doctors'
//   | 'reports'
//   | 'settings'
//   | 'appointments'
//   | 'records';

// interface SidebarItem {
//   label: string;
//   icon: SidebarIcon;
//   route: string;
//   badge?: number;
// }

// @Component({
//   selector: 'app-sidebar',
//   standalone: true,
//   imports: [CommonModule, RouterLink, RouterLinkActive],
//   templateUrl: './sidebar.component.html',
//   styleUrl: './sidebar.component.css'
// })
// export class SidebarComponent implements OnInit {
//   @Output() collapsedChange = new EventEmitter<boolean>();

//   isCollapsed = false;
//   isMobileOpen = false;

//   currentRole: UserRole = 'LEARNER';

//   sidebarItems: SidebarItem[] = [];

//   private readonly menuByRole: Record<UserRole, SidebarItem[]> = {
//     LEARNER: [
//       { label: 'Dashboard', icon: 'dashboard', route: '/learner/profile' },
//       { label: 'My Profile', icon: 'profile', route: '/learner/profile' },
//       { label: 'Submit Case', icon: 'create', route: '/learner/submit-new-case' },
//       { label: 'My Cases', icon: 'cases', route: '/learner/submissions' },
//       { label: 'Explore Cases', icon: 'explore', route: '/learner/explore-cases' },
//       { label: 'Saved Cases', icon: 'saved', route: '/learner/bookmarks' },
//       { label: 'Notifications', icon: 'notifications', route: '/learner/notifications', badge: 3 }
//     ],

//     DOCTOR: [
//       { label: 'Dashboard', icon: 'dashboard', route: '/doctor/dashboard' },
//       { label: 'My Profile', icon: 'profile', route: '/doctor/profile' },
//       { label: 'Patients', icon: 'patients', route: '/doctor/patients' },
//       { label: 'Appointments', icon: 'appointments', route: '/doctor/appointments' },
//       { label: 'Medical Records', icon: 'records', route: '/doctor/records' },
//       { label: 'Cases', icon: 'cases', route: '/doctor/cases' },
//       { label: 'Notifications', icon: 'notifications', route: '/doctor/notifications', badge: 2 }
//     ],

//     PATIENT: [
//       { label: 'Dashboard', icon: 'dashboard', route: '/patient/dashboard' },
//       { label: 'My Profile', icon: 'profile', route: '/patient/profile' },
//       { label: 'Medical Records', icon: 'records', route: '/patient/records' },
//       { label: 'Appointments', icon: 'appointments', route: '/patient/appointments' },
//       { label: 'Doctors', icon: 'doctors', route: '/patient/doctors' },
//       { label: 'Notifications', icon: 'notifications', route: '/patient/notifications', badge: 1 }
//     ],

//     AUTH_OFFICER: [
//       { label: 'Dashboard', icon: 'dashboard', route: '/auth-officer/dashboard' },
//       { label: 'My Profile', icon: 'profile', route: '/auth-officer/profile' },
//       { label: 'Pending Cases', icon: 'approve', route: '/auth-officer/pending-cases', badge: 6 },
//       { label: 'Approved Cases', icon: 'cases', route: '/auth-officer/approved-cases' },
//       { label: 'Rejected Cases', icon: 'reports', route: '/auth-officer/rejected-cases' },
//       { label: 'Notifications', icon: 'notifications', route: '/auth-officer/notifications', badge: 4 }
//     ],

//     ADMIN: [
//       { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
//       { label: 'Profiles', icon: 'profile', route: '/admin/profiles' },
//       { label: 'Doctors', icon: 'doctors', route: '/admin/doctors' },
//       { label: 'Patients', icon: 'patients', route: '/admin/patients' },
//       { label: 'Auth Officers', icon: 'approve', route: '/admin/auth-officers' },
//       { label: 'Reports', icon: 'reports', route: '/admin/reports' },
//       { label: 'Settings', icon: 'settings', route: '/admin/settings' }
//     ]
//   };

//   ngOnInit(): void {
//     this.currentRole = this.getRoleFromStorage();
//     this.sidebarItems = this.menuByRole[this.currentRole];
//   }

//   getRoleFromStorage(): UserRole {
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

//   toggleCollapse(): void {
//     this.isCollapsed = !this.isCollapsed;
//     this.collapsedChange.emit(this.isCollapsed);
//   }

//   toggleMobileSidebar(): void {
//     this.isMobileOpen = !this.isMobileOpen;
//   }

//   closeMobileSidebar(): void {
//     this.isMobileOpen = false;
//   }

//   logout(): void {
//     localStorage.clear();
//     alert('Logged out successfully');
//   }
// }

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { LogoutConfirmModalComponent, SharedAuthService } from '../../../../../../shared-auth/src/public-api';
import { LearnerNotificationCountService } from '../services/learner-notification-count.service';
import { Subscription } from 'rxjs';

type SidebarIcon =
  | 'dashboard'
  | 'profile'
  | 'create'
  | 'cases'
  | 'explore'
  | 'saved'
  | 'notifications'
  | 'support'
  | 'password';

interface SidebarItem {
  label: string;
  icon: SidebarIcon;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LogoutConfirmModalComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Output() collapsedChange = new EventEmitter<boolean>();

  isCollapsed = false;
  isMobileOpen = false;
  showLogoutModal = false;
  isLoggingOut = false;
  private readonly subscriptions = new Subscription();

  sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/' },
    { label: 'My Profile', icon: 'profile', route: '/learner/profile' },
    { label: 'Create Case', icon: 'create', route: '/learner/submit-new-case' },
    { label: 'My Cases', icon: 'cases', route: '/learner/submissions' },
    { label: 'Explore Cases', icon: 'explore', route: '/learner/explore-cases' },
    { label: 'Saved Cases', icon: 'saved', route: '/learner/bookmarks' },
    { label: 'Notifications', icon: 'notifications', route: '/learner/notifications' },
    { label: 'Change Password', icon: 'password', route: '/change-password' },
    { label: 'Help & Support', icon: 'support', route: '/learner/support' }
    
  ];

  constructor(
    public router: Router,
    private readonly authService: SharedAuthService,
    private readonly learnerNotificationCountService: LearnerNotificationCountService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.learnerNotificationCountService.unreadCount$.subscribe(count => {
      this.setNotificationBadge(count);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

isActive(item: SidebarItem): boolean {
  // Exact match for dashboard "/"
  if (item.route === '/') {
    return this.router.url === '/';
  }
  // Partial match for other routes
  return this.router.url.startsWith(item.route);
}
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
  }

  toggleMobileSidebar(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  closeMobileSidebar(): void {
    this.isMobileOpen = false;
  }

  logout(): void {
    this.showLogoutModal = true;
    // Fallback for cases where modal library is blocked by stale bundle/UI layering.
    setTimeout(() => {
      if (!this.showLogoutModal || this.isLoggingOut) {
        return;
      }
      const modalVisible = !!document.querySelector('lib-logout-confirm-modal .modal-overlay');
      if (!modalVisible) {
        const confirmed = window.confirm('Are you sure you want to logout?');
        if (confirmed) {
          this.confirmLogout();
        } else {
          this.closeLogoutModal();
        }
      }
    }, 150);
  }

  closeLogoutModal(): void {
    if (!this.isLoggingOut) {
      this.showLogoutModal = false;
    }
  }

  confirmLogout(): void {
    this.isLoggingOut = true;
    this.authService.logout()
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.authService.clearClientSession();
        this.isLoggingOut = false;
        this.showLogoutModal = false;
        this.router.navigate(['/login']);
      });
  }

  private setNotificationBadge(count: number): void {
    this.sidebarItems = this.sidebarItems.map(item =>
      item.route === '/learner/notifications'
        ? { ...item, badge: count > 0 ? count : undefined }
        : item
    );
  }
}
