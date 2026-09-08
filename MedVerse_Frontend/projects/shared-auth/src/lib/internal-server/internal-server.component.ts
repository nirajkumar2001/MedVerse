import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'lib-internal-server',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './internal-server.component.html',
  styleUrl: './internal-server.component.css'
})
export class InternalServerComponent {
  errorCode = '500';
  errorMessage = 'Internal Server Error';
  description = 'Something went wrong on the server. Please try again later.';
  illustration = 'shared-assets/auth-pages/internal-server-illustration.png';
}
