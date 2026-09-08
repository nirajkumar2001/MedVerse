import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../components/admin-footer/admin-footer.component';
import { catchError, finalize, of } from 'rxjs';
import {
  AdminApiService,
  AdminUser,
  formatAdminDate,
  normalizeAdminStatus,
  toAdminTitleCase
} from '../../services/admin-api.service';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AdminSidebarComponent,
    AdminFooterComponent
  ],
  templateUrl: './profile-details.component.html',
  styleUrls: ['./profile-details.component.css']
})
export class ProfileDetailsComponent {
  readonly fallbackAvatar = this.createFallbackAvatar();
  user?: AdminUser;
  remark = '';
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly adminApi: AdminApiService
  ) {
    const userId = this.route.snapshot.paramMap.get('userId') || '';
    this.adminApi.getUser(userId).pipe(
      catchError(() => {
        this.errorMessage = 'Unable to load profile details.';
        return of(undefined);
      })
    ).subscribe(user => {
      this.user = user;
      this.remark = user?.reviewRemark || '';
      this.isLoading = false;
    });
  }

  viewDocument(): void {
    const documentUrl = this.getDocumentUrl();
    if (!documentUrl) {
      alert('No document is available for this profile.');
      return;
    }

    const documentTitle = this.user?.documentName || 'Submitted Document';
    const opened = window.open('', '_blank');
    if (opened) {
      opened.document.title = documentTitle;
      opened.document.body.style.margin = '0';
      const iframe = opened.document.createElement('iframe');
      iframe.src = documentUrl;
      iframe.style.border = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100vh';
      opened.document.body.appendChild(iframe);
      opened.document.close();
    }
  }

  get profileImage(): string {
    const image = this.user?.profileImage ||
      this.user?.profileImageData ||
      this.user?.photoUrl ||
      this.user?.imageUrl ||
      '';

    return image || this.fallbackAvatar;
  }

  onProfileImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = this.fallbackAvatar;
  }

  get normalizedStatus(): string {
    return normalizeAdminStatus(this.user);
  }

  get isReviewLocked(): boolean {
    return ['APPROVED', 'REJECTED', 'SUSPENDED'].includes(this.normalizedStatus);
  }

  get submittedOn(): string {
    return formatAdminDate(this.user?.createdAt);
  }

  get reviewedOn(): string {
    if (!this.isReviewLocked) {
      return 'Not reviewed yet';
    }

    return formatAdminDate(this.user?.reviewedAt || this.user?.updatedAt);
  }

  approve(): void {
    this.review('approve');
  }

  reject(): void {
    this.review('reject');
  }

  formatDate(value?: string | number | Date | number[]): string {
    return formatAdminDate(value);
  }

  toTitleCase(value?: string): string {
    return toAdminTitleCase(value);
  }

  private review(action: 'approve' | 'reject'): void {
    if (!this.user || this.isSubmitting || this.isReviewLocked) return;

    this.isSubmitting = true;
    const request = action === 'approve'
      ? this.adminApi.approveUser(this.user.userId, this.remark)
      : this.adminApi.rejectUser(this.user.userId, this.remark);

    request.pipe(finalize(() => {
      this.isSubmitting = false;
    })).subscribe({
      next: () => {
        this.router.navigate(['/admin/profiles']);
      },
      error: error => {
        this.errorMessage = error?.error?.message || `Unable to ${action} profile.`;
      }
    });
  }

  private getDocumentUrl(): string {
    const documentData = this.user?.documentData?.trim();
    if (!documentData) {
      return '';
    }

    if (/^(data:|https?:|blob:)/i.test(documentData)) {
      return documentData;
    }

    const contentType = this.user?.documentContentType || 'application/pdf';
    return `data:${contentType};base64,${documentData}`;
  }

  private createFallbackAvatar(): string {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <rect width="160" height="160" rx="80" fill="#eef2ff"/>
        <circle cx="80" cy="58" r="30" fill="#64748b"/>
        <path d="M34 136c7-32 28-50 46-50s39 18 46 50" fill="#64748b"/>
      </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
