import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthOfficerFooterComponent } from '../../../footer/footer.component';
import { Router } from '@angular/router';
import { catchError, map, of, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthOfficerApiService, OfficerCase } from '../../../services/authofficer-api.service';

interface AllCase {
  caseId: string;
  title: string;
  disease: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedOn: string;
}

@Component({
  selector: 'app-all-cases',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, AuthOfficerFooterComponent],
  templateUrl: './all-cases.component.html',
  styleUrls: ['./all-cases.component.css']
})
export class AllCasesComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  private readonly refreshIntervalMs = 10000;
  private readonly subscriptions = new Subscription();
  private readonly hiddenCasesStorageKeyPrefix = 'medverse_authofficer_hidden_cases';

  constructor(private router: Router, private readonly authOfficerApi: AuthOfficerApiService) {}

  searchText = '';
  selectedStatus = 'All Status';
  selectedDisease = 'All Diseases';

  allCases: AllCase[] = [];
  hiddenCaseIds = new Set<string>();

  ngOnInit(): void {
    this.hiddenCaseIds = this.loadHiddenCaseIds();
    this.subscriptions.add(
      timer(0, this.refreshIntervalMs).pipe(
        switchMap(() => this.authOfficerApi.getCases().pipe(
          map(response => response.content.map(item => this.toAllCase(item))),
          catchError(() => of([]))
        ))
      ).subscribe(cases => {
        this.allCases = cases;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get statuses(): string[] {
    return ['All Status', 'Pending', 'Approved', 'Rejected'];
  }

  get diseases(): string[] {
    return ['All Diseases', ...new Set(this.allCases.map(item => item.disease))];
  }

  get filteredCases(): AllCase[] {
    const search = this.searchText.toLowerCase().trim();

    return this.allCases.filter(item => {
      if (this.hiddenCaseIds.has(item.caseId)) {
        return false;
      }

      const matchesSearch =
        !search ||
        item.caseId.toLowerCase().includes(search) ||
        item.title.toLowerCase().includes(search) ||
        item.disease.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All Status' || item.status === this.selectedStatus;

      const matchesDisease =
        this.selectedDisease === 'All Diseases' || item.disease === this.selectedDisease;

      return matchesSearch && matchesStatus && matchesDisease;
    });
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  // viewCase(item: AllCase): void {
  //   console.log('View case details:', item);
  // }
  viewCase(item: AllCase): void {
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

  removeFromList(item: AllCase): void {
    this.hiddenCaseIds.add(item.caseId);
    this.saveHiddenCaseIds();
  }

  restoreAllRemoved(): void {
    this.hiddenCaseIds.clear();
    this.saveHiddenCaseIds();
  }

  private toAllCase(item: OfficerCase): AllCase {
    return {
      caseId: item.caseId,
      title: item.caseTitle ?? item.title ?? 'Untitled case',
      disease: item.caseDisease ?? item.disease ?? 'Not specified',
      status: this.toDisplayStatus(item.approvalStatus ?? item.status ?? 'Pending') as AllCase['status'],
      submittedOn: item.submittedDate ?? 'Not available'
    };
  }

  private toDisplayStatus(status: string): string {
    if (status === 'UNDER_REVIEW') return 'Pending';
    if (status === 'APPROVED') return 'Approved';
    if (status === 'REJECTED') return 'Rejected';
    return status as AllCase['status'];
  }

  private loadHiddenCaseIds(): Set<string> {
    const raw = localStorage.getItem(this.getHiddenCasesStorageKey());
    if (!raw) {
      return new Set<string>();
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return new Set<string>();
      }
      return new Set<string>(parsed.map(item => String(item)));
    } catch {
      return new Set<string>();
    }
  }

  private saveHiddenCaseIds(): void {
    localStorage.setItem(this.getHiddenCasesStorageKey(), JSON.stringify([...this.hiddenCaseIds]));
  }

  private getHiddenCasesStorageKey(): string {
    const rawUser = localStorage.getItem('medverseCurrentUser');
    if (!rawUser) {
      return `${this.hiddenCasesStorageKeyPrefix}_anonymous`;
    }

    try {
      const parsed = JSON.parse(rawUser);
      const userId = String(parsed?.userId || '').trim();
      return `${this.hiddenCasesStorageKeyPrefix}_${userId || 'anonymous'}`;
    } catch {
      return `${this.hiddenCasesStorageKeyPrefix}_anonymous`;
    }
  }
}
