import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'lib-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent {
  errorCode = '404';
  errorMessage = 'Page Not Found';
  description = 'The page you are looking for might have been removed or does not exist.';
  illustration = 'shared-assets/auth-pages/not-found-illustration.png';
}
