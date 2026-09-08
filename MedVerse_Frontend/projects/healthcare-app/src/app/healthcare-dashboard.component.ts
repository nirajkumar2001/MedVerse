import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-healthcare-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="dashboard-page">
      <section>
        <a routerLink="/">MedAuth</a>
        <h1>Healthcare Dashboard</h1>
        <p>This healthcare workspace is connected to the shared login redirect and ready for patient or doctor flows.</p>
      </section>
    </main>
  `,
  styles: [`
    .dashboard-page {
      display: grid;
      min-height: 100vh;
      place-items: center;
      padding: 1rem;
      color: #071038;
      background: linear-gradient(135deg, #fbfcff, #f4f2ff);
      font-family: Inter, "Segoe UI", Arial, sans-serif;
    }

    section {
      width: min(100%, 34rem);
      padding: 2rem;
      background: #fff;
      border: 1px solid rgba(78, 65, 219, 0.12);
      border-radius: 0.75rem;
      box-shadow: 0 22px 70px rgba(70, 58, 169, 0.16);
    }

    a {
      color: #3c2ff0;
      font-weight: 800;
      text-decoration: none;
    }

    h1 {
      margin: 1rem 0 0.5rem;
      font-size: 2rem;
    }

    p {
      margin: 0;
      color: #46527d;
      line-height: 1.5;
    }
  `]
})
export class HealthcareDashboardComponent {}
