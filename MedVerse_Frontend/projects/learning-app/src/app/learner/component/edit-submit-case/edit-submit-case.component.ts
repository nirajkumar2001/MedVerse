import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SubmissionService } from '../services/submissions.service';

@Component({
  selector: 'app-edit-submit-cases',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-submit-case.component.html',
  styleUrl: './edit-submit-case.component.css'
})
export class EditSubmitCasesComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  id!: string;
  file: File | null = null;
  selectedFileName = '';
  isUpdating = false;
  isLoading = true;
  showAssignmentPopup = false;
  redirectCountdown = 15;
  submittedCaseId = '';
  assignedOfficerId = '';
  assignedOfficerName = '';
  private countdownTimerId: ReturnType<typeof setInterval> | null = null;
  private redirectTimerId: ReturnType<typeof setTimeout> | null = null;
  readonly departmentOptions = [
    { value: 'Cardiology', label: 'Cardiology' },
    { value: 'Pulmonology', label: 'Pulmonology' },
    { value: 'Neurology', label: 'Neurology' },
    { value: 'Gastroenterology', label: 'Gastroenterology' },
    { value: 'Dermatology', label: 'Dermatology' },
    { value: 'Pediatrics', label: 'Pediatrics' },
    { value: 'Orthopedics', label: 'Orthopedics' },
    { value: 'Oncology', label: 'Oncology' },
    { value: 'General Medicine', label: 'General Medicine' },
    { value: 'Endocrinology', label: 'Endocrinology' },
    { value: 'Nephrology', label: 'Nephrology' },
    { value: 'Gynecology', label: 'Gynecology' },
    { value: 'Psychiatry', label: 'Psychiatry' },
    { value: 'ENT (Ear, Nose & Throat)', label: 'ENT (Ear, Nose & Throat)' },
    { value: 'Ophthalmology', label: 'Ophthalmology' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: SubmissionService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];

    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      disease: ['', Validators.required],
      department: ['', Validators.required]
    });

    this.service.getSubmission(this.id).subscribe({
      next: (res) => {
        const data = res.data;
        this.form.patchValue({
          title: data.caseTitle ?? data.title,
          description: data.caseDescription ?? data.description,
          disease: data.caseDisease ?? data.disease,
          department: data.caseDepartment ?? data.department
        });

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        alert('Unable to load case details');
      }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.file = null;
      this.selectedFileName = '';
      return;
    }

    this.file = input.files[0];
    this.selectedFileName = this.file.name;
  }

  removeFile(): void {
    this.file = null;
    this.selectedFileName = '';
  }

  update(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isUpdating = true;

    const fd = new FormData();

    Object.keys(this.form.value).forEach((key) => {
      fd.append(key, this.form.value[key]);
    });

    if (this.file) {
      fd.append('pdfFile', this.file);
    }

    this.service.updateSubmission(this.id, fd).subscribe({
      next: (response) => {
        this.isUpdating = false;
        const payload = this.normalizeSubmissionPayload(response);
        this.openAssignmentPopup(payload);
      },
      error: () => {
        this.isUpdating = false;
        alert('Error updating case');
      }
    });
  }

  goBack(): void {
    this.clearRedirectTimers();
    this.router.navigate(['/learner/submissions']);
  }

  redirectToMyCasesNow(): void {
    this.clearRedirectTimers();
    this.showAssignmentPopup = false;
    this.router.navigate(['/learner/submissions']);
  }

  ngOnDestroy(): void {
    this.clearRedirectTimers();
  }

  private openAssignmentPopup(payload: any): void {
    const assignedOfficer = payload?.assignedOfficer ?? {};
    this.submittedCaseId = payload?.caseId ?? this.id ?? 'N/A';
    this.assignedOfficerId = payload?.assignedOfficerId ?? assignedOfficer?.officerId ?? assignedOfficer?.authId ?? 'Not assigned';
    this.assignedOfficerName = payload?.assignedOfficerName ?? assignedOfficer?.name ?? 'Authentication Officer';
    this.redirectCountdown = 15;
    this.showAssignmentPopup = true;
    this.clearRedirectTimers();

    this.countdownTimerId = setInterval(() => {
      this.redirectCountdown = Math.max(0, this.redirectCountdown - 1);
    }, 1000);

    this.redirectTimerId = setTimeout(() => {
      this.redirectToMyCasesNow();
    }, 15000);
  }

  private normalizeSubmissionPayload(response: any): any {
    if (!response || typeof response === 'string') return {};
    return response?.data ?? response;
  }

  private clearRedirectTimers(): void {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
    if (this.redirectTimerId) {
      clearTimeout(this.redirectTimerId);
      this.redirectTimerId = null;
    }
  }
}
