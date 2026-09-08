import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { BackButtonComponent } from '../back-button/back-button.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, BackButtonComponent],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  @Input() breadcrumbRoot = 'Doctor Portal';
  @Input() breadcrumbRootRoute = '/doctor/home';
  @Input() breadcrumbCurrent = '';
  @Input() title = '';
  @Input() titlePrefix = '';
  @Input() titleEmphasis = '';
  @Input() subtitle = '';
  @Input() badgeText = '';
  @Input() avatarText = 'AV';
  @Input() avatarImage = '';
  @Input() titleBadgeText = '';
  @Input() showBackButton = true;
  @Input() showSearch = true;
  @Input() showNotificationButton = false;
  @Input() notificationRoute = '/doctor/notifications';
  @Input() notificationCount = 0;
  @Input() theme: 'light' | 'dark' | 'patient' = 'light';
  @Input() headerVideoSrc = '';
  @Input() immersiveVideo = false;
  @Input() coverVideo = false;
  @Input() cornerTitleBadge = false;
  @Input() showBeatLine = true;

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigateByUrl(this.breadcrumbRootRoute);
  }
}
