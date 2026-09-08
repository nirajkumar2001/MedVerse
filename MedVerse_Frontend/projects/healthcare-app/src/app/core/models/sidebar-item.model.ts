export interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  badgeCount?: number;
  exact?: boolean;
}