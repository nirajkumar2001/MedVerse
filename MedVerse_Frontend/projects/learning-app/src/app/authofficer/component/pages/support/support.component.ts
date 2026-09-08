import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthOfficerFooterComponent } from '../../../footer/footer.component';

interface OfficerSupportFaq {
  category: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-authofficer-support',
  standalone: true,
  imports: [CommonModule, SidebarComponent, AuthOfficerFooterComponent],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class SupportComponent {
  isSidebarCollapsed = false;

  readonly faqs: OfficerSupportFaq[] = [
    {
      category: 'Verification Queue',
      question: 'How should I prioritize pending case verification?',
      answer: 'Prioritize by clinical risk, completeness of data, and oldest submission time to maintain timely and fair review.'
    },
    {
      category: 'Approval Rules',
      question: 'When should I reject a submitted case?',
      answer: 'Reject cases with missing core clinical facts, policy violations, or unclear patient context, and include actionable remarks.'
    },
    {
      category: 'Remarks',
      question: 'What makes good review remarks?',
      answer: 'Use concise, specific points that explain the issue and what should be corrected for successful resubmission.'
    },
    {
      category: 'Compliance',
      question: 'Why are my actions logged in the system?',
      answer: 'Audit trails provide accountability and quality control for authentication decisions across all published cases.'
    },
    {
      category: 'Security',
      question: 'What should I do if I suspect account misuse?',
      answer: 'Immediately change your password and report the incident to platform support for further access review.'
    }
  ];

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }
}
