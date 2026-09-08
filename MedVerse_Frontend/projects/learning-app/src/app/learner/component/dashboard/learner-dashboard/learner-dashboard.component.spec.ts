
import { Component, AfterViewInit, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { DashboardDataComponent } from "./dashboard-data/dashboard-data.component";
import { HeroComponent } from "./hero/hero.component";
import { DashboardCasesComponent } from './dashboard-cases/dashboard-cases.component';

@Component({
  selector: 'app-learner-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardDataComponent, HeroComponent, DashboardCasesComponent],
  templateUrl: './learner-dashboard.component.html',
  styleUrls: ['./learner-dashboard.component.css']
})
export class LearnerDashboardComponent implements AfterViewInit {

  
  @ViewChild('lineChart') lineChart!: ElementRef;
  @ViewChild('donutChart') donutChart!: ElementRef;

  ngAfterViewInit(): void {
    this.createLineChart();
    this.createDonutChart();
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
// import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
// import { Chart } from 'chart.js/auto';

// @Component({
//   selector: 'app-dashboard',
//   templateUrl: './dashboard.component.html',
//   styleUrls: ['./dashboard.component.css']
// })
// export class DashboardComponent implements AfterViewInit {

// }
