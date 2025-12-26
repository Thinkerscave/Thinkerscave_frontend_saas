import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-follow-up-tracker',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './follow-up-tracker.component.html',
  styleUrl: './follow-up-tracker.component.scss'
})
export class FollowUpTrackerComponent {
  constructor(private router: Router) { }

  /**
   * Navigate back to counsellor dashboard
   */
  goBack(): void {
    this.router.navigate(['/app/counsellor-dashboard']);
  }
}
