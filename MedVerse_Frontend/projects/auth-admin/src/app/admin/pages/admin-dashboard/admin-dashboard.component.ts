import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../components/admin-footer/admin-footer.component';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import {
  AdminApiService,
  AdminUser,
  formatAdminDate,
  normalizeAdminStatus,
  toAdminTitleCase
} from '../../services/admin-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, AdminSidebarComponent, RouterModule, AdminFooterComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  overview = {
    approved: 0,
    rejected: 0,
    pending: 0,
    total: 0,
    approvalRate: 0,
    rejectedRate: 0,
    pendingRate: 0
  };

  doughnutChartType: ChartType = 'doughnut';

  doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Approved', 'Rejected', 'Pending'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#22c55e', '#ef4444', '#d1d5db'],
        borderWidth: 0,
        hoverOffset: 8
      }
    ]
  };

  doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1200
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  // cards = [
  //   {
  //     title: 'Total Users',
  //     value: '0',
  //     sub: 'All time',
  //     icon: '👥',
  //     cls: 'purple',
  //     trend: ''
  //   },
  //   {
  //     title: 'Approved Users',
  //     value: '0',
  //     sub: '0% of total',
  //     icon: '✅',
  //     cls: 'green',
  //     trend: ''
  //   },
  //   {
  //     title: 'Rejected Users',
  //     value: '0',
  //     sub: '0% of total',
  //     icon: '❌',
  //     cls: 'red',
  //     trend: ''
  //   },
  //   {
  //     title: 'Pending Users',
  //     value: '0',
  //     sub: 'Awaiting review',
  //     icon: '⏳',
  //     cls: 'blue',
  //     trend: ''
  //   }
  // ];
  cards = [
  {
    title: 'Total Users',
    value: '120',
    sub: 'All time',
    icon: '👥',
    cls: 'purple',
    trend: '',
    graphData: [20, 45, 70, 90, 75, 55, 35, 15]
  },
  {
    title: 'Approved Users',
    value: '80',
    sub: '67% of total',
    icon: '✅',
    cls: 'green',
    trend: '',
    graphData: [10, 30, 50, 85, 65, 45, 25, 10]
  },
  {
    title: 'Rejected Users',
    value: '15',
    sub: '12% of total',
    icon: '❌',
    cls: 'red',
    trend: '',
    graphData: [15, 25, 35, 50, 40, 30, 20, 10]
  },
  {
    title: 'Pending Users',
    value: '25',
    sub: 'Awaiting review',
    icon: '⏳',
    cls: 'blue',
    trend: '',
    graphData: [25, 40, 60, 80, 70, 50, 30, 20]
  }
];

  activities: Array<{ text: string; time: string; status: string; icon: string }> = [];
  pendingUsers: AdminUser[] = [];
  approvedUsers: AdminUser[] = [];
  rejectedUsers: AdminUser[] = [];
  isLoadingUsers = true;

  constructor(private readonly adminApi: AdminApiService) {
    this.loadDashboard();
    this.loadProfileQueues();
  }

  private loadDashboard(): void {
    this.adminApi.getDashboard().pipe(
      catchError(() => of(null))
    ).subscribe(stats => {
      if (!stats) return;

      const total = stats.totalActiveUsers;
      const approved = stats.totalDoctors;
      const rejected = stats.failedLogins;
      const pending = stats.pendingApprovals;
      const approvalRate = total ? Math.round((approved * 1000) / total) / 10 : 0;
      const rejectedRate = total ? Math.round((rejected * 1000) / total) / 10 : 0;
      const pendingRate = total ? Math.round((pending * 1000) / total) / 10 : 0;

      this.overview = {
        approved,
        rejected,
        pending,
        total,
        approvalRate,
        rejectedRate,
        pendingRate
      };

      this.cards = [
        {
          title: 'Total Users',
          value: String(total),
          sub: 'All time',
          icon: '👥',
          cls: 'purple',
          trend: '',
          graphData: [20, 45, 70, 90, 75, 55, 35, 15]
        },
        {
          title: 'Approved Users',
          value: String(approved),
          sub: `${approvalRate}% of total`,
          icon: '✅',
          cls: 'green',
          trend: '',
          graphData: [10, 30, 50, 85, 65, 45, 25, 10]
        },
        {
          title: 'Rejected Users',
          value: String(rejected),
          sub: `${rejectedRate}% of total`,
          icon: '❌',
          cls: 'red',
          trend: '',
          graphData: [15, 25, 35, 50, 40, 30, 20, 10]
        },
        {
          title: 'Pending Users',
          value: String(pending),
          sub: 'Awaiting review',
          icon: '⏳',
          cls: 'blue',
          trend: '',
          graphData: [25, 40, 60, 80, 70, 50, 30, 20]
        }
      ];

      this.doughnutChartData = {
        labels: ['Approved', 'Rejected', 'Pending'],
        datasets: [
          {
            data: [approved, rejected, pending],
            backgroundColor: ['#22c55e', '#ef4444', '#d1d5db'],
            borderWidth: 0,
            hoverOffset: 8
          }
        ]
      };
    });
  }

  private loadProfileQueues(): void {
    this.adminApi.getUsers().pipe(
      catchError(() => of([]))
    ).subscribe(users => {
      const sortedUsers = users
        .slice()
        .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));

      this.pendingUsers = sortedUsers.filter(user => normalizeAdminStatus(user) === 'PENDING');
      this.approvedUsers = sortedUsers.filter(user => normalizeAdminStatus(user) === 'APPROVED');
      this.rejectedUsers = sortedUsers.filter(user => normalizeAdminStatus(user) === 'REJECTED');
      this.updateOverviewFromCounts(
        sortedUsers.length,
        this.approvedUsers.length,
        this.rejectedUsers.length,
        this.pendingUsers.length
      );
      this.activities = users
        .slice()
        .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))
        .slice(0, 4)
        .map(user => {
          const status = normalizeAdminStatus(user);

          return {
            text: `User ID: ${user.userId}`,
            time: this.formatDate(user.updatedAt || user.createdAt),
            status: this.toTitleCase(status),
            icon: status === 'APPROVED' ? 'Ok' : status === 'REJECTED' ? 'No' : 'New'
          };
        });
      this.isLoadingUsers = false;
    });
  }

  private updateOverviewFromCounts(total: number, approved: number, rejected: number, pending: number): void {
    const approvalRate = total ? Math.round((approved * 1000) / total) / 10 : 0;
    const rejectedRate = total ? Math.round((rejected * 1000) / total) / 10 : 0;
    const pendingRate = total ? Math.round((pending * 1000) / total) / 10 : 0;

    this.overview = {
      approved,
      rejected,
      pending,
      total,
      approvalRate,
      rejectedRate,
      pendingRate
    };

    this.cards = [
      {
        title: 'Total Users',
        value: String(total),
        sub: 'All time',
        icon: '👥',
        cls: 'purple',
        trend: '',
        graphData: [20, 45, 70, 90, 75, 55, 35, 15]
      },
      {
        title: 'Approved Users',
        value: String(approved),
        sub: `${approvalRate}% of total`,
        icon: '✅',
        cls: 'green',
        trend: '',
        graphData: [10, 30, 50, 85, 65, 45, 25, 10]
      },
      {
        title: 'Rejected Users',
        value: String(rejected),
        sub: `${rejectedRate}% of total`,
        icon: '❌',
        cls: 'red',
        trend: '',
        graphData: [15, 25, 35, 50, 40, 30, 20, 10]
      },
      {
        title: 'Pending Users',
        value: String(pending),
        sub: 'Awaiting review',
        icon: '⏳',
        cls: 'blue',
        trend: '',
        graphData: [25, 40, 60, 80, 70, 50, 30, 20]
      }
    ];

    this.doughnutChartData = {
      labels: ['Approved', 'Rejected', 'Pending'],
      datasets: [
        {
          data: [approved, rejected, pending],
          backgroundColor: ['#22c55e', '#ef4444', '#d1d5db'],
          borderWidth: 0,
          hoverOffset: 8
        }
      ]
    };
  }

  formatDate(value?: string | number | Date | number[]): string {
    return formatAdminDate(value);
  }

  toTitleCase(value?: string): string {
    return toAdminTitleCase(value);
  }

  getStatus(user: AdminUser): string {
    return normalizeAdminStatus(user);
  }
}
