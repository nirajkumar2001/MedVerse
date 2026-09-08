import { Component, Input, AfterViewInit, ElementRef } from '@angular/core';

@Component({
  selector: 'app-data-stats',
  standalone: true,
  templateUrl: './data-stats.component.html',
  styleUrls: ['./data-stats.component.scss']
})
export class DataStatsComponent implements AfterViewInit {
  @Input() patientCount: number = 0;
  @Input() doctorCount: number = 0;
  @Input() learnerCount: number = 0;
  @Input() officerCount: number = 0;

  displayPatient: number = 0;
  displayDoctor: number = 0;
  displayLearner: number = 0;
  displayOfficer: number = 0;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounts();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(this.el.nativeElement);
  }

  private animateCounts() {
    this.animateValue('displayPatient', this.patientCount, 1500);
    this.animateValue('displayDoctor', this.doctorCount, 1500);
    this.animateValue('displayLearner', this.learnerCount, 1500);
    this.animateValue('displayOfficer', this.officerCount, 1500);
  }

  private animateValue(prop: 'displayPatient' | 'displayDoctor' | 'displayLearner' | 'displayOfficer', target: number, duration: number) {
    let start = 0;
    const stepTime = Math.abs(Math.floor(duration / target));
    const timer = setInterval(() => {
      start += 1;
      this[prop] = start;
      if (start >= target) {
        this[prop] = target;
        clearInterval(timer);
      }
    }, stepTime);
  }
}