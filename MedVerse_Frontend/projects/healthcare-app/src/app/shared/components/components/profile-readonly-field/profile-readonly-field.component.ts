import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-profile-readonly-field',
  standalone: true,
  templateUrl: './profile-readonly-field.component.html',
  styleUrl: './profile-readonly-field.component.css'
})
export class ProfileReadonlyFieldComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() icon = '🔒';
}