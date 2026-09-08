import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthOfficerFooterComponent } from '../../../footer/footer.component';
import { Router } from '@angular/router';
import { catchError, map, of, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthOfficerApiService, OfficerCase } from '../../../services/authofficer-api.service';

interface PendingCase {
  caseId: string;
  title: string;
  disease: string;
  submittedDate: string;
  status: string;
}

@Component({
  selector: 'app-verification-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, AuthOfficerFooterComponent],
  templateUrl: './verification-queue.component.html',
  styleUrls: ['./verification-queue.component.css']
})
export class VerificationQueueComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  private readonly refreshIntervalMs = 10000;
  private readonly subscriptions = new Subscription();

  constructor(private router: Router, private readonly authOfficerApi: AuthOfficerApiService) {}

  searchText = '';

  pendingCases: PendingCase[] = [];

  ngOnInit(): void {
    this.subscriptions.add(
      timer(0, this.refreshIntervalMs).pipe(
        switchMap(() => this.authOfficerApi.getPendingCases().pipe(
          map(cases => cases.map(item => this.toPendingCase(item))),
          catchError(() => of([]))
        ))
      ).subscribe(cases => {
        this.pendingCases = cases;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  get filteredCases(): PendingCase[] {
    const search = this.searchText.toLowerCase().trim();

    if (!search) {
      return this.pendingCases;
    }

    return this.pendingCases.filter((item) =>
      item.caseId.toLowerCase().includes(search) ||
      item.title.toLowerCase().includes(search) ||
      item.disease.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    );
  }

  // viewCase(item: PendingCase): void {
  //   console.log('View pending case:', item);
  // }
  viewCase(item: PendingCase): void {
  this.router.navigate(['/authofficer/case-details', item.caseId], {
    state: {
      caseData: {
  caseId: item.caseId,
  title: item.title,
  description: 'Your case description here.',
  disease: item.disease,
  departmentId: 'DEPT-001',
  status: item.status,
  remarks: '',
  pdfUrl: 'assets/sample-case.pdf'
}
    }
  });
}
  approveCase(item: PendingCase): void {
    this.authOfficerApi.verifyCase(item.caseId, 'APPROVED', 'Approved by authentication officer').pipe(
      catchError(error => {
        console.error('Approve case failed:', error);
        return of(null);
      })
    ).subscribe(() => {
      this.pendingCases = this.pendingCases.filter(pending => pending.caseId !== item.caseId);
    });
  }

  rejectCase(item: PendingCase): void {
    this.authOfficerApi.verifyCase(item.caseId, 'REJECTED', 'Rejected by authentication officer').pipe(
      catchError(error => {
        console.error('Reject case failed:', error);
        return of(null);
      })
    ).subscribe(() => {
      this.pendingCases = this.pendingCases.filter(pending => pending.caseId !== item.caseId);
    });
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Logged out successfully');
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  private toPendingCase(item: OfficerCase): PendingCase {
    return {
      caseId: item.caseId,
      title: item.caseTitle ?? item.title ?? 'Untitled case',
      disease: item.caseDisease ?? item.disease ?? 'Not specified',
      submittedDate: item.submittedDate ?? 'Not available',
      status: this.toDisplayStatus(item.approvalStatus ?? item.status ?? 'Pending')
    };
  }

  private toDisplayStatus(status: string): string {
    if (status === 'UNDER_REVIEW') return 'Pending';
    return status.toLowerCase().replace(/(^|_|\s)\w/g, letter => letter.replace(/[_\s]/, '').toUpperCase());
  }
}
