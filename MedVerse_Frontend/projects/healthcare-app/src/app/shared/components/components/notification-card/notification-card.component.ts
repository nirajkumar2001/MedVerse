import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AppNotification } from '../../../core/models/app-notification.model';
import { AccessStatusChipComponent } from '../access-status-chip/access-status-chip.component';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule, AccessStatusChipComponent],
  templateUrl: './notification-card.component.html',
  styleUrl: './notification-card.component.css'
})
export class NotificationCardComponent {
  @Input() notification!: AppNotification;
  @Input() showStatusChip = true;
  @Input() showDismiss = true;

  @Output() actionClicked = new EventEmitter<AppNotification>();
  @Output() dismissed = new EventEmitter<number>();
  @Output() endSessionClicked = new EventEmitter<AppNotification>();

  get icon(): string {
    if (this.isActiveSession) {
      return '✓';
    }

    if (this.isNewRequest) {
      return '!';
    }

    if (this.isDismissed) {
      return '×';
    }

    if (this.isCompleted) {
      return '✓';
    }

    return 'i';
  }

  get statusLabel(): string {
    if (this.isNewRequest) {
      return 'New';
    }

    if (this.isActiveSession) {
      return 'Active Session';
    }

    if (this.isDismissed) {
      return 'Dismissed';
    }

    if (this.isCompleted) {
      return 'Completed';
    }

    return 'Info';
  }

  get isNewRequest(): boolean {
    return this.normalizedStatus === 'PENDING';
  }

  get isActiveSession(): boolean {
    return this.normalizedStatus === 'APPROVED' && !this.notification.accessEndedAt;
  }

  get isDismissed(): boolean {
    const message = String(this.notification.message ?? '').toLowerCase();

    if (this.normalizedStatus === 'REJECTED' || this.normalizedStatus === 'DENIED') {
      return true;
    }

    if (this.normalizedStatus !== 'COMPLETED') {
      return false;
    }

    return (
      message.includes('dismiss') ||
      message.includes('ended approved access session') ||
      message.includes('ended access session') ||
      message.includes('without editing')
    );
  }

  get isCompleted(): boolean {
    return this.normalizedStatus === 'COMPLETED' && !this.isDismissed;
  }

  get showViewProfileAction(): boolean {
    return Boolean(this.notification.actionLabel) && this.isActiveSession;
  }

  get showEndSessionAction(): boolean {
    return this.isActiveSession;
  }

  private get normalizedStatus(): string {
    return String(this.notification.accessStatus ?? '').toUpperCase();
  }
}