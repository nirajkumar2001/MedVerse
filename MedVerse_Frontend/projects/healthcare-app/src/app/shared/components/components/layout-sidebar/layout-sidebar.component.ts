import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SidebarItem } from '../../../core/models/sidebar-item.model';

@Component({
  selector: 'app-layout-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout-sidebar.component.html',
  styleUrl: './layout-sidebar.component.css'
})
export class LayoutSidebarComponent implements OnInit {
  @Input() brandName = 'MedVerse';
  @Input() menuItems: SidebarItem[] = [];

  @Output() logoutClicked = new EventEmitter<void>();

  collapsed = false;

  private static collapsedState = false;

  ngOnInit(): void {
    this.collapsed = LayoutSidebarComponent.collapsedState;
    this.applySidebarWidth();
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    LayoutSidebarComponent.collapsedState = this.collapsed;
    this.applySidebarWidth();
  }

  onLogout(): void {
    this.logoutClicked.emit();
  }

  private applySidebarWidth(): void {
    document.documentElement.style.setProperty('--sidebar-w', this.collapsed ? '80px' : '248px');
  }
}
