import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, interval, of } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import { apiUrl } from '../../../../../../shared-services/src/lib/api-config';

@Injectable({ providedIn: 'root' })
export class LearnerNotificationCountService implements OnDestroy {
  private readonly readStorageKey = 'medverse_learner_read_notifications';
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this.unreadCountSubject.asObservable();
  private submissionsPayload: any = null;
  private readonly subscription: Subscription;

  constructor(private readonly http: HttpClient) {
    this.subscription = interval(30000).pipe(
      startWith(0),
      switchMap(() =>
        this.http
          .get<any>(`${apiUrl('/learner')}/submissions?page=0&size=100`, { withCredentials: true })
          .pipe(catchError(() => of(null)))
      )
    ).subscribe(response => {
      this.submissionsPayload = response;
      this.unreadCountSubject.next(this.computeUnreadCount(response));
    });

    window.addEventListener('storage', this.onStorageChange);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    window.removeEventListener('storage', this.onStorageChange);
  }

  private readonly onStorageChange = (event: StorageEvent): void => {
    if (event.key !== this.readStorageKey) {
      return;
    }
    this.unreadCountSubject.next(this.computeUnreadCount(this.submissionsPayload));
  };

  private computeUnreadCount(submissionsResponse: any): number {
    const payload = submissionsResponse?.data ?? submissionsResponse;
    const content = Array.isArray(payload?.content) ? payload.content : [];
    const readMap = this.getReadStateMap();
    const notificationIds = content.flatMap((item: any) => this.toNotificationIds(item));
    return notificationIds.filter((id: string) => !readMap[id]).length;
  }

  private toNotificationIds(item: any): string[] {
    const caseId = String(item?.caseId || '');
    const submittedDate = String(item?.submittedDate || '');
    const remarks = String(item?.remarks || '');
    const status = String(item?.approvalStatus || '').toUpperCase();
    const isPublished = !!item?.published;

    const baseId = `${caseId}|${submittedDate}|${status}|${isPublished}|${remarks}`;
    const ids: string[] = [`${baseId}|SUBMITTED`];
    if (status === 'APPROVED') ids.push(`${baseId}|APPROVED`);
    if (status === 'REJECTED') ids.push(`${baseId}|REJECTED`);
    if (isPublished) ids.push(`${baseId}|PUBLISHED`);
    return ids;
  }

  private getReadStateMap(): Record<string, boolean> {
    const raw = localStorage.getItem(this.readStorageKey);
    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }
}

