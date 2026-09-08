import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-toast-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-message.component.html',
  styleUrl: './toast-message.component.css'
})
export class ToastMessageComponent {
  @Input() show = false;
  @Input() type: 'success' | 'danger' | 'info' = 'success';
  @Input() message = '';
}