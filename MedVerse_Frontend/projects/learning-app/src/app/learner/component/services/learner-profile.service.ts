import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { CurrentSession, SharedAuthService } from '../../../../../../shared-auth/src/lib/shared-auth.service';
import { apiUrl } from '../../../../../../shared-services/src/lib/api-config';

export interface LearnerProfile {
  name: string;
  role: string;
  learnerId: string;
  institution: string;
  department: string;
  email: string;
  memberSince: string;
  image: string;
}

export interface LearnerProfileStats {
  bookmarksCount: number;
  submissionsCount: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
}

@Injectable({ providedIn: 'root' })
export class LearnerProfileService {
  private readonly apiBaseUrl = apiUrl('/learner');
  private readonly storageKey = 'medverseLearnerProfile';

  constructor(
    private readonly http: HttpClient,
    private readonly sharedAuthService: SharedAuthService
  ) {}

  getProfile(fallback: LearnerProfile): Observable<LearnerProfile> {
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

  updateProfile(profile: LearnerProfile): Observable<LearnerProfile> {
    return this.http.put<any>(`${this.apiBaseUrl}/profile`, {
      institution: profile.institution,
      department: profile.department
    }, { withCredentials: true }).pipe(
      map(response => this.toProfile(response?.data ?? response, profile)),
      tap(savedProfile => this.saveLocalProfile(savedProfile)),
    );
  }

  uploadProfileImage(file: File, fallback: LearnerProfile): Observable<LearnerProfile> {
    const formData = new FormData();
    formData.append('profileImage', file);
    formData.append('file', file);

    return this.http.put(`${this.apiBaseUrl}/profile/image`, formData, {
      responseType: 'text',
      withCredentials: true
    }).pipe(
      switchMap(() => this.getProfile(fallback)),
      tap(savedProfile => this.saveLocalProfile(savedProfile))
    );
  }

  getStats(): Observable<LearnerProfileStats> {
    return this.http.get<any>(`${this.apiBaseUrl}/profile/stats`, { withCredentials: true }).pipe(
      map(response => response?.data ?? response)
    );
  }

  private toProfile(source: any, fallback: LearnerProfile): LearnerProfile {
    return {
      name: source?.name ?? source?.fullName ?? fallback.name,
      role: source?.role ?? fallback.role,
      learnerId: source?.learnerId ?? source?.userId ?? fallback.learnerId,
      institution: source?.institution ?? fallback.institution,
      department: source?.department ?? fallback.department,
      email: source?.email ?? fallback.email,
      memberSince: source?.memberSince ?? source?.createdAt ?? fallback.memberSince,
      image: source?.profileImage ??
        source?.profileImageData ??
        source?.photoUrl ??
        source?.imageUrl ??
        source?.image ??
        fallback.image ??
        ''
    };
  }

  private saveLocalProfile(profile: LearnerProfile): void {
    localStorage.setItem(this.storageKey, JSON.stringify(profile));
  }

  private withSignedInUser(fallback: LearnerProfile, session: CurrentSession | null): LearnerProfile {
    const localUser = this.getLocalCurrentUser();
    const name = session?.name || localUser?.name || fallback.name;
    const email = session?.email || localUser?.email || fallback.email;
    const userId = session?.userId || localUser?.userId || fallback.learnerId;

    return {
      ...fallback,
      name,
      email,
      learnerId: userId,
      role: fallback.role || 'Medical Student'
    };
  }

  private getLocalCurrentUser(): any {
    const rawUser = localStorage.getItem('medverseCurrentUser');
    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }
}
