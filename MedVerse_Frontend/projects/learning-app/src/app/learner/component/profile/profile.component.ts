import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LearnerProfile, LearnerProfileService, LearnerProfileStats } from '../services/learner-profile.service';
import { RouterModule } from '@angular/router';
import { SubmissionService } from '../services/submissions.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, Subscription, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { apiUrl } from '../../../../../../shared-services/src/lib/api-config';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
}


interface Activity {
  title: string;
  caseName: string;
  time: string;
  icon: string;
  color: string;
  isPlaceholder?: boolean;
}


@Component({
  selector: 'app-learner-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  notificationCount = 0;
  private latestSubmissionsPayload: any = null;
  private readonly readStorageKey = 'medverse_learner_read_notifications';
  readonly departmentOptions = [
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'pulmonology', label: 'Pulmonology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'gastroenterology', label: 'Gastroenterology' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'general', label: 'General Medicine' },
    { value: 'endocrinology', label: 'Endocrinology' },
    { value: 'nephrology', label: 'Nephrology' },
    { value: 'gynecology', label: 'Gynecology' },
    { value: 'psychiatry', label: 'Psychiatry' },
    { value: 'ent', label: 'ENT (Ear, Nose & Throat)' },
    { value: 'ophthalmology', label: 'Ophthalmology' },
    { value:  'general', label:'General'}
  ];
  learner: LearnerProfile = {
  name: '',
  role: 'Medical Student',
  learnerId: '',
  institution: '',
  department: '',
  email: '',
  memberSince: '',
  image: ''
};
getRoute(title: string): string {
  switch (title) {
    case 'Pending Approval':
      return '/learner/submissions';
    case 'Published Cases':
      return '/learner/submissions';
    case 'Rejected Cases':
      return '/learner/submissions';
    case 'Total Submissions':
      return '/learner/submissions';
    default:
      return '/learner/dashboard';
  }
}
isEditingProfile = false;
showPopup = false;

popupData = {
  title: '',
  message: '',
  type: 'success'
};

editableLearner: LearnerProfile = { ...this.learner };

constructor(
  private router: Router,
  private learnerProfileService: LearnerProfileService,
  private submissionService: SubmissionService,
  private http: HttpClient
) {}

private readonly subscriptions = new Subscription();

ngOnInit(): void {
  this.subscriptions.add(
    this.learnerProfileService.getProfile(this.learner).subscribe(profile => {
      this.learner = profile;
      this.editableLearner = { ...profile };
    })
  );

  this.subscriptions.add(
    this.learnerProfileService.getStats().subscribe(stats => {
      this.applyStats(stats);
    })
  );

  this.subscriptions.add(
    timer(0, 30000).pipe(
      switchMap(() => forkJoin({
        submissions: this.submissionService.getMySubmissions(0, 50).pipe(catchError(() => of(null))),
        bookmarks: this.http.get<any>(`${apiUrl('/learner')}/bookmarks?page=0&size=50`, { withCredentials: true }).pipe(catchError(() => of(null)))
      }))
    ).subscribe(({ submissions, bookmarks }) => {
      this.latestSubmissionsPayload = submissions;
      this.notificationCount = this.computeUnreadNotificationCount(submissions);
      this.activities = this.buildRecentActivities(submissions, bookmarks);
    })
  );

  window.addEventListener('storage', this.onStorageChange);
}

ngOnDestroy(): void {
  this.subscriptions.unsubscribe();
  window.removeEventListener('storage', this.onStorageChange);
}

editProfile(): void {
  this.editableLearner = { ...this.learner };
  this.isEditingProfile = true;
}

saveProfile(): void {
  const requestedProfile = { ...this.editableLearner };

  this.learnerProfileService.updateProfile(requestedProfile).subscribe(profile => {
    this.learner = profile;
    this.editableLearner = { ...profile };
    this.isEditingProfile = false;

    if (!this.didEditableFieldsPersist(requestedProfile, profile)) {
      this.showCustomPopup(
        'Profile Not Saved',
        'The save API responded, but the database did not return the updated learner profile fields.',
        'error'
      );
      return;
    }

    this.showCustomPopup(
      'Profile Updated',
      'Your profile information has been updated successfully.',
      'success'
    );
  }, error => {
    this.showCustomPopup(
      'Profile Not Saved',
      this.getApiErrorMessage(error) || 'The backend did not save your profile changes. Please check the learner profile API.',
      'error'
    );
  });
}

cancelEdit(): void {
  this.editableLearner = { ...this.learner };
  this.isEditingProfile = false;
}

onProfileImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    this.showCustomPopup('Photo Not Saved', 'Please upload an image file.', 'error');
    input.value = '';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    this.showCustomPopup('Photo Not Saved', 'Profile photo should be less than 2MB.', 'error');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  // reader.onload = () => {
  //   const image = String(reader.result || '');
  //   this.editableLearner = {
  //     ...this.learner,
  //     image
  //   };
  //   this.learnerProfileService.updateProfile(this.editableLearner).subscribe(profile => {
  //     this.learner = profile;
  //     this.editableLearner = { ...profile };

  //     this.learnerProfileService.uploadProfileImage(file, profile).subscribe(uploadedProfile => {
  //       this.learner = uploadedProfile;
  //       this.editableLearner = { ...uploadedProfile };

  //       if (!uploadedProfile.image) {
  //         alert('The image upload API completed, but the database did not return a saved profile image.');
  //       }
  //     }, () => {
  //       alert('The backend did not save your profile photo. Please check the learner profile image API.');
  //     });
  //   }, () => {
  //     alert('The backend did not accept the learner profile image update.');
  //   });
  // };
  reader.onload = () => {
    const image = String(reader.result || '');
    this.learner = {
      ...this.learner,
      image
    };
    this.editableLearner = { ...this.learner };

    this.learnerProfileService.uploadProfileImage(file, this.learner).subscribe(uploadedProfile => {
      this.learner = uploadedProfile;
      this.editableLearner = { ...uploadedProfile };

      if (!uploadedProfile.image) {
        this.showCustomPopup(
          'Photo Not Saved',
          'The image upload API completed, but the database did not return a saved profile image.',
          'error'
        );
        return;
      }

      this.showCustomPopup(
        'Profile Photo Updated',
        'Your profile photo has been saved in the database.',
        'success'
      );
    }, () => {
      this.showCustomPopup(
        'Photo Not Saved',
        'The backend did not save your profile photo. Please check the learner profile image API.',
        'error'
      );
    });
  };
  reader.onerror = () => {
    this.showCustomPopup(
      'Photo Not Saved',
      'Unable to read the selected image.',
      'error'
    );
  };
  reader.readAsDataURL(file);
}

showCustomPopup(title: string, message: string, type: string): void {
  this.popupData = { title, message, type };
  this.showPopup = true;
}

closePopup(): void {
  this.showPopup = false;
}

  stats: StatCard[] = [
    { title: 'Pending Approval', value: 0, icon: '⏱', color: 'orange' },
    { title: 'Published Cases', value: 0, icon: '✓', color: 'green' },
    { title: 'Rejected Cases', value: 0, icon: '✕', color: 'red' },
    { title: 'Total Submissions', value: 0, icon: '👁', color: 'purple' }
  ];


  activities: Activity[] = [];
  private readonly activityPreviewCount = 6;

  
  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

createCase(): void {
  this.router.navigate(['/learner/submit-new-case']);
}

openNotifications(): void {
  this.router.navigate(['/learner/notifications']);
}

openSupport(): void {
  this.router.navigate(['/learner/support']);
}

openChangePassword(): void {
  this.router.navigate(['/change-password']);
}

private didEditableFieldsPersist(requested: LearnerProfile, saved: LearnerProfile): boolean {
  return requested.institution === saved.institution &&
    // requested.department === saved.department;

    this.normalizeDepartment(requested.department) === this.normalizeDepartment(saved.department);
}

private getApiErrorMessage(error: any): string {
  const responseError = error?.error;

  if (typeof responseError === 'string') {
    return responseError;
  }

  return responseError?.message ||
    responseError?.data?.message ||
    responseError?.data?.error ||
    error?.message ||
    '';
}

departmentLabel(value: string): string {
  return this.departmentOptions.find(option => option.value === this.normalizeDepartment(value))?.label || value;
}

private normalizeDepartment(value: string): string {
  return String(value || '').trim().toLowerCase();
}

private applyStats(stats: LearnerProfileStats): void {
  this.stats = [
    { title: 'Pending Approval', value: stats.pendingSubmissions, icon: '⏱', color: 'orange' },
    { title: 'Published Cases', value: stats.approvedSubmissions, icon: '✓', color: 'green' },
    { title: 'Rejected Cases', value: stats.rejectedSubmissions, icon: '✕', color: 'red' },
    { title: 'Total Submissions', value: stats.submissionsCount, icon: '👁', color: 'purple' }
  ];
}

private buildRecentActivities(submissionsResponse: any, bookmarksResponse: any): Activity[] {
  const submissionPayload = submissionsResponse?.data ?? submissionsResponse;
  const submissions = Array.isArray(submissionPayload?.content) ? submissionPayload.content : [];

  const bookmarkPayload = bookmarksResponse?.data ?? bookmarksResponse;
  const bookmarks = Array.isArray(bookmarkPayload?.content) ? bookmarkPayload.content : [];

  const submissionActivities: Array<Activity & { sortTs: number }> = submissions.flatMap((item: any) => {
    const status = String(item?.approvalStatus || '').toUpperCase();
    const submittedAt = this.toTimestamp(item?.submittedDate);
    const title = String(item?.caseTitle || 'Untitled case');

    const events: Array<Activity & { sortTs: number }> = [];

    events.push({
      title: 'Your case was sent for auth officer review',
      caseName: title,
      time: this.toRelativeTime(item?.submittedDate),
      icon: '⏱',
      color: 'orange',
      sortTs: submittedAt
    });

    if (status === 'APPROVED' && !!item?.published) {
      events.push({
        title: 'Case published successfully',
        caseName: title,
        time: this.toRelativeTime(item?.submittedDate),
        icon: '✓',
        color: 'green',
        sortTs: submittedAt
      });
    }

    return events;
  });

  const bookmarkActivities: Array<Activity & { sortTs: number }> = bookmarks.map((item: any) => {
    const savedAt = this.toTimestamp(item?.savedAt || item?.savedOn);
    return {
      title: 'You saved a case',
      caseName: String(item?.title || 'Saved case'),
      time: this.toRelativeTime(item?.savedAt || item?.savedOn),
      icon: '🔖',
      color: 'purple',
      sortTs: savedAt
    };
  });

  const recentActivities = [...submissionActivities, ...bookmarkActivities]
    .sort((left, right) => right.sortTs - left.sortTs)
    .slice(0, this.activityPreviewCount)
    .map(({ sortTs, ...activity }) => activity);

  while (recentActivities.length < this.activityPreviewCount) {
    recentActivities.push({
      title: 'No recent activity yet',
      caseName: 'Create or review cases to populate your timeline.',
      time: '--',
      icon: '',
      color: 'blue',
      isPlaceholder: true
    });
  }

  return recentActivities;
}

private toTimestamp(value: string): number {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

private toRelativeTime(value: string): string {
  if (!value) {
    return 'Recently';
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  const diffMinutes = Math.floor((Date.now() - parsed) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

private readonly onStorageChange = (event: StorageEvent): void => {
  if (event.key !== this.readStorageKey) {
    return;
  }
  this.notificationCount = this.computeUnreadNotificationCount(this.latestSubmissionsPayload);
};

private computeUnreadNotificationCount(submissionsResponse: any): number {
  const submissionPayload = submissionsResponse?.data ?? submissionsResponse;
  const submissions = Array.isArray(submissionPayload?.content) ? submissionPayload.content : [];
  const readMap = this.getReadStateMap();
  const notifications = submissions.flatMap((item: any) => this.toNotificationIds(item));
  return notifications.filter((id: string) => !readMap[id]).length;
}

private toNotificationIds(item: any): string[] {
  const caseId = String(item?.caseId || '');
  const submittedDate = String(item?.submittedDate || '');
  const remarks = String(item?.remarks || '');
  const status = String(item?.approvalStatus || '').toUpperCase();
  const isPublished = !!item?.published;

  const baseId = `${caseId}|${submittedDate}|${status}|${isPublished}|${remarks}`;
  const ids: string[] = [`${baseId}|SUBMITTED`];

  if (status === 'APPROVED') {
    ids.push(`${baseId}|APPROVED`);
  }
  if (status === 'REJECTED') {
    ids.push(`${baseId}|REJECTED`);
  }
  if (isPublished) {
    ids.push(`${baseId}|PUBLISHED`);
  }
  return ids;
}

private getReadStateMap(): Record<string, boolean> {
  const raw = localStorage.getItem(this.readStorageKey);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}
}
