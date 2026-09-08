import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css'
})
export class StatCardComponent {
  @Input() icon = 'ℹ';
  @Input() iconType: 'blue' | 'orange' | 'green' | 'red' = 'blue';
  @Input() label = '';
  @Input() value = '';
  @Input() description = '';
}