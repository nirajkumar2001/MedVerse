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

  get icon(): string {
    if (this.notification.type === 'success') {
      return '✓';
    }

    if (this.notification.type === 'warning') {
      return '!';
    }

    if (this.notification.type === 'danger') {
      return '×';
    }

    return 'i';
  }

  get statusLabel(): string {
    if (this.notification.type === 'success') {
      return 'Approved';
    }

    if (this.notification.type === 'warning') {
      return 'Pending';
    }

    if (this.notification.type === 'danger') {
      return 'Denied';
    }

    return 'Info';
  }
}