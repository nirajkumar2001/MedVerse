import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';




@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  constructor(private router: Router) {}

goToSubmitCase() {
  this.router.navigate(['/learner/submit-new-case']);
}

goToExploreCases() {
  this.router.navigate(['/learner/explore-cases']);
}
  
  @Input() learnerName = '';

}
