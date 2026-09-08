import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  scrolled = false;
  open = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 40;

    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? (scrollTop / height) * 100 : 0;

    document.documentElement.style.setProperty('--scroll-progress', `${progress}%`);
  }

  toggle(): void {
    this.open = !this.open;
  }

  close(): void {
    this.open = false;
  }
}
