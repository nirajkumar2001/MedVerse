import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubmissionService } from '../services/submissions.service';

type NotificationType = 'Case Updates';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  icon: string;
  color: string;
  unread: boolean;
  avatar?: string;
}

interface TabItem {
  name: string;
  count: number;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
  searchText = '';
  activeTab = 'All';
  loading = false;

  private readonly readStorageKey = 'medverse_learner_read_notifications';

  tabs: TabItem[] = [
    { name: 'All', count: 0 },
    { name: 'Unread', count: 0 },
    { name: 'Case Updates', count: 0 }
  ];

  notifications: NotificationItem[] = [];

  constructor(private readonly submissionService: SubmissionService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  get filteredNotifications(): NotificationItem[] {
    let result = [...this.notifications];

    if (this.activeTab === 'Unread') {
      result = result.filter(item => item.unread);
    } else if (this.activeTab === 'Case Updates') {
      result = result.filter(item => item.type === 'Case Updates');
    }

    const search = this.searchText.trim().toLowerCase();
    if (search) {
      result = result.filter(item =>
        item.title.toLowerCase().includes(search) ||
        item.message.toLowerCase().includes(search) ||
        item.type.toLowerCase().includes(search)
      );
    }

    return result;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  markAllAsRead(): void {
    this.notifications = this.notifications.map(item => ({ ...item, unread: false }));
    this.persistReadState();
    this.updateTabCounts();
  }

  markAsRead(item: NotificationItem): void {
    item.unread = false;
    this.persistReadState();
    this.updateTabCounts();
  }

  get unreadCount(): number {
    return this.notifications.filter(item => item.unread).length;
  }

  private loadNotifications(): void {
    this.loading = true;
    this.submissionService.getMySubmissions(0, 100).subscribe({
      next: response => {
        const page = response?.data ?? response;
        const content = Array.isArray(page?.content) ? page.content : [];
        const readMap = this.getReadStateMap();

        const notifications = content.flatMap((item: any) => this.toNotifications(item));
        this.notifications = notifications
          .map((item: NotificationItem) => ({ ...item, unread: !readMap[item.id] }))
          .sort((a: NotificationItem, b: NotificationItem) => b.id.localeCompare(a.id));

        this.updateTabCounts();
        this.loading = false;
      },
      error: () => {
        this.notifications = [];
        this.updateTabCounts();
        this.loading = false;
      }
    });
  }

  private toNotifications(item: any): NotificationItem[] {
    const caseId = String(item?.caseId || '');
    const caseTitle = String(item?.caseTitle || 'Your case');
    const submittedDate = String(item?.submittedDate || '');
    const remarks = String(item?.remarks || '');
    const status = String(item?.approvalStatus || '').toUpperCase();
    const isPublished = !!item?.published;

    const baseId = `${caseId}|${submittedDate}|${status}|${isPublished}|${remarks}`;
    const output: NotificationItem[] = [];

    output.push({
      id: `${baseId}|SUBMITTED`,
      title: 'Case submitted',
      message: `${caseTitle} was submitted for verification.`,
      time: this.toRelativeTime(submittedDate),
      type: 'Case Updates',
      icon: '✓',
      color: 'blue',
      unread: true
    });

    if (status === 'APPROVED') {
      output.push({
        id: `${baseId}|APPROVED`,
        title: 'Case approved',
        message: `${caseTitle} was approved by the auth officer.`,
        time: this.toRelativeTime(submittedDate),
        type: 'Case Updates',
        icon: '✓',
        color: 'green',
        unread: true
      });
    }

    if (status === 'REJECTED') {
      output.push({
        id: `${baseId}|REJECTED`,
        title: 'Case rejected for review',
        message: remarks
          ? `${caseTitle} was rejected. Remarks: ${remarks}`
          : `${caseTitle} was rejected and needs updates.`,
        time: this.toRelativeTime(submittedDate),
        type: 'Case Updates',
        icon: '✕',
        color: 'red',
        unread: true
      });
    }

    if (isPublished) {
      output.push({
        id: `${baseId}|PUBLISHED`,
        title: 'Case published',
        message: `${caseTitle} is now published and visible in Explore Cases.`,
        time: this.toRelativeTime(submittedDate),
        type: 'Case Updates',
        icon: '📄',
        color: 'purple',
        unread: true
      });
    }

    return output;
  }

  private toRelativeTime(value: string): string {
    if (!value) return 'Recently';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;

    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  }

  private updateTabCounts(): void {
    const allCount = this.notifications.length;
    const unreadCount = this.notifications.filter(item => item.unread).length;
    const caseUpdatesCount = this.notifications.filter(item => item.type === 'Case Updates').length;

    this.tabs = [
      { name: 'All', count: allCount },
      { name: 'Unread', count: unreadCount },
      { name: 'Case Updates', count: caseUpdatesCount }
    ];
  }

  private getReadStateMap(): Record<string, boolean> {
    const raw = localStorage.getItem(this.readStorageKey);
    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }

  private persistReadState(): void {
    const readMap: Record<string, boolean> = {};
    this.notifications.forEach(item => {
      readMap[item.id] = !item.unread;
    });
    localStorage.setItem(this.readStorageKey, JSON.stringify(readMap));
  }
}
