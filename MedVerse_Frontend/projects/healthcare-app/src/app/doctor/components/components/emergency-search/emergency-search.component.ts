import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Patient } from '../../../core/models/patient.model';
import { EmergencyLookupService } from '../../../core/services/emergency-lookup.service';

import { PatientSummaryCardComponent } from '../../../shared/components/patient-summary-card/patient-summary-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

import { NoSpecialCharsDirective } from '../../../shared/directives/no-special-chars.directive';
import { TrimLeadingSpaceDirective } from '../../../shared/directives/trim-leading-space.directive';

@Component({
  selector: 'app-emergency-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PatientSummaryCardComponent,
    EmptyStateComponent,
    NoSpecialCharsDirective,
    TrimLeadingSpaceDirective
  ],
  templateUrl: './emergency-search.component.html',
  styleUrl: './emergency-search.component.css'
})
export class EmergencySearchComponent {
  @Output() patientSelected = new EventEmitter<Patient>();
  @Output() patientCleared = new EventEmitter<void>();
  @Output() resultsPresenceChanged = new EventEmitter<boolean>();

  searchQuery = '';
  feedbackMessage = '';
  feedbackType: 'ok' | 'err' | '' = '';
  searchResults: Patient[] = [];
  hasSearched = false;
  isSearching = false;

  constructor(private emergencyLookupService: EmergencyLookupService) {}

  onSearchInput(): void {
    this.hasSearched = false;
    this.searchResults = [];
    this.patientCleared.emit();
    this.resultsPresenceChanged.emit(false);

    if (this.searchQuery.trim() === '') {
      this.feedbackMessage = '';
      this.feedbackType = '';
      return;
    }

    const validation = this.emergencyLookupService.validateSearchQuery(this.searchQuery);

    if (!validation.valid) {
      this.feedbackMessage = validation.message;
      this.feedbackType = 'err';
      return;
    }

    this.feedbackMessage = '';
    this.feedbackType = '';
  }

  searchPatient(): void {
    this.hasSearched = true;
    this.searchResults = [];
    this.resultsPresenceChanged.emit(false);

    const validation = this.emergencyLookupService.validateSearchQuery(this.searchQuery);

    if (!validation.valid) {
      this.feedbackMessage = validation.message;
      this.feedbackType = 'err';
      return;
    }

    this.isSearching = true;
    this.emergencyLookupService.searchPatientsFromApi(this.searchQuery).subscribe(matches => {
      this.isSearching = false;

      if (matches.length === 0) {
        this.feedbackMessage = 'No matching patients found.';
        this.feedbackType = 'err';
        this.resultsPresenceChanged.emit(false);
        return;
      }

      if (matches.length === 1) {
        this.selectPatient(matches[0]);
        return;
      }

      this.searchResults = matches;
      this.resultsPresenceChanged.emit(true);
      this.feedbackMessage = 'Found ' + matches.length + ' patients. Select one to view.';
      this.feedbackType = 'ok';
    });
  }

  selectPatient(patient: Patient): void {
    this.searchQuery = patient.patientId;
    this.searchResults = [];
    this.resultsPresenceChanged.emit(true);
    this.feedbackMessage = 'Loaded: ' + patient.fullName + ' (' + patient.patientId + ')';
    this.feedbackType = 'ok';
    this.patientSelected.emit(patient);
  }
}
