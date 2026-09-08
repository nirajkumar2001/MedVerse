import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { SubmissionService } from '../services/submissions.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LearnerNotificationCountService } from '../services/learner-notification-count.service';
import { Subscription } from 'rxjs';
// interface CaseItem {
//   id: string;
//   title: string;
//   department: string;
//   age: number;
//   submittedOn: string;
//   submittedTime: string;
//   status: 'Pending' | 'Approved' | 'Rejected';
// }
interface CaseItem {
  id: string;
  title: string;
  department: string;
  age: number;
  date: string;
  time: string;
  status: string;
  icon: string;
  remarks?: string;
  published: boolean;
  verificationId?: string;

}

interface CaseDetail extends CaseItem {
  description: string;
  disease: string;
  caseDocBase64?: string;
  caseDocName?: string;
  caseDocContentType?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedOfficerDepartment?: string;
}

@Component({
  selector: 'app-submissions',
  imports: [CommonModule],
  templateUrl: './submissions.component.html',
  styleUrl: './submissions.component.css',
  standalone: true
})
export class SubmissionsComponent implements OnInit, OnDestroy {
  notificationCount = 0;
  activeTab = 'All Cases';

  stats = [
    {
      title: 'Pending for Approval',
      count: 0,
      subtitle: 'Awaiting review by our medical team',
      icon: 'assets/departmentIcons/file.png',
      class: 'yellow'
    },
    {
      title: 'Approved',
      count: 0,
      subtitle: 'Successfully approved submissions',
      icon: 'assets/departmentIcons/approve.png',
      class: 'green'
    },
    {
      title: 'Rejected for Review',
      count: 0,
      subtitle: 'Require changes or additional information',
      icon: 'assets/departmentIcons/cancel.png',
      class: 'red'
    },
    {
      title: 'Total Submissions',
      count: 0,
      subtitle: 'All time submissions made',
      icon: 'assets/departmentIcons/all.png',
      class: 'purple'
    }
  ];

  tabs = [
    { name: 'All Cases', count: 0 },
    { name: 'Pending for Approval', count: 0 },
    { name: 'Approved', count: 0 },
    { name: 'Rejected for Review', count: 0 }
  ];

  cases: CaseItem[] = [];
  publishingCaseIds = new Set<string>();
  selectedCase: CaseDetail | null = null;
  safePdfUrl: SafeResourceUrl | null = null;
  loadingDetailId = '';
  private pdfObjectUrl = '';
  private readonly subscriptions = new Subscription();


  constructor(
    private readonly submissionService: SubmissionService,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly learnerNotificationCountService: LearnerNotificationCountService
  ) { }

  ngOnInit(): void {
    this.loadSubmissions();
    this.subscriptions.add(this.learnerNotificationCountService.unreadCount$.subscribe(count => {
      this.notificationCount = count;
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.revokePdfObjectUrl();
  }

  get filteredCases(): CaseItem[] {

    if (this.activeTab === 'All Cases') {
      return this.cases;
    }

    return this.cases.filter(
      item => item.status === this.activeTab
    );
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  openNotifications(): void {
    this.router.navigate(['/learner/notifications']);
  }

  openCase(item: CaseItem): void {
    this.loadingDetailId = item.id;
    this.submissionService.getSubmission(item.id).subscribe({
      next: response => {
        const detail = response?.data ?? response;
        this.selectedCase = this.toCaseDetail(detail);
        this.safePdfUrl = this.toSafePdfUrl(detail);
        this.loadingDetailId = '';
      },
      error: error => {
        this.loadingDetailId = '';
        alert(error?.error?.message || 'Unable to load case details');
      }
    });
  }

  closeCaseDetails(): void {
    this.selectedCase = null;
    this.safePdfUrl = null;
    this.revokePdfObjectUrl();
  }

    editCase(item: CaseItem): void {
    if (item.status !== 'Rejected for Review') {
      return;
    }

    this.router.navigate(['/learner/edit-submit-cases', item.id]);
  }

  publishCase(item: CaseItem): void {
    if (item.status !== 'Approved' || item.published || this.publishingCaseIds.has(item.id)) {
      return;
    }

    this.publishingCaseIds.add(item.id);
    this.submissionService.publishSubmission(item.id).subscribe({
      next: () => {
        item.published = true;
        this.publishingCaseIds.delete(item.id);
        alert('Case published successfully');
        this.loadSubmissions();
      },
      error: error => {
        this.publishingCaseIds.delete(item.id);
        alert(error?.error?.message || 'Unable to publish case');
      }
    });
  }

  isPublishing(item: CaseItem): boolean {
    return this.publishingCaseIds.has(item.id);
  }

  removeCase(item: CaseItem): void {
    const confirmed = confirm('Remove this case from your submissions?');
    if (!confirmed) {
      return;
    }

    this.submissionService.deleteSubmission(item.id).subscribe({
      next: () => {
        this.cases = this.cases.filter(current => current.id !== item.id);
        this.updateCounts();
      },
      error: error => {
        alert(error?.error?.message || 'Unable to remove case');
      }
    });
  }


  getStatusClass(status: string): string {

    switch (status) {

      case 'Approved':
        return 'approved';

      case 'Pending for Approval':
        return 'pending';

      case 'Rejected for Review':
        return 'rejected';

      default:
        return '';
    }
  }

  private loadSubmissions(): void {
    this.submissionService.getMySubmissions(0, 100).subscribe((response: any) => {
      const page = response?.data ?? response;
      const content = page?.content ?? [];
      this.cases = content.map((item: any) => this.toCaseItem(item));
      this.updateCounts();
    });
  }

  private toCaseItem(item: any): CaseItem {
    const submitted = this.splitSubmittedDate(item.submittedDate);
    const verificationId = this.toDisplayVerificationId(item.caseId, item.verificationId);

    return {
      id: item.caseId,
      title: item.caseTitle,
      department: item.caseDepartment,
      age: 0,
      date: submitted.date,
      time: submitted.time,
      status: this.toDisplayStatus(item.approvalStatus),
      icon: this.toIcon(item.caseDepartment),
      remarks: item.remarks || '',
      published: !!item.published,
      verificationId
    };
  }

  private toCaseDetail(item: any): CaseDetail {
    const submitted = this.splitSubmittedDate(item.submittedDate);
    const verificationId = this.toDisplayVerificationId(item.caseId, item.verificationId);
    return {
      id: item.caseId,
      title: item.caseTitle,
      department: item.caseDepartment,
      disease: item.caseDisease || '',
      description: item.caseDescription || 'No description available.',
      age: 0,
      date: submitted.date,
      time: submitted.time,
      status: this.toDisplayStatus(item.approvalStatus),
      icon: this.toIcon(item.caseDepartment),
      remarks: item.remarks || '',
      published: !!item.published,
      verificationId,
      caseDocBase64: item.caseDocBase64 || '',
      caseDocName: item.caseDocName || 'Case document.pdf',
      caseDocContentType: item.caseDocContentType || 'application/pdf',
      assignedOfficerId: item.assignedOfficerId || '',
      assignedOfficerName: item.assignedOfficerName || '',
      assignedOfficerDepartment: item.assignedOfficerDepartment || ''
    };
  }

  private toSafePdfUrl(item: any): SafeResourceUrl | null {
    const rawDoc = item?.caseDocBase64;
    if (!rawDoc) {
      return null;
    }

    const url = String(rawDoc).startsWith('data:')
      ? this.dataUrlToObjectUrl(String(rawDoc))
      : this.base64ToObjectUrl(String(rawDoc), item.caseDocContentType || 'application/pdf');

    return this.sanitizer.bypassSecurityTrustResourceUrl(`${url}#toolbar=0&navpanes=0&scrollbar=0&zoom=85`);
  }

  private dataUrlToObjectUrl(dataUrl: string): string {
    const parts = dataUrl.split(',');
    const metadata = parts[0] || '';
    const contentType = metadata.match(/data:(.*?);base64/)?.[1] || 'application/pdf';
    return this.base64ToObjectUrl(parts.slice(1).join(','), contentType);
  }

  private base64ToObjectUrl(base64: string, contentType: string): string {
    this.revokePdfObjectUrl();
    const cleanBase64 = base64.includes(',') ? base64.substring(base64.indexOf(',') + 1) : base64;
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }
    this.pdfObjectUrl = URL.createObjectURL(new Blob([bytes], { type: contentType }));
    return this.pdfObjectUrl;
  }

  private revokePdfObjectUrl(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = '';
    }
  }

  private updateCounts(): void {
    const pending = this.cases.filter(item => item.status === 'Pending for Approval').length;
    const approved = this.cases.filter(item => item.status === 'Approved').length;
    const rejected = this.cases.filter(item => item.status === 'Rejected for Review').length;
    const total = this.cases.length;

    this.stats = [
      { ...this.stats[0], count: pending },
      { ...this.stats[1], count: approved },
      { ...this.stats[2], count: rejected },
      { ...this.stats[3], count: total }
    ];
    this.tabs = [
      { name: 'All Cases', count: total },
      { name: 'Pending for Approval', count: pending },
      { name: 'Approved', count: approved },
      { name: 'Rejected for Review', count: rejected }
    ];
  }

  private toDisplayStatus(status: string): string {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'APPROVED') return 'Approved';
    if (normalized === 'REJECTED') return 'Rejected for Review';
    return 'Pending for Approval';
  }

  private toIcon(department: string): string {
    const normalized = String(department || '').toLowerCase();
    if (normalized.includes('neuro')) return 'brain';
    if (normalized.includes('pulmo')) return 'lungs';
    if (normalized.includes('gastro') || normalized.includes('endo')) return 'stomach';
    return 'file';
  }

  private splitSubmittedDate(value: string): { date: string; time: string } {
    if (!value) return { date: 'Not available', time: '' };
    const parts = value.split(',');
    return {
      date: parts[0]?.trim() || value,
      time: parts.slice(1).join(',').trim()
    };
  }

  private toDisplayVerificationId(caseId: string, verificationId?: string): string {
    const normalizedCaseId = String(caseId || '').trim();
    const normalizedVerificationId = String(verificationId || '').trim();
    if (!normalizedCaseId) {
      return normalizedVerificationId;
    }
    if (!normalizedVerificationId) {
      return normalizedCaseId;
    }

    const caseSuffix = normalizedCaseId.replace(/^CASE-/, '');
    const verificationSuffix = normalizedVerificationId.replace(/^VER-/, '');
    if (caseSuffix === verificationSuffix) {
      return normalizedCaseId;
    }
    return normalizedVerificationId;
  }
}
