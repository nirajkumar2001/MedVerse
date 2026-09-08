import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css'
})
export class ConfirmModalComponent {
  @Input() open = false;
  @Input() icon = '!';
  @Input() iconType: 'warning' | 'danger' | 'info' = 'warning';
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to continue?';
  @Input() cancelText = 'Cancel';
  @Input() confirmText = 'Confirm';
  @Input() confirmType: 'primary' | 'danger' = 'primary';

  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
}