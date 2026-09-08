import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { API_BASE_URL } from '../../../../../shared-services/src/lib/api-config';
import { CurrentSession, SharedAuthService } from '../../../../../shared-auth/src/lib/shared-auth.service';

export interface OfficerCase {
  caseId: string;
  caseTitle?: string;
  title?: string;
  caseDescription?: string;
  description?: string;
  caseDisease?: string;
  disease?: string;
  caseDepartment?: string;
  department?: string;
  departmentId?: string;
  approvalStatus?: string;
  status?: string;
  submittedDate?: string;
  caseDoc?: string;
  caseDocBase64?: string;
  caseDocData?: string;
  caseDocName?: string;
  caseDocContentType?: string;
  documentName?: string;
  pdfUrl?: string;
  remarks?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface CaseVerification {
  verificationId: string;
  approvalStatus?: string;
  remarks?: string;
}

export interface AuthOfficerProfile {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  hospitalName: string;
  experienceYears: string;
  officerId: string;
  role: string;
  status: string;
  profileImage: string;
}

export interface AuthOfficerDashboardCounts {
  totalVerified: number;
  pendingVerification: number;
  approvedCases: number;
  rejectedCases: number;
}

@Injectable({ providedIn: 'root' })
export class AuthOfficerApiService {
  private readonly apiBaseUrl = `${API_BASE_URL}/authofficer`;
  private readonly profileStorageKey = 'medverseAuthOfficerProfile';

  constructor(
    private readonly http: HttpClient,
    private readonly sharedAuthService: SharedAuthService
  ) {}

  getProfile(fallback: AuthOfficerProfile): Observable<AuthOfficerProfile> {
    return this.sharedAuthService.getCurrentSession().pipe(
      switchMap(session => {
        const signedInFallback = this.withSignedInUser(fallback, session);

        return this.http.get<any>(`${this.apiBaseUrl}/profile`, { withCredentials: true }).pipe(
          map(response => this.toProfile(response?.data ?? response, signedInFallback)),
          tap(profile => this.saveLocalProfile(profile)),
          catchError(() => of(signedInFallback))
        );
      })
    );
  }

  updateProfile(profile: AuthOfficerProfile): Observable<AuthOfficerProfile> {
    return this.http.put<any>(`${this.apiBaseUrl}/profile`, {
      contactNumber: this.toBackendPhoneNumber(profile.phone),
      specialization: profile.department,
      hospitalName: profile.hospitalName,
      experienceYears: Number(profile.experienceYears)
    }, { withCredentials: true }).pipe(
      map(response => this.toProfile(response?.data ?? response, profile)),
      tap(savedProfile => this.saveLocalProfile(savedProfile))
    );
  }

  uploadProfileImage(file: File): Observable<AuthOfficerProfile> {
    const formData = new FormData();
    formData.append('profileImage', file);
    formData.append('file', file);

    return this.http.put(`${this.apiBaseUrl}/profile/image`, formData, {
      responseType: 'text',
      withCredentials: true
    }).pipe(
      switchMap(() => this.getProfile(this.emptyProfile())),
      tap(profile => this.saveLocalProfile(profile))
    );
  }

  getCases(status?: string): Observable<PageResponse<OfficerCase>> {
    const params: Record<string, string> = {};
    if (status) {
      params['status'] = status;
    }

    return this.http.get<any>(`${this.apiBaseUrl}/cases`, {
      params,
      withCredentials: true
    }).pipe(
      map(response => {
        const page = response?.data ?? response;
        return {
          content: page?.content ?? [],
          totalElements: Number(page?.totalElements ?? 0),
          totalPages: Number(page?.totalPages ?? 0),
          page: Number(page?.page ?? page?.number ?? 0),
          size: Number(page?.size ?? 0)
        };
      })
    );
  }

  getPendingCases(): Observable<OfficerCase[]> {
    return forkJoin({
      pending: this.getCases('PENDING').pipe(catchError(() => of(this.emptyPage()))),
      underReview: this.getCases('UNDER_REVIEW').pipe(catchError(() => of(this.emptyPage())))
    }).pipe(
      map(({ pending, underReview }) => {
        const casesById = new Map<string, OfficerCase>();
        [...pending.content, ...underReview.content].forEach(item => {
          casesById.set(item.caseId, item);
        });
        return [...casesById.values()];
      })
    );
  }

  getCase(caseId: string): Observable<OfficerCase> {
    return this.http.get<any>(`${this.apiBaseUrl}/case/${caseId}`, { withCredentials: true }).pipe(
      map(response => response?.data ?? response)
    );
  }

  getVerifications(caseId: string): Observable<CaseVerification[]> {
    return this.http.get<any>(`${this.apiBaseUrl}/verifications/case/${caseId}`, {
      withCredentials: true
    }).pipe(
      map(response => {
        const payload = response?.data ?? response;
        return Array.isArray(payload) ? payload : [];
      })
    );
  }

  getDashboardCounts(): Observable<AuthOfficerDashboardCounts> {
    return forkJoin({
      pending: this.getCases('PENDING').pipe(catchError(() => of(this.emptyPage()))),
      underReview: this.getCases('UNDER_REVIEW').pipe(catchError(() => of(this.emptyPage()))),
      approved: this.getCases('APPROVED').pipe(catchError(() => of(this.emptyPage()))),
      rejected: this.getCases('REJECTED').pipe(catchError(() => of(this.emptyPage())))
    }).pipe(
      map(({ pending, underReview, approved, rejected }) => {
        const approvedCases = this.getPageTotal(approved);
        const rejectedCases = this.getPageTotal(rejected);

        return {
          totalVerified: approvedCases + rejectedCases,
          pendingVerification: this.getPageTotal(pending) + this.getPageTotal(underReview),
          approvedCases,
          rejectedCases
        };
      })
    );
  }

  verifyCase(caseId: string, status: 'APPROVED' | 'REJECTED', remarks: string): Observable<string> {
    return this.getVerifications(caseId).pipe(
      switchMap(verifications => {
        const verificationId = verifications?.find(item => !!item?.verificationId)?.verificationId || caseId;

        return this.http.put(`${this.apiBaseUrl}/verifications/${verificationId}/verify`, null, {
          params: { status, remarks },
          responseType: 'text',
          withCredentials: true
        });
      })
    );
  }

  private toProfile(source: any, fallback: AuthOfficerProfile): AuthOfficerProfile {
    return {
      fullName: source?.fullName || source?.name || fallback.fullName,
      email: source?.email || fallback.email,
      phone: source?.phone || source?.phoneNumber || source?.contactNumber || fallback.phone,
      department: source?.department || source?.specialization || fallback.department,
      hospitalName: source?.hospitalName || source?.hospital || fallback.hospitalName,
      experienceYears: String(source?.experienceYears || source?.yearsOfExperience || fallback.experienceYears),
      officerId: source?.officerId || source?.authOfficerId || source?.authId || source?.userId || fallback.officerId,
      role: source?.role || fallback.role,
      status: source?.status || source?.authStatus || fallback.status,
      profileImage: source?.profileImage ||
        source?.profileImageData ||
        source?.photoUrl ||
        source?.imageUrl ||
        fallback.profileImage ||
        ''
    };
  }

  private toBackendPhoneNumber(value: string): string {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  private saveLocalProfile(profile: AuthOfficerProfile): void {
    localStorage.setItem(this.profileStorageKey, JSON.stringify(profile));
  }

  private getPageTotal(page: PageResponse<OfficerCase>): number {
    return Number(page?.totalElements ?? page?.content?.length ?? 0);
  }

  private emptyPage(): PageResponse<OfficerCase> {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 0
    };
  }

  private emptyProfile(): AuthOfficerProfile {
    return {
      fullName: '',
      email: '',
      phone: '',
      department: '',
      hospitalName: '',
      experienceYears: '',
      officerId: '',
      role: 'Authentication Officer',
      status: '',
      profileImage: ''
    };
  }

  private withSignedInUser(fallback: AuthOfficerProfile, session: CurrentSession | null): AuthOfficerProfile {
    const localUser = this.getLocalCurrentUser();
    const fullName = session?.name || localUser?.name || fallback.fullName;
    const email = session?.email || localUser?.email || fallback.email;
    const userId = session?.userId || localUser?.userId || fallback.officerId;

    return {
      ...fallback,
      fullName,
      email,
      officerId: userId,
      role: fallback.role || 'Authentication Officer'
    };
  }

  private getLocalCurrentUser(): any {
    const rawUser = localStorage.getItem('medverseCurrentUser');
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }
}
