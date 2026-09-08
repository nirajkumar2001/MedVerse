// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-case-details',
//   imports: [],
//   templateUrl: './case-details.component.html',
//   styleUrl: './case-details.component.css'
// })
// export class CaseDetailsComponent {

// }
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { apiUrl } from '../../../../../../shared-services/src/lib/api-config';

interface CaseAttachment {
  name: string;
  type: string;
  size: string;
  url: string;
}

interface CaseComment {
  user: string;
  role: string;
  comment: string;
  time: string;
}

interface CaseDetails {
  id: string;
  title: string;
  status: 'Published' | 'Pending Approval' | 'Rejected for Review';
  department: string;
  submittedOn: string;
  publishedOn: string;
  author: string;
  institution: string;
  bookmarks: number;
  caseImage: string;
  pdfUrl: string;
  description:string;
  remarks: string;
  disease: string;

}

@Component({
  selector: 'app-case-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './case-details.component.html',
  styleUrl: './case-details.component.css'
})
export class CaseDetailsComponent implements OnInit, OnDestroy {
  caseBookmarked = false;
  safePdfUrl: SafeResourceUrl | null = null;
  caseId = '';
  activeTab: 'details' | 'pdf' | 'discussion' = 'details';
  private pdfObjectUrl = '';
  
  caseData: CaseDetails = {
    id: 'CASE-001',
    title: 'Severe Community Acquired Pneumonia in an Elderly Patient',
    status: 'Published',
    department: 'Pulmonology',
    submittedOn: 'May 14, 2025',
    publishedOn: 'May 16, 2025',
    author: 'Dr. Neha Kapoor',
    institution: 'AIIMS, New Delhi',
    bookmarks: 42,
    pdfUrl: 'assets/medicalImg/medicalCaseSample.pdf',
    description: 'A 72-year-old male patient presented with fever, productive cough, and progressive breathlessness for four days. The case highlights clinical assessment, radiological interpretation, and early management of severe community acquired pneumonia.',
    caseImage: '',
    remarks: '',
    disease: 'Pneumonia'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.caseId = this.route.snapshot.paramMap.get('id') || '';
    this.preparePdfUrl(this.caseData.pdfUrl);
    this.loadPublishedCase();
  }

  ngOnDestroy(): void {
    this.revokePdfObjectUrl();
  }

  setActiveTab(tab: 'details' | 'pdf' | 'discussion'): void {
    this.activeTab = tab;
  }

  goBack(): void {
  this.location.back();
}


  toggleBookmark(): void {
    const previous = this.caseBookmarked;
    this.caseBookmarked = !this.caseBookmarked;

    const request = this.caseBookmarked
      ? this.http.post(`${apiUrl('/learner')}/bookmarks/${this.caseData.id}`, {}, { withCredentials: true })
      : this.http.delete(`${apiUrl('/learner')}/bookmarks/${this.caseData.id}`, { withCredentials: true });

    request.subscribe({
      error: () => {
        this.caseBookmarked = previous;
        alert('Unable to update bookmark');
      }
    });
  }

  openPdf(): void {
    window.open(this.caseData.pdfUrl, '_blank');
  }

  downloadPdf(): void {
    const link = document.createElement('a');
    link.href = this.caseData.pdfUrl;
    link.download = `${this.caseData.id}-case-report.pdf`;
    link.click();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replaceAll(' ', '-');
  }

  private loadPublishedCase(): void {
    if (!this.caseId) {
      return;
    }

    this.http.get<any>(`${apiUrl('/learner')}/cases/${this.caseId}`, { withCredentials: true }).subscribe({
      next: response => {
        const item = response?.data ?? response;
        this.caseData = {
          ...this.caseData,
          id: item.caseId || this.caseId,
          title: item.caseTitle || this.caseData.title,
          department: item.caseDepartment || 'General Medicine',
          disease: item.caseDisease || '',
          description: item.caseDescription || 'No description available.',
          publishedOn: this.formatDate(item.reviewedDate),
          submittedOn: this.formatDate(item.reviewedDate),
          author: item.learnerName || (item.learnerId ? `Learner ${item.learnerId}` : 'MedVerse Learner'),
          institution: item.learnerId || 'Publisher verified via MedVerse',
          bookmarks: 0,
          status: 'Published',
          remarks: item.authOfficerRemarks || '',
          pdfUrl: this.toPdfUrl(item)
        };
        this.caseBookmarked = !!item.bookmarked;
        this.preparePdfUrl(this.caseData.pdfUrl);
      }
    });
  }

  private toPdfUrl(item: any): string {
    const rawDoc = item?.caseDoc;
    if (!rawDoc) {
      return this.caseData.pdfUrl;
    }

    if (String(rawDoc).startsWith('data:')) {
      return this.dataUrlToObjectUrl(rawDoc);
    }

    return this.base64ToObjectUrl(rawDoc, item.caseDocContentType || 'application/pdf');
  }

  private preparePdfUrl(url: string): void {
    const isMobile = window.innerWidth <= 768;
    const zoomLevel = isMobile ? 55 : 90;
    this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `${url}#toolbar=0&navpanes=0&scrollbar=0&zoom=${zoomLevel}`
    );
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

  private formatDate(value: string): string {
    if (!value) {
      return 'Recently';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
