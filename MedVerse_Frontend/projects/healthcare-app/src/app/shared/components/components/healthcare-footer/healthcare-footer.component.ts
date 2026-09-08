import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-healthcare-footer',
  standalone: true,
  templateUrl: './healthcare-footer.component.html',
  styleUrl: './healthcare-footer.component.css'
})
export class HealthcareFooterComponent {
  @Input() tagline = 'Your Health, Our Priority';
}
