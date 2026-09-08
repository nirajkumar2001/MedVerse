import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthOfficerFooterComponent } from '../../../footer/footer.component';
import { Router } from '@angular/router';
import { catchError, map, of, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthOfficerApiService, OfficerCase } from '../../../services/authofficer-api.service';

interface ApprovedCase {
  caseId: string;
  title: string;
  disease: string;
  approvedDate: string;
  status: string;
  
}

@Component({
  selector: 'app-approved-cases',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, AuthOfficerFooterComponent],
  templateUrl: './approved-cases.component.html',
  styleUrls: ['./approved-cases.component.css']
})
export class ApprovedCasesComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  private readonly refreshIntervalMs = 10000;
  private readonly subscriptions = new Subscription();

  constructor(private router: Router, private readonly authOfficerApi: AuthOfficerApiService) {}

  searchText = '';

  approvedCases: ApprovedCase[] = [];

  ngOnInit(): void {
    this.subscriptions.add(
      timer(0, this.refreshIntervalMs).pipe(
        switchMap(() => this.authOfficerApi.getCases('APPROVED').pipe(
          map(response => response.content.map(item => this.toApprovedCase(item))),
          catchError(() => of([]))
        ))
      ).subscribe(cases => {
        this.approvedCases = cases;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get filteredCases(): ApprovedCase[] {
    const search = this.searchText.toLowerCase().trim();

    if (!search) {
      return this.approvedCases;
    }

    return this.approvedCases.filter((item) =>
      item.caseId.toLowerCase().includes(search) ||
      item.title.toLowerCase().includes(search) ||
      item.disease.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    );
  }

  // viewCase(item: ApprovedCase): void {
  //   console.log('View case:', item);
  viewCase(item: ApprovedCase): void {
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
    /*
      Later, when you create a case details page, use Router:

      constructor(private router: Router) {}

      viewCase(item: ApprovedCase): void {
        this.router.navigate(['/authofficer/case-details', item.caseId]);
}}
    */
  

  exportCases(): void {
    console.log('Export approved cases:', this.filteredCases);
  }

  addNewPublishedCase(): void {
    this.router.navigate(['/authofficer/all-cases']);
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Logged out successfully');
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  private toApprovedCase(item: OfficerCase): ApprovedCase {
    return {
      caseId: item.caseId,
      title: item.caseTitle ?? item.title ?? 'Untitled case',
      disease: item.caseDisease ?? item.disease ?? 'Not specified',
      approvedDate: item.submittedDate ?? 'Not available',
      status: 'Published'
    };
  }
}
