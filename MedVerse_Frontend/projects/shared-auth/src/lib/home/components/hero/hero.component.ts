import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('reveal') reveals!: QueryList<ElementRef<HTMLElement>>;
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('show', e.isIntersecting)),
      { threshold: 0.18 }
    );

    this.reveals.forEach(el => this.observer?.observe(el.nativeElement));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  tilt(event: MouseEvent, card: HTMLElement): void {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--rx', `${((event.clientY - rect.top) / rect.height - .5) * -12}deg`);
    card.style.setProperty('--ry', `${((event.clientX - rect.left) / rect.width - .5) * 12}deg`);
  }

  reset(card: HTMLElement): void {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  }
  magnet(event: MouseEvent, button: HTMLElement): void {

    const rect = button.getBoundingClientRect();
  
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
  
    button.style.transform =
      `translate(${x * 0.18}px, ${y * 0.18}px)`;
  }
  
  resetMagnet(button: HTMLElement): void {
    button.style.transform = `translate(0px,0px)`;
  }
}
