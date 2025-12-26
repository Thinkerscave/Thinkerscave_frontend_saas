import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-lead',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './add-lead.component.html',
  styleUrl: './add-lead.component.scss'
})
export class AddLeadComponent {
  constructor(private router: Router) { }

  /**
   * Navigate back to manage leads page
   */
  goBack(): void {
    this.router.navigate(['/app/manage-leads']);
  }
}
