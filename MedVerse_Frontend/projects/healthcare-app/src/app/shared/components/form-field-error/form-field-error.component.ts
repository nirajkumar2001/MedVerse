import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-field-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field-error.component.html',
  styleUrl: './form-field-error.component.css'
})
export class FormFieldErrorComponent {
  @Input() message = '';
}