import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface LearningCard {
  title: string;
  description: string;
  icon: string;
  color: string;
}
@Component({
  selector: 'app-dashboard-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-footer.component.html',
  styleUrl: './dashboard-footer.component.css'
})
export class DashboardFooterComponent {

  resources: LearningCard[] = [
  {
    title: 'Why Share Your Case?',
    description: 'Help peers learn from real clinical experiences',
    icon: '✳',
    color: 'purple'
  },
  {
    title: 'Advance Medical Knowledge',
    description: 'Contribute to collective learning',
    icon: '⭐',
    color: 'cyan'
  },
  {
    title: 'Improve Patient Care',
    description: 'Real cases lead to better outcomes',
    icon: '🩺',
    color: 'green'
  },
  {
    title: 'Build Your Profile',
    description: 'Gain recognition in the community',
    icon: '👤',
    color: 'orange'
  }
];

}