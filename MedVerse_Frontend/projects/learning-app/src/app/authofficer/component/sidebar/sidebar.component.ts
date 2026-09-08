import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { LogoutConfirmModalComponent, SharedAuthService } from '../../../../../../shared-auth/src/public-api';

type SidebarIcon =
  | 'dashboard'
  | 'approve'
  | 'cases'
  | 'reports'
  | 'all-cases'
  | 'profile'
  | 'support'
  | 'password';

interface SidebarItem {
  label: string;
  icon: SidebarIcon;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoutConfirmModalComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Output() logoutClicked = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  isCollapsed = false;
  isMobileOpen = false;
  showLogoutModal = false;
  isLoggingOut = false;

  sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/authofficer/auth-officer-dashboard' },
    { label: 'Verification Queue', icon: 'approve', route: '/authofficer/verification-queue' },
    { label: 'Approved Cases', icon: 'cases', route: '/authofficer/approved-cases' },
    { label: 'Rejected Cases', icon: 'reports', route: '/authofficer/rejected-cases' },
    { label: 'All Cases', icon: 'all-cases', route: '/authofficer/all-cases' },
    { label: 'Profile', icon: 'profile', route: '/authofficer/profile' },
    { label: 'Help & Support', icon: 'support', route: '/authofficer/support' },
    { label: 'Change Password', icon: 'password', route: '/change-password' }
  ];

  constructor(
    private readonly authService: SharedAuthService,
    public router: Router
  ) {}

  isActive(item: SidebarItem): boolean {
    return this.router.url.startsWith(item.route);
  }

  toggleSidebar(): void {
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
}
