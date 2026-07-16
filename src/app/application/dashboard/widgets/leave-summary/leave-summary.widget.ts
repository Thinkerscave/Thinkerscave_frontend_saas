import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LeaveSummaryData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-leave-summary-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-summary-highlight">
      <span>Available balance</span>
      <strong>{{ data.availableDays }} days</strong>
    </div>
    <div class="w-summary-rows">
      <div class="w-summary-row">
        <span>Used this year</span>
        <strong>{{ data.usedDays }} days</strong>
      </div>
      <div class="w-summary-row">
        <span>Pending requests</span>
        <strong>{{ data.pendingRequests }}</strong>
      </div>
      <div class="w-summary-row" *ngIf="data.lastRequestStatus">
        <span>Last request</span>
        <span class="w-tag" [attr.data-tone]="toneFor(data.lastRequestStatus)">{{ data.lastRequestStatus }}</span>
      </div>
    </div>
  `
})
export class LeaveSummaryWidgetComponent {
  @Input({ required: true }) data!: LeaveSummaryData;

  toneFor(status: string): string {
    const s = status.toLowerCase();
    if (s.includes('approved')) return 'success';
    if (s.includes('rejected')) return 'danger';
    if (s.includes('pending')) return 'warning';
    return 'neutral';
  }
}
