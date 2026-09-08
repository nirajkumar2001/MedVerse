import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Patient } from '../../../core/models/patient.model';
import { MedicalRecordCardComponent } from '../../../shared/components/medical-record-card/medical-record-card.component';

@Component({
  selector: 'app-emergency-patient-details',
  standalone: true,
  imports: [
    CommonModule,
    MedicalRecordCardComponent
  ],
  templateUrl: './emergency-patient-details.component.html',
  styleUrl: './emergency-patient-details.component.css'
})
export class EmergencyPatientDetailsComponent {
  @Input() patient!: Patient;
  @Output() printClicked = new EventEmitter();

  printRecord(): void {
    this.printClicked.emit();
  }
}