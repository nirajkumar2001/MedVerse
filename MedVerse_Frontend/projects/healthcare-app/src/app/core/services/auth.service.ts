import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { SharedAuthService } from '../../../../../shared-auth/src/public-api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = false;

  constructor(
    private router: Router,
    private sharedAuthService: SharedAuthService
  ) {}

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  logout(): void {
    this.loggedIn = false;
    this.sharedAuthService.logout().pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.sharedAuthService.clearClientSession();
      this.router.navigate(['/login']);
    });
  }
}
