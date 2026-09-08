import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthOfficerFooterComponent } from '../../../footer/footer.component';
import { AuthOfficerApiService, OfficerCase } from '../../../services/authofficer-api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-case-details',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, AuthOfficerFooterComponent],
  templateUrl: './case-details.component.html',
  styleUrls: ['./case-details.component.css']
})
export class CaseDetailsComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;

  caseId = '';
  remarksText = '';
  showPopup = false;
  showPdfPreview = false;
  safePdfUrl: SafeResourceUrl | null = null;
  private pdfObjectUrl = '';

  popupData = {
    title: '',
    message: '',
    type: 'success'
  };

  caseData: any = {
    caseId: '',
    title: 'Case details not available',
    description: 'No description available.',
    disease: 'N/A',
    departmentId: 'N/A',
    status: 'N/A',
    remarks: '',
    pdfUrl: '',
    pdfName: 'Case document.pdf'
  };

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private authOfficerApi: AuthOfficerApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.caseId = this.route.snapshot.paramMap.get('caseId') || '';
    this.caseData = {
      ...this.caseData,
      ...(history.state?.caseData || {}),
      caseId: this.caseId
    };
    this.loadCase();
  }

  isPendingCase(): boolean {
    return this.caseData.status === 'Pending' || this.caseData.status === 'Under Review';
  }

  isRejectedCase(): boolean {
    return this.caseData.status === 'Rejected';
  }

  isApprovedCase(): boolean {
    return this.caseData.status === 'Approved' || this.caseData.status === 'Published';
  }

  getStatusClass(): string {
    return this.caseData.status?.toLowerCase() || '';
  }

  viewPdf(): void {
    if (!this.caseData.pdfUrl) {
      this.showCustomPopup(
        'PDF Not Available',
        'No PDF document is attached with this case.',
        'error'
      );
      return;
    }

    this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.caseData.pdfUrl);
    this.showPdfPreview = true;
  }

  closePdfPreview(): void {
    this.showPdfPreview = false;
    this.safePdfUrl = null;
  }

  approveCase(): void {
    const remarks = this.remarksText.trim();
    if (!remarks) {
      this.showCustomPopup(
        'Remarks Required',
        'Please add remarks before approving this case.',
        'error'
      );
      return;
    }

    this.authOfficerApi.verifyCase(this.caseId, 'APPROVED', remarks).subscribe({
      next: () => {
        this.caseData.status = 'Approved';
        this.caseData.remarks = remarks;
        this.showCustomPopup(
          'Case Approved',
          'The case has been approved successfully.',
          'success'
        );
      },
      error: (error: any) => {
        this.showCustomPopup(
          'Approval Failed',
          error?.error?.message || 'Unable to approve this case.',
          'error'
        );
      }
    });
  }

  rejectCase(): void {
    if (!this.remarksText.trim()) {
      this.showCustomPopup(
        'Remarks Required',
        'Please add remarks before rejecting this case.',
        'error'
      );
      return;
    }

    const remarks = this.remarksText.trim();

    this.authOfficerApi.verifyCase(this.caseId, 'REJECTED', remarks).subscribe({
      next: () => {
        this.caseData.status = 'Rejected';
        this.caseData.remarks = remarks;
        this.showCustomPopup(
          'Case Rejected',
          'The case has been rejected with remarks.',
          'error'
        );
      },
      error: (error: any) => {
        this.showCustomPopup(
          'Rejection Failed',
          error?.error?.message || 'Unable to reject this case.',
          'error'
        );
      }
    });
  }

  showCustomPopup(title: string, message: string, type: string): void {
    this.popupData = { title, message, type };
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
  }

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Logged out successfully');
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  ngOnDestroy(): void {
    this.revokePdfObjectUrl();
  }

  private loadCase(): void {
    if (!this.caseId) {
      return;
    }

    forkJoin({
      item: this.authOfficerApi.getCase(this.caseId),
      verifications: this.authOfficerApi.getVerifications(this.caseId)
    }).subscribe({
      next: ({ item, verifications }) => {
        const verification = verifications[0];
        this.caseData = this.toCaseData({
          ...item,
          remarks: verification?.remarks || item.remarks,
          approvalStatus: verification?.approvalStatus || item.approvalStatus
        });
        this.remarksText = this.isPendingCase() ? '' : this.caseData.remarks || '';
      },
      error: (error: any) => {
        this.showCustomPopup(
          'Case Not Loaded',
          error?.error?.message || 'Unable to load submitted case details.',
          'error'
        );
      }
    });
  }

  private toCaseData(item: OfficerCase): any {
    return {
      caseId: item.caseId || this.caseId,
      title: item.caseTitle || item.title || 'Case details not available',
      description: item.caseDescription || item.description || 'No description available.',
      disease: item.caseDisease || item.disease || 'N/A',
      departmentId: item.caseDepartment || item.department || item.departmentId || 'N/A',
      status: this.toDisplayStatus(item.approvalStatus || item.status),
      remarks: item.remarks || this.caseData.remarks || '',
      pdfName: item.caseDocName || item.documentName || `${item.caseTitle || item.title || 'case-document'}.pdf`,
      pdfUrl: this.toPdfUrl(item)
    };
  }

  private toDisplayStatus(status?: string): string {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'APPROVED') return 'Approved';
    if (normalized === 'REJECTED') return 'Rejected';
    if (normalized === 'PUBLISHED') return 'Published';
    if (normalized === 'UNDER_REVIEW') return 'Under Review';
    return 'Pending';
  }

  private toPdfUrl(item: OfficerCase): string {
    if (item.pdfUrl) {
      return item.pdfUrl;
    }

    const rawDoc = this.toDocumentString(item.caseDoc || item.caseDocBase64 || item.caseDocData);
    if (!rawDoc) {
      return '';
    }

    if (rawDoc.startsWith('data:')) {
      return this.dataUrlToObjectUrl(rawDoc);
    }

    const contentType = item.caseDocContentType || 'application/pdf';
    return this.base64ToObjectUrl(rawDoc, contentType);
  }

  private toDocumentString(value: unknown): string {
    if (!value) {
      return '';
    }
    if (Array.isArray(value)) {
      const bytes = new Uint8Array(value as number[]);
      let binary = '';
      bytes.forEach(byte => binary += String.fromCharCode(byte));
      return btoa(binary);
    }
    return String(value);
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
    this.pdfObjectUrl = URL.createObjectURL(new Blob([bytes], { type: contentType || 'application/pdf' }));
    return this.pdfObjectUrl;
  }

  private revokePdfObjectUrl(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = '';
    }
  }
}
