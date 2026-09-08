import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent {
  roles = [
    ['Patient', 'Stores records, controls consent, carries health identity.'],
    ['Doctor', 'Views emergency details and requests full record access.'],
    ['Learner', 'Studies and posts medical case studies.'],
    ['Authentication Officer', 'Verifies case studies before publication.'],
    ['Admin', 'Approves doctors, learners and officers.'],
  ];
}