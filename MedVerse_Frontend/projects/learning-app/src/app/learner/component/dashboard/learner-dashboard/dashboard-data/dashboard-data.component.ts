import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearnerProfileStats } from '../../../services/learner-profile.service';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-dashboard-data',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-data.component.html',
  styleUrl: './dashboard-data.component.css'
})
export class DashboardDataComponent {
@Input() stats: LearnerProfileStats | null = null;

getRoute(title: string): string {
  switch (title) {
    case 'My Cases':
      return '/learner/submissions';
    case 'Under Review':
      return '/learner/submissions';
    case 'Published':
      return '/learner/submissions';
    case 'Saved Cases':
      return '/learner/bookmarks';
    default:
      return '/learner/dashboard';
  }
}

get dashboardItems() {
  return [
    {
      title: 'My Cases',
      count: this.stats?.submissionsCount ?? 0,
      subtitle: 'View all your submitted cases',
      icon: 'assets/departmentIcons/my-cases.png',
      bgColor: 'purple'
    },
    {
      title: 'Under Review',
      count: this.stats?.pendingSubmissions ?? 0,
      subtitle: 'Cases awaiting review',
      icon: 'assets/departmentIcons/review.png',
      bgColor: 'green'
    },
    {
      title: 'Published',
      count: this.stats?.approvedSubmissions ?? 0,
      subtitle: 'Your published cases',
      icon: 'assets/departmentIcons/published.png',
      bgColor: 'yellow'
    },
    {
      title: 'Saved Cases',
      count: this.stats?.bookmarksCount ?? 0,
      subtitle: 'Cases you saved',
      icon: 'assets/departmentIcons/database.png',
      bgColor: 'blue'
    }
  ];
}

}
