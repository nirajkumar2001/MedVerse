import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CaseImageService } from '../services/case-image.service';
import { apiUrl } from '../../../../../../shared-services/src/lib/api-config';
import { LearnerNotificationCountService } from '../services/learner-notification-count.service';
import { Subscription } from 'rxjs';

interface CaseCard {
  id: string;
  title: string;
  department: string;
  description: string;
  author: string;
  date: string;
  image?: string;
  comments: number;
  tags: string[];
  bookmarked: boolean;
}

interface FeaturedCase {
  id: string;
  title: string;
  label: string;
  department: string;
  tags: string[];
  image?: string;
}

interface LearnerFeedItem {
  caseId: string;
  caseTitle: string;
  caseDescription: string;
  caseDisease: string;
  caseDepartment: string;
  learnerId?: string;
  learnerName?: string;
  publisherId?: string;
  publisherName?: string;
  reviewedDate: string;
  bookmarked: boolean;
  authOfficerId?: string;
}

@Component({
  selector: 'app-explore-cases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './explore-cases.component.html',
  styleUrl: './explore-cases.component.css'
})
export class ExploreCasesComponent implements OnInit, OnDestroy {
  notificationCount = 0;
  private readonly subscriptions = new Subscription();
  searchText = '';
  selecteddepartment = 'All';
  selectedSort = 'Most Recent';

  viewMode: 'grid' | 'list' = 'grid';

  specialties: string[] = [
    'All',
    'Cardiology',
    'Pulmonology',
    'Neurology',
    'Gastroenterology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics',
    'Others'
  ];

  featuredCases: FeaturedCase[] = [];
  cases: CaseCard[] = [];
  currentPage = 1;
  readonly pageSize = 9;

  constructor(
    private router: Router,
    private caseImageService: CaseImageService,
    private http: HttpClient,
    private learnerNotificationCountService: LearnerNotificationCountService
  ) {}

  ngOnInit(): void {
    this.loadPublishedCases();
    this.subscriptions.add(this.learnerNotificationCountService.unreadCount$.subscribe(count => {
      this.notificationCount = count;
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  departmentDropdownOpen = false;
  sortDropdownOpen = false;

  toggledepartmentDropdown() {
    this.departmentDropdownOpen = !this.departmentDropdownOpen;
  }

  selectdepartment(item: string, event: Event) {
    event.stopPropagation();
    this.selecteddepartment = item;
    this.departmentDropdownOpen = false;
  }

  get filteredCases(): CaseCard[] {
    let result = [...this.cases];
    const search = this.searchText.trim().toLowerCase();

    if (search) {
      result = result.filter(item =>
        item.title.toLowerCase().includes(search) ||
        item.department.toLowerCase().includes(search) ||
        item.author.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (this.selecteddepartment !== 'All') {
      result = result.filter(item => item.department === this.selecteddepartment);
    }

    if (this.selectedSort === 'Most Comments') {
      result.sort((a, b) => b.comments - a.comments);
    }

    return result;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCases.length / this.pageSize));
  }

  get pagedCases(): CaseCard[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCases.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getImageForCase(item: CaseCard): string {
    return this.caseImageService.getCaseImage(item.department, item.title, item.description);
  }

  getImageForFeaturedCase(item: FeaturedCase): string {
    return this.caseImageService.getCaseImage(item.department, item.title);
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  toggleBookmark(item: CaseCard, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const previous = item.bookmarked;
    item.bookmarked = !item.bookmarked;

    const request = item.bookmarked
      ? this.http.post(`${apiUrl('/learner')}/bookmarks/${item.id}`, {}, { withCredentials: true })
      : this.http.delete(`${apiUrl('/learner')}/bookmarks/${item.id}`, { withCredentials: true });

    request.subscribe({
      error: () => {
        item.bookmarked = previous;
        alert('Unable to update bookmark');
      }
    });
  }

  openCase(item: CaseCard): void {
    this.router.navigate(['/learner/case-details', item.id]);
  }

  openFeaturedCase(item: FeaturedCase): void {
    this.router.navigate(['/learner/case-details', item.id]);
  }

  openNotifications(): void {
    this.router.navigate(['/learner/notifications']);
  }

  clearFilters(): void {
    this.searchText = '';
    this.selecteddepartment = 'All';
    this.selectedSort = 'Most Recent';
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  formatCount(value: number): string {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }

    return value.toString();
  }

  private loadPublishedCases(): void {
    this.http.get<any>(`${apiUrl('/learner')}/cases?page=0&size=100`, { withCredentials: true }).subscribe({
      next: response => {
        const payload = response?.data ?? response;
        const content: LearnerFeedItem[] = payload?.content ?? [];
        this.cases = content.map(item => this.toCaseCard(item));
        this.featuredCases = this.cases.slice(0, 4).map((item, index) => ({
          id: item.id,
          title: item.title,
          label: ['Recently Published', 'Verified Case', 'Learner Pick', 'Clinical Read'][index] || 'Published',
          department: item.department,
          tags: item.tags
        }));
      },
      error: () => {
        this.cases = [];
        this.featuredCases = [];
      }
    });
  }

  private toCaseCard(item: LearnerFeedItem): CaseCard {
    const learnerName = String(item.learnerName || item.publisherName || '').trim();
    const learnerId = String(item.learnerId || item.publisherId || '').trim();
    const author = learnerName || (learnerId ? `Learner ${learnerId}` : 'MedVerse Learner');

    return {
      id: item.caseId,
      title: item.caseTitle || 'Untitled case',
      department: item.caseDepartment || 'General Medicine',
      description: item.caseDescription || 'No description available.',
      author,
      date: this.formatDate(item.reviewedDate),
      comments: 0,
      tags: [item.caseDisease, item.caseDepartment].filter(Boolean) as string[],
      bookmarked: !!item.bookmarked
    };
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
