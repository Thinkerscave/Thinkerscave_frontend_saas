import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LibrarySummaryData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-library-summary-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-summary-rows">
      <div class="w-summary-row">
        <span><i class="pi pi-book"></i> Books issued</span>
        <strong>{{ data.booksIssued }}</strong>
      </div>
      <div class="w-summary-row">
        <span><i class="pi pi-exclamation-circle"></i> Overdue</span>
        <strong [style.color]="data.booksOverdue ? 'var(--saas-danger)' : null">{{ data.booksOverdue }}</strong>
      </div>
      <div class="w-summary-row" *ngIf="data.fineDue">
        <span><i class="pi pi-wallet"></i> Fine due</span>
        <strong>{{ data.fineDue | currency:'INR':'symbol':'1.0-0' }}</strong>
      </div>
    </div>
  `
})
export class LibrarySummaryWidgetComponent {
  @Input({ required: true }) data!: LibrarySummaryData;
}
