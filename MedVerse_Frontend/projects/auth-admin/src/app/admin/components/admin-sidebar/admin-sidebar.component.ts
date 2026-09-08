import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { LogoutConfirmModalComponent, SharedAuthService } from '../../../../../../shared-auth/src/public-api';
import { AdminApiService, normalizeAdminStatus } from '../../services/admin-api.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoutConfirmModalComponent],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css']
})
export class AdminSidebarComponent {
  showLogoutModal = false;
  isLoggingOut = false;
  approvedCount = 0;
  rejectedCount = 0;
  isLoadingCounts = true;

  constructor(
    private readonly authService: SharedAuthService,
    private readonly router: Router,
    private readonly adminApi: AdminApiService
  ) {
    this.loadReviewCounts();
  }

  openLogoutModal(): void {
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

  private loadReviewCounts(): void {
    this.adminApi.getUsers('all')
      .pipe(catchError(() => of([])))
      .subscribe(users => {
        this.approvedCount = users.filter(user => normalizeAdminStatus(user) === 'APPROVED').length;
        this.rejectedCount = users.filter(user => normalizeAdminStatus(user) === 'REJECTED').length;
        this.isLoadingCounts = false;
      });
  }
}
