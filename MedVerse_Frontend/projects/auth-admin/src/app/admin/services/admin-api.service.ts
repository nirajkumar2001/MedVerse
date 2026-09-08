import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../../shared-services/src/lib/api-config';

export interface AdminDashboardStats {
  totalActiveUsers: number;
  totalDoctors: number;
  totalStaff: number;
  securityAlerts: number;
  failedLogins: number;
  complianceScore: number;
  pendingApprovals: number;
  pendingCases: number;
}

export interface AdminUser {
  id: string;
  userId: string;
  authRefId: string;
  name: string;
  email: string;
  role: string;
  authStatus: string;
  active: boolean;
  createdAt?: string | number | Date | number[];
  updatedAt?: string | number | Date | number[];
  documentName?: string;
  documentContentType?: string;
  documentData?: string;
  reviewRemark?: string;
  reviewedAt?: string | number | Date | number[];
  profileImage?: string;
  profileImageData?: string;
  photoUrl?: string;
  imageUrl?: string;
  status?: string;
  signupStatus?: string;
}

export type AdminUserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'UNKNOWN';

export function normalizeAdminStatus(userOrStatus?: AdminUser | string | null): AdminUserStatus {
  const rawStatus = typeof userOrStatus === 'string'
    ? userOrStatus
    : userOrStatus?.authStatus || userOrStatus?.signupStatus || userOrStatus?.status || '';

  const normalized = String(rawStatus).trim().replace(/[\s-]+/g, '_').toUpperCase();

  if (normalized.includes('APPROV')) return 'APPROVED';
  if (normalized.includes('REJECT') || normalized.includes('DECLIN')) return 'REJECTED';
  if (normalized.includes('SUSPEND') || normalized.includes('DISABLE') || normalized.includes('BLOCK')) return 'SUSPENDED';
  if (normalized.includes('PEND') || normalized.includes('WAIT') || normalized.includes('REVIEW')) return 'PENDING';

  return 'UNKNOWN';
}

export function toAdminTitleCase(value?: string | null): string {
  return value
    ? value.toLowerCase().replace(/(^|_|\s|-)\w/g, letter => letter.replace(/[_\s-]/, '').toUpperCase())
    : '';
}

export function formatAdminDate(value?: string | number | Date | number[] | null): string {
  if (!value) return 'Not available';

  const date = parseAdminDate(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const dateText = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
  const timeText = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);

  return `${dateText} at ${timeText}`;
}

function parseAdminDate(value: string | number | Date | number[]): Date {
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = value;
    return new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000));
  }

  if (typeof value === 'number') {
    return new Date(value < 10000000000 ? value * 1000 : value);
  }

  const trimmed = value.trim();

  if (/^\d+$/.test(trimmed)) {
    const timestamp = Number(trimmed);
    return new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
  }

  return new Date(trimmed);
}

export interface AdminAlert {
  id: string;
  type: string;
  severity?: string;
  message: string;
  date?: string;
  status: string;
}

export interface AdminAlertPageResponse {
  items: AdminAlert[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly apiBaseUrl = `${API_BASE_URL}/admin`;

  constructor(private readonly http: HttpClient) {}

  getDashboard(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.apiBaseUrl}/dashboard`, { withCredentials: true });
  }

  getUsers(status = 'all'): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiBaseUrl}/signup-users`, {
      params: { status },
      withCredentials: true
    });
  }

  getUser(userId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiBaseUrl}/signup-users/${userId}`, { withCredentials: true });
  }

  approveUser(userId: string, reason?: string): Observable<string> {
    return this.http.put(`${this.apiBaseUrl}/signup-users/${userId}/approve`, { reason }, {
      responseType: 'text',
      withCredentials: true
    });
  }

  rejectUser(userId: string, reason?: string): Observable<string> {
    return this.http.put(`${this.apiBaseUrl}/signup-users/${userId}/reject`, { reason }, {
      responseType: 'text',
      withCredentials: true
    });
  }

  getAlerts(status = 'all', page = 0, size = 30): Observable<AdminAlertPageResponse> {
    return this.http.get<AdminAlertPageResponse>(`${this.apiBaseUrl}/alerts`, {
      params: { status, page, size },
      withCredentials: true
    });
  }

  resolveAlert(alertId: string): Observable<string> {
    return this.http.put(`${this.apiBaseUrl}/alerts/${alertId}/resolve`, null, {
      responseType: 'text',
      withCredentials: true
    });
  }

  deleteAlert(alertId: string): Observable<string> {
    return this.http.delete(`${this.apiBaseUrl}/alerts/${alertId}`, {
      responseType: 'text',
      withCredentials: true
    });
  }
}
