import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface LearnerSupportFaq {
  category: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-learner-support',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class SupportComponent {
  readonly faqs: LearnerSupportFaq[] = [
    {
      category: 'Case Submission',
      question: 'Why is my case still pending approval?',
      answer: 'Submitted cases are reviewed by an authentication officer for medical quality and policy checks. Pending status remains until review is complete.'
    },
    {
      category: 'Rejected Cases',
      question: 'Where can I see why a case was rejected?',
      answer: 'Open your submissions and view the case details. Rejected cases include remarks so you can update and resubmit with corrections.'
    },
    {
      category: 'Published Cases',
      question: 'When does a case appear in Explore Cases?',
      answer: 'A case appears in Explore Cases after it is approved and published by the authentication officer workflow.'
    },
    {
      category: 'Bookmarks',
      question: 'How do I save a case for later reading?',
      answer: 'Use the bookmark icon on case cards. Saved cases appear in your Saved Cases section and can be removed anytime.'
    },
    {
      category: 'Account Security',
      question: 'How can I keep my account secure?',
      answer: 'Use Change Password regularly, avoid sharing credentials, and log out from shared devices after every session.'
    }
  ];
}
