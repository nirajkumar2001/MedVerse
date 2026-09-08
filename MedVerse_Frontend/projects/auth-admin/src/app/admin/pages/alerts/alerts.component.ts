import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../components/admin-footer/admin-footer.component';
import { AdminAlert, AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, AdminFooterComponent],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent {
  alerts: AdminAlert[] = [];
  page = 0;
  readonly size = 30;
  totalItems = 0;
  totalPages = 0;
  hasNext = false;
  isLoading = false;

  constructor(private readonly adminApi: AdminApiService) {
    this.loadAlerts();
  }

  nextPage(): void {
    if (!this.hasNext || this.isLoading) return;
    this.page += 1;
    this.loadAlerts();
  }

  prevPage(): void {
    if (this.page === 0 || this.isLoading) return;
    this.page -= 1;
    this.loadAlerts();
  }

  removeAlert(alertId: string): void {
    if (!alertId || this.isLoading) return;
    this.adminApi.deleteAlert(alertId).pipe(
      catchError(() => of(null))
    ).subscribe(() => this.loadAlerts());
  }

  outcomeText(status: string): string {
    const normalized = String(status || '').toUpperCase();
    return normalized === 'SUCCESS' ? 'Successfully Done' : 'Failed to Perform';
  }

  activityNumber(index: number): number {
    return this.page * this.size + index + 1;
  }

  private loadAlerts(): void {
    this.isLoading = true;
    this.adminApi.getAlerts('all', this.page, this.size).pipe(
      catchError(() => of({
        items: [],
        page: this.page,
        size: this.size,
        totalItems: 0,
        totalPages: 0,
        hasNext: false
      }))
    ).subscribe(response => {
      this.alerts = (response.items || []).map(item => ({
        ...item,
        date: this.formatTimestamp(item.date)
      }));
      this.page = response.page || 0;
      this.totalItems = response.totalItems || 0;
      this.totalPages = response.totalPages || 0;
      this.hasNext = !!response.hasNext;
      this.isLoading = false;
    });
  }

  private formatTimestamp(value?: string | number | number[]): string {
    if (!value) return 'Not available';
    const date = this.parseTimestamp(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  }

  private parseTimestamp(value: string | number | number[]): Date {
    if (Array.isArray(value)) {
      const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = value;
      return new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000));
    }

    if (typeof value === 'number') {
      return new Date(value < 10000000000 ? value * 1000 : value);
    }

    const trimmed = value.trim();

    if (/^\d+(,\d+){2,}$/.test(trimmed)) {
      const parts = trimmed.split(',').map(part => Number(part.trim()));
      const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = parts;
      return new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000));
    }

    if (/^\d+$/.test(trimmed)) {
      const ts = Number(trimmed);
      return new Date(ts < 10000000000 ? ts * 1000 : ts);
    }

    return new Date(trimmed);
  }
}
