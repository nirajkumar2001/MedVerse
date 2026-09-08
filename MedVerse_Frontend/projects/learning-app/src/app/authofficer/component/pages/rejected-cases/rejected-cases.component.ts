import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthOfficerFooterComponent } from '../../../footer/footer.component';
import { Router } from '@angular/router';
import { catchError, map, of, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthOfficerApiService, OfficerCase } from '../../../services/authofficer-api.service';

interface RejectedCase {
  caseId: string;
  title: string;
  disease: string;
  rejectedDate: string;
  status: string;
}

@Component({
  selector: 'app-rejected-cases',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, AuthOfficerFooterComponent],
  templateUrl: './rejected-cases.component.html',
  styleUrls: ['./rejected-cases.component.css']
})
export class RejectedCasesComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  private readonly refreshIntervalMs = 10000;
  private readonly subscriptions = new Subscription();

  constructor(private router: Router, private readonly authOfficerApi: AuthOfficerApiService) {}

  searchText = '';

  rejectedCases: RejectedCase[] = [];

  ngOnInit(): void {
    this.subscriptions.add(
      timer(0, this.refreshIntervalMs).pipe(
        switchMap(() => this.authOfficerApi.getCases('REJECTED').pipe(
          map(response => response.content.map(item => this.toRejectedCase(item))),
          catchError(() => of([]))
        ))
      ).subscribe(cases => {
        this.rejectedCases = cases;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get filteredCases(): RejectedCase[] {
    const search = this.searchText.toLowerCase().trim();

    if (!search) {
      return this.rejectedCases;
    }

    return this.rejectedCases.filter((item) =>
      item.caseId.toLowerCase().includes(search) ||
      item.title.toLowerCase().includes(search) ||
      item.disease.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    );
  }

  // viewCase(item: RejectedCase): void {
  //   console.log('View rejected case:', item);
  // }
  viewCase(item: RejectedCase): void {
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
  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Logged out successfully');
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  private toRejectedCase(item: OfficerCase): RejectedCase {
    return {
      caseId: item.caseId,
      title: item.caseTitle ?? item.title ?? 'Untitled case',
      disease: item.caseDisease ?? item.disease ?? 'Not specified',
      rejectedDate: item.submittedDate ?? 'Not available',
      status: 'Rejected'
    };
  }
}
