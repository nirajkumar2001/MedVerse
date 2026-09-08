import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../components/admin-footer/admin-footer.component';
import {
  AdminApiService,
  AdminUser,
  formatAdminDate,
  normalizeAdminStatus,
  toAdminTitleCase
} from '../../services/admin-api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminSidebarComponent, AdminFooterComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  title = 'Reports';
  subtitle = 'Download and view user approval reports';
  status = 'all';
  users: AdminUser[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly adminApi: AdminApiService
  ) {
    const path = this.route.snapshot.routeConfig?.path || '';
    if (path.includes('approved-users')) {
      this.status = 'approved';
      this.title = 'Approved Users';
      this.subtitle = 'Live approved users from Profile Manage';
    } else if (path.includes('rejected-users')) {
      this.status = 'rejected';
      this.title = 'Rejected Users';
      this.subtitle = 'Live rejected users with admin remarks';
    }

    this.loadUsers();
  }

  formatDate(value?: string | number | Date | number[]): string {
    return formatAdminDate(value);
  }

  toTitleCase(value?: string): string {
    return toAdminTitleCase(value);
  }

  getStatus(user: AdminUser): string {
    return normalizeAdminStatus(user);
  }

  private loadUsers(): void {
    this.adminApi.getUsers(this.status).pipe(
      catchError(() => {
        this.errorMessage = 'Unable to load report data.';
        return of([]);
      })
    ).subscribe(users => {
      this.users = this.status === 'all'
        ? users
        : users.filter(user => normalizeAdminStatus(user).toLowerCase() === this.status);
      this.isLoading = false;
    });
  }
}
