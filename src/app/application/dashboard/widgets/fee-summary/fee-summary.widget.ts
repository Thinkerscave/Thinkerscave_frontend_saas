import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FeeSummaryData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-fee-summary-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-summary-highlight">
      <span>Pending amount</span>
      <strong>{{ data.pendingAmount | currency:(data.currency || 'INR'):'symbol':'1.0-0' }}</strong>
    </div>
    <div class="w-summary-rows">
      <div class="w-summary-row">
        <span>Total due</span>
        <strong>{{ data.totalDue | currency:(data.currency || 'INR'):'symbol':'1.0-0' }}</strong>
      </div>
      <div class="w-summary-row">
        <span>Total paid</span>
        <strong>{{ data.totalPaid | currency:(data.currency || 'INR'):'symbol':'1.0-0' }}</strong>
      </div>
      <div class="w-summary-row" *ngIf="data.nextDueDate">
        <span>Next due date</span>
        <strong>{{ data.nextDueDate | date:'MMM d, y' }}</strong>
      </div>
      <div class="w-summary-row" *ngIf="data.pendingInvoices">
        <span>Pending invoices</span>
        <strong>{{ data.pendingInvoices }}</strong>
      </div>
    </div>
  `
})
export class FeeSummaryWidgetComponent {
  @Input({ required: true }) data!: FeeSummaryData;
}
