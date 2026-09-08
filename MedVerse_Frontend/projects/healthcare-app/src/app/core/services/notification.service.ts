import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { AppNotification } from '../models/app-notification.model';
import { AccessRequestService } from './access-request.service';
import { RealtimeNotificationService } from './realtime-notification.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);

  constructor(
    private readonly accessRequestService: AccessRequestService,
    private readonly realtime: RealtimeNotificationService
  ) {
    this.realtime.connect();

    this.realtime.accessNotification$.subscribe(message => {
      if (message) {
        this.upsertFromBackend(message, true);
      }
    });
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.notificationsSubject.asObservable();
  }

  loadDoctorNotifications(unreadOnly = false): Observable<AppNotification[]> {
    return this.accessRequestService.getForDoctor(unreadOnly).pipe(
      map(response => this.unwrapArray(response).map((item: any) => this.toNotification(item))),
      tap(notifications => this.notificationsSubject.next(notifications)),
      catchError(error => {
        console.error('Unable to load doctor notifications:', error);
        this.notificationsSubject.next([]);
        return of([]);
      })
    );
  }

  loadPatientNotifications(unreadOnly = false): Observable<AppNotification[]> {
    return this.accessRequestService.getForPatient(unreadOnly).pipe(
      map(response => this.unwrapArray(response).map((item: any) => this.toNotification(item))),
      tap(notifications => this.notificationsSubject.next(notifications)),
      catchError(error => {
        console.error('Unable to load patient notifications:', error);
        this.notificationsSubject.next([]);
        return of([]);
      })
    );
  }

  upsertFromBackend(source: any, forceUnread = false): void {
    const incoming = this.toNotification(source);

    /*
     * Important:
     * Do not force backend-read notifications back to unread.
     * This keeps read/unread state persistent after refresh/login.
     */
    if (forceUnread && source?.read !== true) {
      incoming.unread = true;
    }

    const current = this.notificationsSubject.value;

    const next = current.filter(item => {
      if (incoming.sessionId && item.sessionId) {
        return item.sessionId !== incoming.sessionId;
      }

      return item.id !== incoming.id;
    });

    this.notificationsSubject.next([incoming, ...next]);
  }

  getCurrentNotifications(): AppNotification[] {
    return this.notificationsSubject.value;
  }

  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(notification => notification.unread).length;
  }

  addNotification(notification: AppNotification): void {
    this.notificationsSubject.next([
      notification,
      ...this.notificationsSubject.value
    ]);
  }

  dismissNotification(notificationId: number): void {
    this.notificationsSubject.next(
      this.notificationsSubject.value.filter(notification => notification.id !== notificationId)
    );
  }

  markAsRead(notificationId: number): void {
    const currentNotifications = this.notificationsSubject.value;

    const targetNotification = currentNotifications.find(
      notification => notification.id === notificationId
    );

    if (!targetNotification) {
      return;
    }

    this.notificationsSubject.next(
      currentNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, unread: false }
          : notification
      )
    );

    if (!targetNotification.sessionId) {
      return;
    }

    this.accessRequestService.markAsRead(targetNotification.sessionId).subscribe({
      next: response => {
        const updated = (response as any)?.data ?? response;

        if (updated) {
          this.upsertFromBackend(updated, false);
        }
      },
      error: error => {
        console.error('Unable to persist notification read state:', error);
        this.reloadNotificationsForCurrentRole();
      }
    });
  }

  markAllAsRead(): void {
    const currentNotifications = this.notificationsSubject.value;
    const unreadNotifications = currentNotifications.filter(notification => notification.unread);

    if (unreadNotifications.length === 0) {
      return;
    }

    this.notificationsSubject.next(
      currentNotifications.map(notification => ({
        ...notification,
        unread: false
      }))
    );

    const persistCalls = unreadNotifications
      .filter(notification => Boolean(notification.sessionId))
      .map(notification =>
        this.accessRequestService.markAsRead(notification.sessionId as string).pipe(
          catchError(error => {
            console.error('Unable to mark notification as read:', error);
            return of(null);
          })
        )
      );

    if (persistCalls.length === 0) {
      return;
    }

    forkJoin(persistCalls).subscribe({
      next: responses => {
        responses
          .filter(Boolean)
          .forEach(response => {
            const updated = (response as any)?.data ?? response;
            this.upsertFromBackend(updated, false);
          });
      },
      error: error => {
        console.error('Unable to persist all notification read states:', error);
        this.reloadNotificationsForCurrentRole();
      }
    });
  }

  private reloadNotificationsForCurrentRole(): void {
    const role = this.getCurrentUserRole();

    if (role === 'DOCTOR') {
      this.loadDoctorNotifications(false).subscribe();
      return;
    }

    if (role === 'PATIENT') {
      this.loadPatientNotifications(false).subscribe();
      return;
    }
  }

  private getCurrentUserRole(): string {
    const raw =
      localStorage.getItem('medverseCurrentUser') ||
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('medverseCurrentUser') ||
      sessionStorage.getItem('currentUser') ||
      '';

    if (!raw) {
      return '';
    }

    try {
      const user = JSON.parse(raw);

      return String(
        user?.role ||
          user?.data?.role ||
          user?.user?.role ||
          user?.roleName ||
          user?.data?.roleName ||
          user?.user?.roleName ||
          ''
      ).toUpperCase();
    } catch {
      return '';
    }
  }

  private unwrapArray(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.result)) {
      return response.result;
    }

    return [];
  }

  private toNotification(source: any): AppNotification {
    const status = String(source?.accessStatus ?? source?.status ?? '').toUpperCase();
    const patientId = source?.patientId ?? 'Patient';
    const sessionId = source?.sessionId;

    const notificationReceivedAt =
      source?.notifiedAt ??
      source?.assignedDate ??
      source?.createdAt ??
      source?.requestedAt ??
      null;

    const accessGrantedAt =
      status === 'APPROVED' || status === 'COMPLETED'
        ? source?.respondedAt ?? null
        : null;

    const completedAt =
      source?.accessEndedAt ??
      null;

    const primaryTime =
      completedAt ??
      accessGrantedAt ??
      notificationReceivedAt ??
      source?.respondedAt ??
      source?.createdAt ??
      null;

    return {
      id: this.toStableId(sessionId ?? `${patientId}-${notificationReceivedAt ?? Date.now()}`),

      sessionId,
      patientId,

      accessStatus: status,
      canViewPreviousRecords: Boolean(source?.canViewPreviousRecords),
      accessEndedAt: source?.accessEndedAt ?? null,

      type: this.toNotificationType(status, source?.endReason),
      title: this.toTitle(status, patientId, source?.endReason),
      message: this.toMessage(source, status),

      time: this.toDisplayTime(primaryTime),

      /*
       * Backend field is read.
       * Frontend field is unread.
       */
      unread: source?.unread === true || source?.read === false,

      accessScope: this.toAccessScope(status, Boolean(source?.canViewPreviousRecords)),
      actionLabel: status === 'APPROVED' && !source?.accessEndedAt ? 'View Patient Profile' : undefined,

      notificationReceivedAt,
      accessGrantedAt,
      completedAt,

      displayNotificationTime: this.toDisplayTime(notificationReceivedAt),
      displayGrantedTime: this.toDisplayTime(accessGrantedAt),
      displayCompletedTime: this.toDisplayTime(completedAt)
    };
  }

  private toNotificationType(
    status: string,
    endReason?: string
  ): AppNotification['type'] {
    if (status === 'APPROVED') {
      return 'success';
    }

    if (status === 'REJECTED' || status === 'DENIED') {
      return 'danger';
    }

    if (status === 'PENDING') {
      return 'warning';
    }

    if (status === 'COMPLETED') {
      return this.isDismissedReason(endReason) ? 'danger' : 'info';
    }

    return 'info';
  }

  private toAccessScope(
    status: string,
    canViewPreviousRecords: boolean
  ): AppNotification['accessScope'] {
    if (status === 'APPROVED') {
      return canViewPreviousRecords
        ? 'Profile + Previous Medical Records'
        : 'Profile Only';
    }

    if (status === 'REJECTED' || status === 'DENIED') {
      return 'Rejected';
    }

    if (status === 'PENDING') {
      return 'Waiting for consent';
    }

    if (status === 'COMPLETED') {
      return 'Session completed';
    }

    return 'General';
  }

  private toTitle(status: string, patientId: string, endReason?: string): string {
    if (status === 'APPROVED') {
      return `Access Approved - ${patientId}`;
    }

    if (status === 'REJECTED' || status === 'DENIED') {
      return `Access Denied - ${patientId}`;
    }

    if (status === 'PENDING') {
      return `Access Request Pending - ${patientId}`;
    }

    if (status === 'COMPLETED') {
      return this.isDismissedReason(endReason)
        ? `Session Dismissed - ${patientId}`
        : `Medical Update Completed - ${patientId}`;
    }

    return `Access Update - ${patientId}`;
  }

  private toMessage(source: any, status: string): string {
    if (status === 'COMPLETED') {
      return source?.endReason ?? 'The approved access session has been completed.';
    }

    if (status === 'APPROVED') {
      return source?.requestMessage ?? 'Patient approved access to medical profile.';
    }

    if (status === 'REJECTED' || status === 'DENIED') {
      return source?.rejectionReason ?? source?.requestMessage ?? 'Patient rejected access request.';
    }

    return source?.requestMessage ?? 'Patient access notification';
  }

  private isDismissedReason(endReason?: string): boolean {
    const reason = String(endReason ?? '').toLowerCase();

    return (
      reason.includes('dismiss') ||
      reason.includes('ended approved access session') ||
      reason.includes('ended access session') ||
      reason.includes('without editing')
    );
  }

  private toDisplayTime(value?: string | null): string {
    if (!value) {
      return 'Not available';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Not available';
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private toStableId(value: string): number {
    return Math.abs(value.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    }, 0));
  }
}