import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { BackendRole, SharedAuthService } from '../shared-auth.service';
import { RoleRedirectService } from '../role-redirect.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(SharedAuthService);
  const router = inject(Router);
  const roleRedirect = inject(RoleRedirectService);
  const allowedRoles = (route.data?.['roles'] as string[] | undefined)?.map(normalizeRole);

  return authService.getCurrentSession().pipe(
    map(currentSession => {
      if (!currentSession) {
        authService.clearClientSession();
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      localStorage.setItem('medverseCurrentUser', JSON.stringify(currentSession));
      return authorizeSession(currentSession, allowedRoles, authService, roleRedirect, router);
    })
  );
};

function authorizeSession(
  session: any,
  allowedRoles: string[] | undefined,
  authService: SharedAuthService,
  roleRedirect: RoleRedirectService,
  router: Router
): boolean | ReturnType<Router['createUrlTree']> {
  const role = extractRole(session);
  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    roleRedirect.redirectToBackendRole(role);
    return false;
  }

  const authStatus = String(session.authStatus || session.data?.authStatus || session.user?.authStatus || '').toUpperCase();
  if (authStatus === 'PENDING' || authStatus === 'SUSPENDED') {
    authService.clearClientSession();
    return router.createUrlTree(['/login'], {
      queryParams: {
        accountStatus: authStatus,
        userId: session.userId || session.data?.userId || session.user?.userId
      }
    });
  }

  return true;
}

function extractRole(user: any): BackendRole {
  return normalizeRole(
    user?.role ??
    user?.data?.role ??
    user?.user?.role ??
    user?.roleName ??
    user?.data?.roleName ??
    user?.user?.roleName
  ) as BackendRole;
}

function normalizeRole(role: unknown): string {
  return String(role || '').replace(/[_\s-]/g, '').toUpperCase();
}
