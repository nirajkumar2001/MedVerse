import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './learner/component/sidebar/sidebar.component';
import { filter } from 'rxjs';
import { FooterComponent } from './learner/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
// @NgModule({

// })
export class AppComponent {
  title = 'medverse';
  isAuthOfficerRoute = false;
  isAuthRoute = false;
  isCollapsed = false;

  constructor(private router: Router) {
    this.updateRouteFlags(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateRouteFlags(event.urlAfterRedirects);
      });
  }

  private updateRouteFlags(url: string): void {
    this.isAuthOfficerRoute = url.startsWith('/authofficer');
    this.isAuthRoute = url.startsWith('/login')
      || url.startsWith('/signup')
      || url.startsWith('/otp-verification')
      || url.startsWith('/device-limit-reached')
      || url.startsWith('/forgot-password')
      || url.startsWith('/reset-password')
      || url.startsWith('/change-password');
  }
}
