export type NotificationType =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type AccessStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DENIED'
  | 'COMPLETED'
  | string;

export type AccessScope =
  | 'Profile Only'
  | 'Profile + Previous Medical Records'
  | 'Waiting for consent'
  | 'Rejected'
  | 'Session completed'
  | 'General'
  | string;

export interface AppNotification {
  id: number;

  sessionId?: string;
  patientId?: string;
  doctorId?: string;

  accessStatus?: AccessStatus;
  canViewPreviousRecords?: boolean;
  accessEndedAt?: string | null;

  type: NotificationType;
  title: string;
  message: string;
  time: string;

  unread: boolean;

  accessScope?: AccessScope;
  actionLabel?: string;

  notificationReceivedAt?: string | null;
  accessGrantedAt?: string | null;
  completedAt?: string | null;

  displayNotificationTime?: string;
  displayGrantedTime?: string;
  displayCompletedTime?: string;
}