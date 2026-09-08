import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthOfficerFooterComponent } from '../../../footer/footer.component';
import {
  AuthOfficerApiService,
  AuthOfficerDashboardCounts,
  AuthOfficerProfile
} from '../../../services/authofficer-api.service';

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

@Component({
  selector: 'app-auth-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, AuthOfficerFooterComponent],
  templateUrl: './auth-officer-dashboard.component.html',
  styleUrls: ['./auth-officer-dashboard.component.css']
})
export class AuthOfficerDashboardComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  private readonly refreshIntervalMs = 10000;
  private readonly subscriptions = new Subscription();

  searchText = '';
  middleImage = 'assets/verification-illustration.png';
  verifiedToday = 0;
  totalToday = 0;

  profile: AuthOfficerProfile = {
    fullName: '',
    email: '',
    phone: '',
    department: '',
    hospitalName: '',
    experienceYears: '',
    officerId: '',
    role: 'Authentication Officer',
    status: '',
    profileImage: ''
  };

  statsCards: StatCard[] = this.toStatCards({
    totalVerified: 0,
    pendingVerification: 0,
    approvedCases: 0,
    rejectedCases: 0
  });

  quickActions: QuickAction[] = [
    {
      title: 'Verify Case',
      description: 'Review pending medical cases',
      icon: '⏳',
      color: 'purple-light',
      route: '/authofficer/verification-queue'
    },
    {
      title: 'Approved Cases',
      description: 'View approved published cases',
      icon: '✓',
      color: 'green-light',
      route: '/authofficer/approved-cases'
    },
    {
      title: 'Rejected Cases',
      description: 'View rejected case records',
      icon: '✕',
      color: 'red-light',
      route: '/authofficer/rejected-cases'
    },
    {
      title: 'All Cases',
      description: 'View complete case queue',
      icon: 'All',
      color: 'purple-light',
      route: '/authofficer/all-cases'
    }
  ];

  constructor(
    private readonly router: Router,
    private readonly authOfficerApi: AuthOfficerApiService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authOfficerApi.getProfile(this.profile).subscribe(profile => {
        this.profile = profile;
      })
    );

    this.subscriptions.add(
      timer(0, this.refreshIntervalMs).pipe(
        switchMap(() => this.authOfficerApi.getDashboardCounts())
      ).subscribe(counts => {
        this.applyDashboardCounts(counts);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get todayProgress(): number {
    if (this.totalToday === 0) {
      return 0;
    }

    return Math.round((this.verifiedToday / this.totalToday) * 100);
  }

  get speedometerDash(): string {
    const arcLength = 235;
    const progress = (this.todayProgress / 100) * arcLength;

    return `${progress} ${arcLength}`;
  }

  get needleRotation(): number {
    return -90 + (this.todayProgress * 180) / 100;
  }

  get progressDash(): string {
    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    const progress = (this.todayProgress / 100) * circumference;

    return `${progress} ${circumference}`;
  }

  get profileImage(): string {
    return this.profile.profileImage || '';
  }

  navigateToPage(route: string): void {
    this.router.navigate([route]);
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      this.authOfficerApi.updateProfile({
        ...this.profile,
        profileImage: String(reader.result || '')
      }).subscribe(profile => {
        this.profile = profile;

        this.authOfficerApi.uploadProfileImage(file).subscribe(uploadedProfile => {
          this.profile = uploadedProfile;
        });
      });
    };

    reader.readAsDataURL(file);
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    alert('Logged out successfully');
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  private applyDashboardCounts(counts: AuthOfficerDashboardCounts): void {
    this.verifiedToday = counts.totalVerified;
    this.totalToday = counts.totalVerified + counts.pendingVerification;
    this.statsCards = this.toStatCards(counts);
  }

  private toStatCards(counts: AuthOfficerDashboardCounts): StatCard[] {
    return [
      {
        title: 'Total Verified',
        value: String(counts.totalVerified),
        subtitle: 'Approved + rejected cases',
        icon: 'All',
        color: 'purple'
      },
      {
        title: 'Pending Verification',
        value: String(counts.pendingVerification),
        subtitle: 'Live learner submissions',
        icon: '⏳',
        color: 'orange'
      },
      {
        title: 'Approved Cases',
        value: String(counts.approvedCases),
        subtitle: 'View approved cases',
        icon: '✓',
        color: 'green'
      },
      {
        title: 'Rejected Cases',
        value: String(counts.rejectedCases),
        subtitle: 'View rejected case records',
        icon: '✕',
        color: 'red'
      }
    ];
  }
}
