import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { EmergencyRecord } from '../../../core/models/emergency-record.model';

@Component({
  selector: 'app-medical-record-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medical-record-card.component.html',
  styleUrl: './medical-record-card.component.css'
})
export class MedicalRecordCardComponent {
  @Input() record!: EmergencyRecord;
}