import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import { SubmissionService } from '../services/submissions.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-submit-new-case',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './submit-new-case.component.html',
  styleUrl: './submit-new-case.component.css'
})
export class SubmitNewCaseComponent implements OnDestroy{
  form: FormGroup;
  file: File | null = null;
  selectedFileName = '';
  isSubmitting = false;
    showAssignmentPopup = false;
  redirectCountdown = 15;
  submittedCaseId = '';
  assignedOfficerId = '';
  assignedOfficerName = '';
  assignedOfficerDepartment = '';
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
    private fb: FormBuilder,
    private service: SubmissionService,
    private router: Router

  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      disease: ['', Validators.required],
      department: ['', Validators.required]
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('title', this.form.value.title);
    formData.append('description', this.form.value.description);
    formData.append('disease', this.form.value.disease);
    formData.append('department', this.form.value.department);

    if (this.file) {
      formData.append('pdfFile', this.file);
    }

    this.service.submitCase(formData).subscribe({
      // next: () => {
      //   this.isSubmitting = false;
      //   alert('Case submitted successfully');
      //   this.form.reset();
      //   this.removeFile();
      // },
      next: (response) => {
        this.isSubmitting = false;
        const payload = this.normalizeSubmissionPayload(response);
        this.openAssignmentPopup(payload);
        this.hydrateAssignmentDetails(payload);
        this.form.reset();
        this.removeFile();
      },
      error: (error) => {
        this.isSubmitting = false;
        const message = error?.error?.message || error?.error?.error || 'Error submitting case';
        alert(message);
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
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
    this.submittedCaseId = payload?.caseId ?? 'N/A';
    this.assignedOfficerId = payload?.assignedOfficerId ?? assignedOfficer?.officerId ?? assignedOfficer?.authId ?? 'Not assigned';
    this.assignedOfficerName = payload?.assignedOfficerName ?? assignedOfficer?.name ?? 'Authentication Officer';
    this.assignedOfficerDepartment = payload?.assignedOfficerDepartment ?? assignedOfficer?.department ?? assignedOfficer?.specialization ?? 'N/A';
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
    if (!response) return {};
    if (typeof response === 'string') return {};
    return response?.data ?? response;
  }

  private hydrateAssignmentDetails(payload: any): void {
    const caseId = payload?.caseId;
    if (!caseId) {
      return;
    }

    const missingOfficerInfo =
      !payload?.assignedOfficerId ||
      !payload?.assignedOfficerName ||
      !payload?.assignedOfficerDepartment;

    if (!missingOfficerInfo) {
      return;
    }

    this.service.getSubmission(caseId).subscribe({
      next: (detailResponse) => {
        const detail = this.normalizeSubmissionPayload(detailResponse);
        const assignedOfficer = detail?.assignedOfficer ?? {};
        this.assignedOfficerId = detail?.assignedOfficerId || assignedOfficer?.officerId || assignedOfficer?.authId || this.assignedOfficerId;
        this.assignedOfficerName = detail?.assignedOfficerName || assignedOfficer?.name || this.assignedOfficerName;
        this.assignedOfficerDepartment = detail?.assignedOfficerDepartment || assignedOfficer?.department || assignedOfficer?.specialization || this.assignedOfficerDepartment;
      },
      error: () => {
        // Keep popup open with fallback values even if detail fetch fails.
      }
    });
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
