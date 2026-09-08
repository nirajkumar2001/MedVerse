import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../components/admin-footer/admin-footer.component';
import { catchError, map, of } from 'rxjs';
import {
  AdminApiService,
  AdminUser,
  formatAdminDate,
  normalizeAdminStatus,
  toAdminTitleCase
} from '../../services/admin-api.service';

type ProfileStatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

@Component({
  selector: 'app-profiles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AdminSidebarComponent,
    AdminFooterComponent
  ],
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.css']
})
export class ProfilesComponent {
  readonly fallbackAvatar = this.createFallbackAvatar();
  readonly statusTabs: Array<{ label: string; value: ProfileStatusFilter }> = [
    { label: 'All Requests', value: 'all' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Suspended', value: 'SUSPENDED' }
  ];

  allProfiles: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    date: string;
    status: string;
    rawStatus: string;
    profileImage: string;
  }> = [];
  activeStatus: ProfileStatusFilter = 'all';
  searchTerm = '';
  isLoading = true;
  errorMessage = '';

  constructor(private readonly adminApi: AdminApiService) {
    this.loadProfiles();
  }

  get profiles() {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    return this.allProfiles.filter(profile => {
      const matchesStatus = this.activeStatus === 'all' || profile.rawStatus === this.activeStatus;
      const matchesSearch = !normalizedSearch ||
        profile.id.toLowerCase().includes(normalizedSearch) ||
        profile.name.toLowerCase().includes(normalizedSearch) ||
        profile.email.toLowerCase().includes(normalizedSearch) ||
        profile.role.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }

  selectStatus(status: ProfileStatusFilter): void {
    this.activeStatus = status;
  }

  getStatusCount(status: ProfileStatusFilter): number {
    if (status === 'all') {
      return this.allProfiles.length;
    }

    return this.allProfiles.filter(profile => profile.rawStatus === status).length;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  getProfileImage(profile: { profileImage: string }): string {
    return profile.profileImage || this.fallbackAvatar;
  }

  onProfileImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = this.fallbackAvatar;
  }

  trackByProfileId(_: number, profile: { id: string }): string {
    return profile.id;
  }

  private loadProfiles(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminApi.getUsers('all').pipe(
      map(users => users.map(user => this.toProfileRow(user))),
      catchError(() => {
        this.errorMessage = 'Unable to load profile requests.';
        return of([]);
      })
    ).subscribe(allProfiles => {
      this.allProfiles = allProfiles;
      this.isLoading = false;
    });
  }

  private toProfileRow(user: AdminUser) {
    return {
      id: user.userId,
      name: user.name,
      email: user.email,
      role: this.toTitleCase(user.role),
      date: this.formatDate(user.createdAt),
      status: this.toTitleCase(normalizeAdminStatus(user)),
      rawStatus: normalizeAdminStatus(user),
      profileImage: user.profileImage || user.profileImageData || user.photoUrl || user.imageUrl || ''
    };
  }

  private toTitleCase(value: string): string {
    return toAdminTitleCase(value);
  }

  private formatDate(value?: string | number | Date | number[]): string {
    return formatAdminDate(value);
  }

  private createFallbackAvatar(): string {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" rx="48" fill="#eef2ff"/>
        <circle cx="48" cy="35" r="18" fill="#64748b"/>
        <path d="M20 82c4-18 17-28 28-28s24 10 28 28" fill="#64748b"/>
      </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
