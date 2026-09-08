import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { BackButtonComponent } from '../back-button/back-button.component';

type HeaderTheme = 'light' | 'dark' | 'patient';
type HeaderRole = 'DOCTOR' | 'PATIENT';

interface HealthcareQuote {
  text: string;
  author: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, BackButtonComponent],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent implements OnInit, OnDestroy {
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

  @Input() theme: HeaderTheme = 'light';

  @Input() headerVideoSrc = '';
  @Input() immersiveVideo = false;
  @Input() coverVideo = false;
  @Input() cornerTitleBadge = false;
  @Input() showBeatLine = true;

  greeting = 'Good Morning';
  currentQuoteIndex = 0;
  quoteChanging = false;
  imageFailed = false;

  private greetingTimer: ReturnType<typeof setInterval> | null = null;
  private quoteTimer: ReturnType<typeof setInterval> | null = null;

  readonly healthcareQuotes: HealthcareQuote[] = [
    {
      text: 'Every patient deserves secure, connected, and compassionate healthcare.',
      author: 'MedVerse Care Network'
    },
    {
      text: 'Fast access to trusted medical information can support better clinical decisions.',
      author: 'Digital Healthcare'
    },
    {
      text: 'Healthcare becomes stronger when patients and doctors stay connected.',
      author: 'MedVerse'
    },
    {
      text: 'Good care begins with accurate records, clear consent, and secure access.',
      author: 'Healthcare Trust'
    },
    {
      text: 'Technology should simplify healthcare while keeping human care at the center.',
      author: 'MedVerse Platform'
    },
    {
      text: 'Emergency care needs speed, clarity, and responsible access to patient information.',
      author: 'Emergency Health Access'
    },
    {
      text: 'A secure health platform protects both the patient journey and the doctor workflow.',
      author: 'MedVerse Security'
    },
    {
      text: 'The right information at the right time can make care safer and faster.',
      author: 'Clinical Care'
    },
    {
      text: 'Healthcare innovation matters most when it improves trust, access, and outcomes.',
      author: 'Digital Health'
    },
    {
      text: 'Patient consent and doctor access should work together, not against each other.',
      author: 'MedVerse Access'
    },
    {
      text: 'Better records create better continuity of care.',
      author: 'Medical Records'
    },
    {
      text: 'Secure systems allow healthcare teams to focus more on healing.',
      author: 'Healthcare Technology'
    },
    {
      text: 'A connected healthcare universe helps care move without friction.',
      author: 'MedVerse'
    },
    {
      text: 'Doctors heal better when critical patient details are available with trust.',
      author: 'Clinical Workspace'
    },
    {
      text: 'Patients feel safer when their medical information is protected and accessible.',
      author: 'Patient Care'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateGreeting();

    this.greetingTimer = setInterval(() => {
      this.updateGreeting();
    }, 60000);

    this.quoteTimer = setInterval(() => {
      this.rotateQuote();
    }, 6500);
  }

  ngOnDestroy(): void {
    if (this.greetingTimer) {
      clearInterval(this.greetingTimer);
    }

    if (this.quoteTimer) {
      clearInterval(this.quoteTimer);
    }
  }

  get role(): HeaderRole {
    const currentPath = typeof window !== 'undefined'
      ? window.location.pathname.toLowerCase()
      : '';

    const rootRoute = this.breadcrumbRootRoute?.toLowerCase() || '';
    const notifyRoute = this.notificationRoute?.toLowerCase() || '';
    const rootText = this.breadcrumbRoot?.toLowerCase() || '';

    /*
      Patient routes must get first priority.
      This prevents patient pages from showing the Dr. prefix even when
      older stored localStorage/sessionStorage values contain a doctor role.
    */
    if (
      currentPath.includes('/patient') ||
      rootRoute.includes('/patient') ||
      notifyRoute.includes('/patient') ||
      rootText.includes('patient')
    ) {
      return 'PATIENT';
    }

    if (
      currentPath.includes('/doctor') ||
      rootRoute.includes('/doctor') ||
      notifyRoute.includes('/doctor') ||
      rootText.includes('doctor')
    ) {
      return 'DOCTOR';
    }

    return 'PATIENT';
  }

  get isDoctor(): boolean {
    return this.role === 'DOCTOR';
  }

  get shouldShowBackButton(): boolean {
    if (!this.showBackButton) {
      return false;
    }

    const currentPath = typeof window !== 'undefined'
      ? window.location.pathname.toLowerCase()
      : '';

    const dashboardPaths = [
      '/doctor/home',
      '/patient/home',
      '/doctor/dashboard',
      '/patient/dashboard'
    ];

    return !dashboardPaths.some(path => currentPath.endsWith(path));
  }

  get displayName(): string {
    const rawName =
      this.titleEmphasis ||
      this.getStoredUserName() ||
      this.getReadableAvatarText() ||
      (this.isDoctor ? 'Doctor' : 'Patient');

    const cleanName = String(rawName || '').trim();

    if (!cleanName) {
      return this.isDoctor ? 'Doctor' : 'Patient';
    }

    /*
      Patient must never display Dr.
      If an old value already contains Dr., remove it for patient workspace.
    */
    if (!this.isDoctor) {
      return cleanName.replace(/^dr\.?\s+/i, '');
    }

    if (cleanName.toLowerCase().startsWith('dr.')) {
      return cleanName;
    }

    return `Dr. ${cleanName}`;
  }

  get headline(): string {
    return `${this.greeting}, ${this.displayName}`;
  }

  get pageContextTitle(): string {
    if (this.title && !this.titleEmphasis && !this.titlePrefix) {
      return this.title;
    }

    if (this.breadcrumbCurrent) {
      return this.breadcrumbCurrent;
    }

    return this.isDoctor ? 'Doctor Workspace' : 'Patient Workspace';
  }

  get workspaceLabel(): string {
    return this.isDoctor ? 'Doctor Workspace' : 'Patient Workspace';
  }

  get profileRoute(): string {
    return this.isDoctor ? '/doctor/profile' : '/patient/profile';
  }

  get notificationTarget(): string {
    if (this.notificationRoute) {
      return this.notificationRoute;
    }

    return this.isDoctor ? '/doctor/notifications' : '/patient/notifications';
  }

  get currentQuote(): HealthcareQuote {
    return this.healthcareQuotes[this.currentQuoteIndex];
  }

  get displayBadgeText(): string {
    return this.badgeText || this.getStoredUserId() || (this.isDoctor ? 'Doctor ID' : 'Patient ID');
  }

  get idLabel(): string {
    const text = this.displayBadgeText.toLowerCase();

    if (text.includes('doctor')) {
      return 'Doctor ID';
    }

    if (text.includes('patient')) {
      return 'Patient ID';
    }

    if (text.includes('id')) {
      return this.isDoctor ? 'Doctor ID' : 'Patient ID';
    }

    return this.isDoctor ? 'Doctor ID' : 'Patient ID';
  }

  get displayAvatarImage(): string {
    if (this.imageFailed) {
      return '';
    }

    return this.avatarImage || this.getStoredProfileImage() || '';
  }

  get displayAvatarText(): string {
    const text = this.avatarText || this.displayName || 'U';
    const cleanText = text.replace(/^dr\.?/i, '').trim();

    if (!cleanText) {
      return this.isDoctor ? 'DR' : 'PT';
    }

    const parts = cleanText.split(/\s+/);

    return parts
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  goBack(): void {
    this.router.navigateByUrl(this.breadcrumbRootRoute || this.profileRoute);
  }

  goToProfile(): void {
    this.router.navigateByUrl(this.profileRoute);
  }

  onAvatarImageError(): void {
    this.imageFailed = true;
  }

  private updateGreeting(): void {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      this.greeting = 'Good Morning';
      return;
    }

    if (hour >= 12 && hour < 17) {
      this.greeting = 'Good Afternoon';
      return;
    }

    this.greeting = 'Good Evening';
  }

  private rotateQuote(): void {
    this.quoteChanging = true;

    setTimeout(() => {
      this.currentQuoteIndex =
        (this.currentQuoteIndex + 1) % this.healthcareQuotes.length;

      this.quoteChanging = false;
    }, 220);
  }

  private getReadableAvatarText(): string {
    const value = this.avatarText?.trim();

    if (!value || value.length <= 2) {
      return '';
    }

    return value;
  }

  private getStoredProfileImage(): string {
    const doctorPhoto = this.safeGetLocalStorage('medverse-doctor-profile-photo');
    const patientPhoto = this.safeGetLocalStorage('medverse-patient-profile-photo');

    if (this.isDoctor && doctorPhoto) {
      return doctorPhoto;
    }

    if (!this.isDoctor && patientPhoto) {
      return patientPhoto;
    }

    const user = this.getStoredUser();

    return (
      user?.photoUrl ||
      user?.profileImage ||
      user?.profilePicture ||
      user?.avatar ||
      user?.image ||
      user?.data?.photoUrl ||
      user?.data?.profileImage ||
      user?.data?.profilePicture ||
      ''
    );
  }

  private getStoredUserName(): string {
    const user = this.getStoredUser();

    return (
      user?.fullName ||
      user?.name ||
      user?.patientName ||
      user?.doctorName ||
      user?.username ||
      user?.data?.fullName ||
      user?.data?.name ||
      user?.data?.patientName ||
      user?.data?.doctorName ||
      ''
    );
  }

  private getStoredUserId(): string {
    const user = this.getStoredUser();

    const id =
      user?.doctorId ||
      user?.patientId ||
      user?.employeeId ||
      user?.userId ||
      user?.id ||
      user?.data?.doctorId ||
      user?.data?.patientId ||
      user?.data?.employeeId ||
      user?.data?.userId ||
      user?.data?.id ||
      '';

    if (!id) {
      return '';
    }

    return String(id).startsWith('ID:') ? String(id) : `ID: ${id}`;
  }

  private getStoredUser(): any {
    const keys = ['medverseCurrentUser', 'currentUser', 'user'];

    for (const key of keys) {
      const raw =
        this.safeGetLocalStorage(key) ||
        this.safeGetSessionStorage(key);

      if (!raw) {
        continue;
      }

      try {
        return JSON.parse(raw);
      } catch {
        continue;
      }
    }

    return {};
  }

  private safeGetLocalStorage(key: string): string {
    if (typeof localStorage === 'undefined') {
      return '';
    }

    return localStorage.getItem(key) || '';
  }

  private safeGetSessionStorage(key: string): string {
    if (typeof sessionStorage === 'undefined') {
      return '';
    }

    return sessionStorage.getItem(key) || '';
  }
}