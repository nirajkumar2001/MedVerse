import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-logout-confirm-modal',
  standalone: true,
  imports: [ConfirmModalComponent],
  templateUrl: './logout-confirm-modal.component.html',
  styleUrl: './logout-confirm-modal.component.css'
})
export class LogoutConfirmModalComponent {
  @Input() open = false;
  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
}