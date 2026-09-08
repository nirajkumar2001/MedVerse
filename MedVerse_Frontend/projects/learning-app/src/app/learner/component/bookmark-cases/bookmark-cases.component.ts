import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CaseImageService } from '../services/case-image.service';
import { apiUrl } from '../../../../../../shared-services/src/lib/api-config';
import { LearnerNotificationCountService } from '../services/learner-notification-count.service';
import { Subscription } from 'rxjs';

interface SavedStat {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: string;
}

interface CategoryFilter {
  name: string;
  count: number;
}

interface SavedCase {
  id: string;
  title: string;
  department: string;
  description: string;
  savedDate: string;
  savedAt: string;
  author: string;
}

@Component({
  selector: 'app-bookmark-cases',
  imports: [CommonModule, FormsModule],
  templateUrl: './bookmark-cases.component.html',
  styleUrl: './bookmark-cases.component.css',
  standalone: true
})
export class BookmarkCasesComponent implements OnInit, OnDestroy {
  notificationCount = 0;
  searchText = '';
  activeCategory = 'All Saved';
  viewMode: 'grid' | 'list' = 'grid';
  currentPage = 1;
  readonly pageSize = 9;
  private readonly subscriptions = new Subscription();

  stats: SavedStat[] = [
    {
      title: 'Total Saved',
      value: 0,
      subtitle: 'All time',
      icon: 'BK',
      color: 'purple'
    },
    {
      title: 'Recently Saved',
      value: 0,
      subtitle: 'Past 7 days',
      icon: '7D',
      color: 'blue'
    }
  ];

  categories: CategoryFilter[] = [
    { name: 'All Saved', count: 0 }
  ];

  savedCases: SavedCase[] = [];
  private totalSavedCount = 0;

  constructor(
    private router: Router,
    private http: HttpClient,
    public caseImageService: CaseImageService,
    private learnerNotificationCountService: LearnerNotificationCountService
  ) {}

  ngOnInit(): void {
    this.loadBookmarks();
    this.subscriptions.add(this.learnerNotificationCountService.unreadCount$.subscribe(count => {
      this.notificationCount = count;
    }));
  }

  get filteredCases(): SavedCase[] {
    let cases = [...this.savedCases];

    if (this.activeCategory !== 'All Saved') {
      cases = cases.filter(item => item.department === this.activeCategory);
    }

    const search = this.searchText.trim().toLowerCase();
    if (search) {
      cases = cases.filter(item =>
        item.title.toLowerCase().includes(search) ||
        item.department.toLowerCase().includes(search) ||
        item.author.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search)
      );
    }

    return cases;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCases.length / this.pageSize));
  }

  get pagedCases(): SavedCase[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCases.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setActiveCategory(category: string): void {
    this.activeCategory = category;
    this.currentPage = 1;
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
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

  openCase(item: SavedCase): void {
    this.router.navigate(['/learner/case-details', item.id]);
  }

  openNotifications(): void {
    this.router.navigate(['/learner/notifications']);
  }

  removeBookmark(item: SavedCase, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.http.delete(`${apiUrl('/learner')}/bookmarks/${item.id}`, { withCredentials: true }).subscribe({
      next: () => {
        this.savedCases = this.savedCases.filter(current => current.id !== item.id);
        this.refreshCounts();
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
        }
      },
      error: error => {
        alert(error?.error?.message || 'Unable to remove bookmark');
      }
    });
  }

  private loadBookmarks(): void {
    this.http.get<any>(`${apiUrl('/learner')}/bookmarks?page=0&size=1000`, { withCredentials: true }).subscribe({
      next: response => {
        const payload = response?.data ?? response;
        const content = payload?.content ?? [];
        this.totalSavedCount = Number(payload?.totalElements ?? content.length);
        this.savedCases = content.map((item: any) => ({
          id: item.caseId,
          title: item.title || 'Untitled case',
          department: item.category || 'General Medicine',
          description: item.description || 'No description available.',
          savedDate: item.savedOn ? `Saved ${item.savedOn}` : 'Saved recently',
          savedAt: item.savedAt || '',
          author: 'MedVerse Auth Officer'
        }));
        this.refreshCounts();
      },
      error: () => {
        this.totalSavedCount = 0;
        this.savedCases = [];
        this.refreshCounts();
      }
    });
  }

  private refreshCounts(): void {
    const total = this.totalSavedCount;
    const recent = this.savedCases.filter(item => this.isWithinLastSevenDays(item.savedAt)).length;

    this.stats = [
      { ...this.stats[0], value: total },
      { ...this.stats[1], value: recent }
    ];

    const departmentCounts = new Map<string, number>();
    this.savedCases.forEach(item => {
      departmentCounts.set(item.department, (departmentCounts.get(item.department) || 0) + 1);
    });

    this.categories = [
      { name: 'All Saved', count: total },
      ...Array.from(departmentCounts.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, count]) => ({ name, count }))
    ];

    if (this.activeCategory !== 'All Saved' && !departmentCounts.has(this.activeCategory)) {
      this.activeCategory = 'All Saved';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private isWithinLastSevenDays(value: string): boolean {
    if (!value) {
      return false;
    }

    const savedAt = new Date(value);
    if (Number.isNaN(savedAt.getTime())) {
      return false;
    }

    return savedAt.getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000;
  }
}
