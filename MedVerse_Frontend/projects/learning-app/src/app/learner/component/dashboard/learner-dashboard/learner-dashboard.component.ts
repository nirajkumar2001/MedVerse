import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { HeroComponent } from './hero/hero.component';
import { DashboardDataComponent } from './dashboard-data/dashboard-data.component';
import { CommonModule } from '@angular/common';
import { DashboardCasesComponent } from './dashboard-cases/dashboard-cases.component';
import { LearnerProfile, LearnerProfileService, LearnerProfileStats } from '../../services/learner-profile.service';
import { DashboardFooterComponent } from './dashboard-footer/dashboard-footer.component';

@Component({
  selector: 'app-learner-dashboard',
  standalone: true,
  imports: [CommonModule, HeroComponent, DashboardDataComponent, DashboardCasesComponent,DashboardFooterComponent],
  templateUrl: './learner-dashboard.component.html',
  styleUrl: './learner-dashboard.component.css'
})
export class LearnerDashboardComponent implements AfterViewInit {
   @ViewChild('lineChart') lineChart!: ElementRef;
  @ViewChild('donutChart') donutChart!: ElementRef;
  learnerProfile: LearnerProfile = {
    name: '',
    role: 'Medical Student',
    learnerId: '',
    institution: '',
    department: '',
    email: '',
    memberSince: '',
    image: ''
  };
  learnerStats: LearnerProfileStats | null = null;

  constructor(private readonly learnerProfileService: LearnerProfileService) {}

  ngOnInit(): void {
    this.learnerProfileService.getProfile(this.learnerProfile).subscribe(profile => {
      this.learnerProfile = profile;
    });
    this.learnerProfileService.getStats().subscribe(stats => {
      this.learnerStats = stats;
    });
  }

  ngAfterViewInit(): void {
    if (this.lineChart?.nativeElement) {
      this.createLineChart();
    }

    if (this.donutChart?.nativeElement) {
      this.createDonutChart();
    }
  }

  createLineChart() {
    const ctx = this.lineChart.nativeElement.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(28, 181, 134, 0.4)');
    gradient.addColorStop(1, 'rgba(28, 181, 134, 0)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [{
          data: [200, 135, 250, 130, 190, 170, 200, 210],
          borderColor: '#1CB586',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f0f0' } }
        }
      }
    });
  }

  createDonutChart() {
    const canvas = this.donutChart.nativeElement;
    const ctx = canvas.getContext('2d');

    const data = [
      { value: 35, color: '#6c63ff' },
      { value: 25, color: '#ff6b6b' },
      { value: 15, color: '#29c3d1' }
    ];

    let startAngle = -Math.PI / 2;

    data.forEach(segment => {
      const slice = (segment.value / 100) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(110, 110, 75, startAngle, startAngle + slice);

      ctx.strokeStyle = segment.color;
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';

      ctx.stroke();

      startAngle += slice + 0.25;
    });
  }
}

