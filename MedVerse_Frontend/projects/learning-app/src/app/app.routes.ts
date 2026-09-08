import { Routes } from '@angular/router';
import {LearnerDashboardComponent } from './learner/component/dashboard/learner-dashboard/learner-dashboard.component'
import { HeroComponent } from './learner/component/dashboard/learner-dashboard/hero/hero.component';
import { DashboardDataComponent } from './learner/component/dashboard/learner-dashboard/dashboard-data/dashboard-data.component';
import { SubmissionsComponent } from './learner/component/submissions/submissions.component';
import { ProfileComponent } from './learner/component/profile/profile.component';
import { BookmarkCasesComponent } from './learner/component/bookmark-cases/bookmark-cases.component';
import { CaseDetailsComponent } from './learner/component/case-details/case-details.component';
import { ExploreCasesComponent } from './learner/component/explore-cases/explore-cases.component';
// import { SubmitCaseComponent } from './learner/component/submit-case/submit-case.component';
// import { EditCaseComponent } from './learner/component/edit-case/edit-case.component';
import { NotificationsComponent } from './learner/component/notifications/notifications.component';
import { SubmitNewCaseComponent } from './learner/component/submit-new-case/submit-new-case.component';
import { EditSubmitCasesComponent } from './learner/component/edit-submit-case/edit-submit-case.component';
import { SupportComponent as LearnerSupportComponent } from './learner/component/support/support.component';
import { SupportComponent as AuthOfficerSupportComponent } from './authofficer/component/pages/support/support.component';
import { AuthOfficerDashboardComponent } from './authofficer/component/pages/auth-officer-dashboard/auth-officer-dashboard.component';
import { VerificationQueueComponent } from './authofficer/component/pages/verification-queue/verification-queue.component';
import { ApprovedCasesComponent } from './authofficer/component/pages/approved-cases/approved-cases.component';
import { RejectedCasesComponent } from './authofficer/component/pages/rejected-cases/rejected-cases.component';
import { AllCasesComponent } from './authofficer/component/pages/all-cases/all-cases.component';
import { ProfileComponent as AuthOfficerProfileComponent } from './authofficer/component/pages/profile/profile.component';
import { CaseDetailsComponent as AuthOfficerCaseDetailsComponent } from './authofficer/component/pages/case-details/case-details.component';
import { authGuard, ChangePasswordComponent, DeviceLimitReachedComponent, ForgotPasswordComponent, LoginComponent, OtpVerificationComponent, ResetPasswordComponent, SignupComponent } from '../../../shared-auth/src/public-api';
export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'otp-verification',
    component: OtpVerificationComponent
  },
  {
    path: 'device-limit-reached',
    component: DeviceLimitReachedComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent
  },
  {
    path: '',
    redirectTo: 'learner/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'learner/dashboard',
    component: LearnerDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['LEARNER'] }
  },
  {
    path: 'learner/submissions',
    component: SubmissionsComponent,
    canActivate: [authGuard],
    data: { roles: ['LEARNER'] }
  },
  {
    path: 'learner/profile',
    component: ProfileComponent,
    canActivate: [authGuard],
    data: { roles: ['LEARNER'] }
  },
  {
    path: 'learner/bookmarks',
    component: BookmarkCasesComponent,
    canActivate: [authGuard],
    data: { roles: ['LEARNER'] }
  },
  {
    path: 'learner/case-details/:id',
    component: CaseDetailsComponent,
    canActivate: [authGuard],
    data: { roles: ['LEARNER'] }
  },
  {
    path: 'learner/explore-cases',
    component: ExploreCasesComponent,
    canActivate: [authGuard],
    data: { roles: ['LEARNER'] }
  },
  {
    path: 'learner/submit-new-case',
    component: SubmitNewCaseComponent,
    canActivate: [authGuard],
    data: { roles: ['LEARNER'] }
  },
  {
    path: 'learner/edit-submit-cases/:id',
    component: EditSubmitCasesComponent,
    canActivate: [authGuard],
    data: { roles: ['LEARNER'] }
  },
  {
    path: 'learner/notifications',
    component: NotificationsComponent,
    canActivate: [authGuard],
    data: { roles: ['LEARNER'] }
  },
  {
    path: 'learner/support',
    component: LearnerSupportComponent,
    canActivate: [authGuard],
    data: { roles: ['LEARNER'] }
  },
  {
    path: 'authofficer',
    redirectTo: 'authofficer/auth-officer-dashboard',
    pathMatch: 'full'
  },
  {
    path: 'authofficer/auth-officer-dashboard',
    component: AuthOfficerDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['AUTHOFFICER'] }
  },
  {
    path: 'authofficer/verification-queue',
    component: VerificationQueueComponent,
    canActivate: [authGuard],
    data: { roles: ['AUTHOFFICER'] }
  },
  {
    path: 'authofficer/approved-cases',
    component: ApprovedCasesComponent,
    canActivate: [authGuard],
    data: { roles: ['AUTHOFFICER'] }
  },
  {
    path: 'authofficer/rejected-cases',
    component: RejectedCasesComponent,
    canActivate: [authGuard],
    data: { roles: ['AUTHOFFICER'] }
  },
  {
    path: 'authofficer/all-cases',
    component: AllCasesComponent,
    canActivate: [authGuard],
    data: { roles: ['AUTHOFFICER'] }
  },
  {
    path: 'authofficer/profile',
    component: AuthOfficerProfileComponent,
    canActivate: [authGuard],
    data: { roles: ['AUTHOFFICER'] }
  },
  {
    path: 'authofficer/support',
    component: AuthOfficerSupportComponent,
    canActivate: [authGuard],
    data: { roles: ['AUTHOFFICER'] }
  },
  {
    path: 'authofficer/case-details/:caseId',
    component: AuthOfficerCaseDetailsComponent,
    canActivate: [authGuard],
    data: { roles: ['AUTHOFFICER'] }
  },
  
  // {
  //   path: '',
  //   component: HeroComponent
  // }
  // {
  //   path: '',
  //   component: DashboardDataComponent
  // }

];

    
