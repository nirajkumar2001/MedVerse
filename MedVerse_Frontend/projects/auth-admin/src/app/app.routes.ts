import { Routes } from '@angular/router';
import { authGuard, ChangePasswordComponent, DeviceLimitReachedComponent, ForgotPasswordComponent, HomeComponent, InternalServerComponent, LoginComponent, NotFoundComponent, OtpVerificationComponent, ProfileRejectedComponent, ResetPasswordComponent, SignupComponent } from '../../../shared-auth/src/public-api';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
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
    path: 'profile-rejected',
    component: ProfileRejectedComponent
  },
  {
    path: 'internal-server',
    component: InternalServerComponent
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
    path: 'admin/dashboard',
    loadComponent: () => import('./admin/pages/admin-dashboard/admin-dashboard.component').then(component => component.AdminDashboardComponent),
    canActivate: [authGuard],
    data: { roleTitle: 'Admin Dashboard', roles: ['ADMIN'] }
  },
  {
    path: 'admin/profiles',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./admin/pages/profiles/profiles.component')
        .then(m => m.ProfilesComponent)
  },
  {
    path: 'admin/profile-details',
    redirectTo: 'admin/profiles',
    pathMatch: 'full'
  },
  {
    path: 'admin/profile-details/:userId',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./admin/pages/profile-details/profile-details.component')
        .then(m => m.ProfileDetailsComponent)
  },
  {
    path: 'admin/alerts',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./admin/pages/alerts/alerts.component')
        .then(m => m.AlertsComponent)
  },
   {
    path: 'admin/reports',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./admin/pages/reports/reports.component')
        .then(m => m.ReportsComponent)
  },
  {
    path: 'admin/approved-users',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./admin/pages/reports/reports.component')
        .then(m => m.ReportsComponent)
  },
  {
    path: 'admin/rejected-users',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./admin/pages/reports/reports.component')
        .then(m => m.ReportsComponent)
  },
  {
    path: '**',
    component: NotFoundComponent
  }

];
