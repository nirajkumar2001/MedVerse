import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-access-status-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './access-status-chip.component.html',
  styleUrl: './access-status-chip.component.css'
})
export class AccessStatusChipComponent {
  @Input() type: 'success' | 'warning' | 'danger' | 'info' = 'info';
  @Input() label = 'Info';
}