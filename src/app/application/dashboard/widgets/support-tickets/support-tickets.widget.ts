import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SupportTicketsData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-support-tickets-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-list">
      <div class="w-list__row" *ngFor="let ticket of data?.items || []">
        <span class="w-list__icon"><i class="pi pi-ticket"></i></span>
        <div class="w-list__main">
          <p class="w-list__title">{{ ticket.subject }}</p>
          <p class="w-list__meta">
            <span class="w-tag" [attr.data-tone]="priorityTone(ticket.priority)" *ngIf="ticket.priority">{{ ticket.priority }}</span>
            <span *ngIf="ticket.raisedAgo">{{ ticket.raisedAgo }}</span>
          </p>
        </div>
        <span class="w-tag" [attr.data-tone]="statusTone(ticket.status)" *ngIf="ticket.status">{{ ticket.status }}</span>
      </div>
    </div>
  `
})
export class SupportTicketsWidgetComponent {
  @Input({ required: true }) data!: SupportTicketsData;

  priorityTone(priority?: string): string {
    const p = (priority || '').toLowerCase();
    if (p === 'high') return 'danger';
    if (p === 'medium') return 'warning';
    return 'neutral';
  }

  statusTone(status?: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('open')) return 'info';
    if (s.includes('progress')) return 'warning';
    if (s.includes('resolved') || s.includes('closed')) return 'success';
    return 'neutral';
  }
}
