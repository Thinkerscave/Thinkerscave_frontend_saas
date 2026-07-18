import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type AppStatusBadgeStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'ARCHIVED' | 'LEAD' | string;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="app-status-badge" [attr.data-status]="normalized">
      {{ displayLabel }}
    </span>
  `,
  styleUrl: './app-status-badge.component.scss'
})
export class AppStatusBadgeComponent {
  @Input({ required: true }) status!: AppStatusBadgeStatus;
  @Input() label = '';

  get normalized(): string {
    return String(this.status ?? '').toUpperCase();
  }

  get displayLabel(): string {
    if (this.label) return this.label;
    switch (this.normalized) {
      case 'ACTIVE': return 'Active';
      case 'TRIAL': return 'Trial';
      case 'SUSPENDED': return 'Suspended';
      case 'ARCHIVED': return 'Archived';
      case 'LEAD': return 'Lead';
      default: return this.normalized.replace(/_/g, ' ');
    }
  }
}
