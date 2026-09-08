import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Patient } from '../../../core/models/patient.model';

@Component({
  selector: 'app-patient-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-summary-card.component.html',
  styleUrl: './patient-summary-card.component.css'
})
export class PatientSummaryCardComponent {
  @Input() patient!: Patient;
  @Input() actionLabel = 'View';

  @Output() actionClicked = new EventEmitter();

  onActionClick(): void {
    this.actionClicked.emit(this.patient);
  }
}