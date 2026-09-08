import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
} from '@angular/core';

import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { StoryComponent } from './components/story/story.component';
import { RolesComponent } from './components/roles/roles.component';
import { FooterComponent } from './components/footer/footer.component';
import { DataStatsComponent } from './components/data-stats/data-stats.component';

@Component({
  selector: 'lib-home',
  standalone: true,
  imports: [
    NavbarComponent,
    HeroComponent,
    StoryComponent,
    RolesComponent,
    FooterComponent,
    DataStatsComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  loading = true;
  activeSection = 'hero';

  private frameId = 0;
  private lastScrollY = 0;
  private blurTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loading = false;
    }, 1600);

    this.initMagneticCards();
    this.initSceneReveal();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.blurTimer);
  }

  @HostListener('window:mousemove', ['$event'])
  move(event: MouseEvent): void {
    document.documentElement.style.setProperty('--mouse-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${event.clientY}px`);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const velocity = Math.abs(window.scrollY - this.lastScrollY);
    this.lastScrollY = window.scrollY;

    document.body.classList.toggle('scroll-blur', velocity > 22);

    clearTimeout(this.blurTimer);
    this.blurTimer = setTimeout(() => {
      document.body.classList.remove('scroll-blur');
    }, 120);
  }

  scrollTo(section: string): void {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  }

  private initMagneticCards(): void {
    document.querySelectorAll<HTMLElement>('.magnetic').forEach(card => {
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;
      let hovering = false;

      const animate = () => {
        currentX += (targetX - currentX) * 0.11;
        currentY += (targetY - currentY) * 0.11;

        card.style.transform = `
          perspective(1200px)
          translate3d(${currentX}px, ${currentY}px, 0)
          rotateX(${-currentY * 0.16}deg)
          rotateY(${currentX * 0.16}deg)
          scale(${hovering ? 1.025 : 1})
        `;

        if (
          Math.abs(targetX - currentX) > 0.01 ||
          Math.abs(targetY - currentY) > 0.01 ||
          hovering
        ) {
          this.frameId = requestAnimationFrame(animate);
        }
      };

      card.addEventListener('mousemove', event => {
        const rect = card.getBoundingClientRect();

        targetX = (event.clientX - rect.left - rect.width / 2) * 0.075;
        targetY = (event.clientY - rect.top - rect.height / 2) * 0.075;

        card.style.setProperty('--card-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--card-y', `${event.clientY - rect.top}px`);

        hovering = true;
        cancelAnimationFrame(this.frameId);
        this.frameId = requestAnimationFrame(animate);
      });

      card.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
        hovering = false;

        cancelAnimationFrame(this.frameId);
        this.frameId = requestAnimationFrame(animate);
      });
    });
  }

  private initSceneReveal(): void {
    const sections = document.querySelectorAll<HTMLElement>('[data-section]');

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          entry.target.classList.toggle('scene-active', entry.isIntersecting);

          if (entry.isIntersecting) {
            this.activeSection = (entry.target as HTMLElement).dataset['section'] || 'hero';
          }
        });
      },
      { threshold: 0.45 }
    );

    sections.forEach(section => observer.observe(section));
  }
}
