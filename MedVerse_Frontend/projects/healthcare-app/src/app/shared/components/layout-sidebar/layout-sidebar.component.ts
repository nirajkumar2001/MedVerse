import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SidebarItem } from '../../../core/models/sidebar-item.model';

type PortalRole = 'PATIENT' | 'DOCTOR';

interface SidebarBubble {
  id: number;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
}

@Component({
  selector: 'app-layout-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './layout-sidebar.component.html',
  styleUrls: ['./layout-sidebar.component.css']
})
export class LayoutSidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() brandName = 'MedVerse';
  @Input() menuItems: SidebarItem[] = [];
  @Input() userName = '';

  @Output() logoutClicked = new EventEmitter<void>();

  collapsed = false;
  currentRole: PortalRole = 'PATIENT';
  bubbles: SidebarBubble[] = [];

  private static collapsedState = false;

  private animationFrameId = 0;
  private lastAnimationTime = 0;
  private resizeObserver?: ResizeObserver;
  private motionAllowed = true;

  private readonly defaultMenuItems: Record<PortalRole, SidebarItem[]> = {
    PATIENT: [
      { label: 'Dashboard', route: '/patient/home', icon: 'D', exact: true },
      { label: 'My Profile', route: '/patient/profile', icon: 'P', exact: true },
      { label: 'Emergency Details', route: '/patient/emergency-details', icon: 'E', exact: true },
      { label: 'My Medical Records', route: '/patient/medical-records', icon: 'M', exact: true },
      { label: 'Access Requests', route: '/patient/notifications', icon: 'N', exact: true },
      { label: 'Help & Support', route: '/patient/support', icon: 'H', exact: true }
    ],
    DOCTOR: [
      { label: 'Dashboard', route: '/doctor/home', icon: 'D', exact: true },
      { label: 'Emergency Lookup', route: '/doctor/emergency-lookup', icon: 'E', exact: true },
      { label: 'Patient Care', route: '/doctor/patient-care', icon: 'C', exact: true },
      { label: 'Doctor Profile', route: '/doctor/profile', icon: 'P', exact: true },
      { label: 'Notifications', route: '/doctor/notifications', icon: 'N', exact: true },
      { label: 'Help & Support', route: '/doctor/support', icon: 'H', exact: true }
    ]
  };

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.currentRole = this.resolveCurrentRole();
    this.collapsed = LayoutSidebarComponent.collapsedState;
    this.applySidebarWidth();
    this.motionAllowed = this.isMotionAllowed();
  }

  ngAfterViewInit(): void {
    this.createBubbles();
    this.observeSidebarSize();

    if (this.motionAllowed) {
      this.startBubbleAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  get displayMenuItems(): SidebarItem[] {
    return this.menuItems?.length ? this.menuItems : this.defaultMenuItems[this.currentRole];
  }

  get portalTitle(): string {
    if (this.brandName && this.brandName !== 'MedVerse') {
      return this.brandName;
    }

    return this.currentRole === 'DOCTOR' ? 'Doctor Portal' : 'Patient Portal';
  }

  get portalSubtitle(): string {
    return this.currentRole === 'DOCTOR'
      ? 'Clinical workspace'
      : 'Health workspace';
  }

  get roleBadge(): string {
    return this.currentRole === 'DOCTOR' ? 'Doctor' : 'Patient';
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    LayoutSidebarComponent.collapsedState = this.collapsed;
    this.applySidebarWidth();

    requestAnimationFrame(() => {
      this.keepBubblesInsideSidebar();
    });
  }

  onLogout(): void {
    this.logoutClicked.emit();
  }

  trackByRoute(_: number, item: SidebarItem): string {
    return item.route;
  }

  trackByBubble(_: number, bubble: SidebarBubble): number {
    return bubble.id;
  }

  bubbleTransform(bubble: SidebarBubble): string {
    return `translate3d(${bubble.x}px, ${bubble.y}px, 0)`;
  }

  displayBubbleSize(bubble: SidebarBubble): number {
    return this.collapsed ? Math.min(bubble.size, 36) : bubble.size;
  }

  getIconSymbol(item: SidebarItem): string {
    const label = item.label.toLowerCase();

    if (label.includes('dashboard')) {
      return '⌂';
    }

    if (label.includes('profile')) {
      return '◉';
    }

    if (label.includes('emergency')) {
      return '+';
    }

    if (label.includes('record')) {
      return '▣';
    }

    if (label.includes('request') || label.includes('notification')) {
      return '●';
    }

    if (label.includes('care')) {
      return '✚';
    }

    if (label.includes('support') || label.includes('help')) {
      return '?';
    }

    return item.icon || '•';
  }

  private createBubbles(): void {
    const bounds = this.getSidebarBounds();
    const width = Math.max(bounds.width, 82);
    const height = Math.max(bounds.height, 640);

    const configs = [
      { size: 68, x: 18, y: 94, vx: 15, vy: 18, opacity: 0.22 },
      { size: 42, x: width - 70, y: 170, vx: -18, vy: 14, opacity: 0.18 },
      { size: 92, x: 24, y: height - 180, vx: 11, vy: -16, opacity: 0.16 },
      { size: 30, x: width - 58, y: height - 260, vx: -13, vy: -12, opacity: 0.20 },
      { size: 54, x: Math.max(width / 2 - 25, 12), y: height - 92, vx: 12, vy: -14, opacity: 0.17 }
    ];

    this.bubbles = configs.map((bubble, index) => ({
      id: index + 1,
      size: bubble.size,
      x: Math.min(Math.max(bubble.x, 8), Math.max(width - bubble.size - 8, 8)),
      y: Math.min(Math.max(bubble.y, 8), Math.max(height - bubble.size - 8, 8)),
      vx: bubble.vx,
      vy: bubble.vy,
      opacity: bubble.opacity
    }));
  }

  private startBubbleAnimation(): void {
    const animate = (timestamp: number) => {
      if (!this.lastAnimationTime) {
        this.lastAnimationTime = timestamp;
      }

      const deltaSeconds = Math.min((timestamp - this.lastAnimationTime) / 1000, 0.05);
      this.lastAnimationTime = timestamp;

      this.moveBubbles(deltaSeconds);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private moveBubbles(deltaSeconds: number): void {
    const bounds = this.getSidebarBounds();
    const maxWidth = Math.max(bounds.width, 82);
    const maxHeight = Math.max(bounds.height, 480);
    const padding = this.collapsed ? 9 : 11;

    this.bubbles = this.bubbles.map(bubble => {
      let nextX = bubble.x + bubble.vx * deltaSeconds;
      let nextY = bubble.y + bubble.vy * deltaSeconds;
      let nextVx = bubble.vx;
      let nextVy = bubble.vy;

      const minX = padding;
      const minY = padding;
      const displaySize = this.displayBubbleSize(bubble);
      const maxX = Math.max(maxWidth - displaySize - padding, minX);
      const maxY = Math.max(maxHeight - displaySize - padding, minY);

      if (nextX <= minX || nextX >= maxX) {
        nextVx = -nextVx;
        nextX = Math.min(Math.max(nextX, minX), maxX);
      }

      if (nextY <= minY || nextY >= maxY) {
        nextVy = -nextVy;
        nextY = Math.min(Math.max(nextY, minY), maxY);
      }

      return {
        ...bubble,
        x: nextX,
        y: nextY,
        vx: nextVx,
        vy: nextVy
      };
    });
  }

  private keepBubblesInsideSidebar(): void {
    const bounds = this.getSidebarBounds();
    const maxWidth = Math.max(bounds.width, 82);
    const maxHeight = Math.max(bounds.height, 480);
    const padding = this.collapsed ? 9 : 11;

    this.bubbles = this.bubbles.map(bubble => ({
      ...bubble,
      x: Math.min(Math.max(bubble.x, padding), Math.max(maxWidth - this.displayBubbleSize(bubble) - padding, padding)),
      y: Math.min(Math.max(bubble.y, padding), Math.max(maxHeight - this.displayBubbleSize(bubble) - padding, padding))
    }));
  }

  private observeSidebarSize(): void {
    const sidebar = this.elementRef.nativeElement.querySelector('.sidebar');

    if (!sidebar || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.keepBubblesInsideSidebar();
    });

    this.resizeObserver.observe(sidebar);
  }

  private getSidebarBounds(): { width: number; height: number } {
    const sidebar = this.elementRef.nativeElement.querySelector('.sidebar') as HTMLElement | null;

    if (!sidebar) {
      return { width: this.collapsed ? 82 : 264, height: 720 };
    }

    return {
      width: sidebar.clientWidth || (this.collapsed ? 82 : 264),
      height: sidebar.clientHeight || window.innerHeight || 720
    };
  }

  private isMotionAllowed(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return true;
    }

    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private applySidebarWidth(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.style.setProperty(
      '--sidebar-w',
      this.collapsed ? '82px' : '264px'
    );
  }

  private resolveCurrentRole(): PortalRole {
    const storedRole = this.getStoredRole();

    if (storedRole === 'DOCTOR') {
      return 'DOCTOR';
    }

    if (storedRole === 'PATIENT') {
      return 'PATIENT';
    }

    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();

      if (path.includes('/doctor')) {
        return 'DOCTOR';
      }
    }

    return 'PATIENT';
  }

  private getStoredRole(): string {
    const storages: Storage[] = [];

    if (typeof localStorage !== 'undefined') {
      storages.push(localStorage);
    }

    if (typeof sessionStorage !== 'undefined') {
      storages.push(sessionStorage);
    }

    for (const storage of storages) {
      for (const key of ['medverseCurrentUser', 'currentUser']) {
        const rawUser = storage.getItem(key);

        if (!rawUser) {
          continue;
        }

        try {
          const user = JSON.parse(rawUser);
          const role = user?.role ||
            user?.data?.role ||
            user?.user?.role ||
            user?.roleName ||
            user?.data?.roleName ||
            user?.user?.roleName ||
            '';

          return String(role).replace(/[_\s-]/g, '').toUpperCase();
        } catch {
          continue;
        }
      }
    }

    return '';
  }
}