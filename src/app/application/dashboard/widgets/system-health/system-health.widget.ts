import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SystemHealthData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-system-health-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-summary-highlight">
      <span>Overall status</span>
      <strong class="w-tag" [attr.data-tone]="overallTone()">{{ data?.overallStatus }}</strong>
    </div>
    <div class="w-list">
      <div class="w-list__row" *ngFor="let check of data?.checks || []">
        <span class="w-list__icon"><i class="pi" [ngClass]="check.icon || 'pi-server'"></i></span>
        <div class="w-list__main">
          <p class="w-list__title">{{ check.label }}</p>
        </div>
        <span class="w-tag" [attr.data-tone]="check.tone || 'neutral'">{{ check.value }}</span>
      </div>
    </div>
  `
})
export class SystemHealthWidgetComponent {
  @Input({ required: true }) data!: SystemHealthData;

  overallTone(): string {
    const status = (this.data?.overallStatus || '').toLowerCase();
    if (status.includes('healthy') || status.includes('operational') || status.includes('ok')) return 'success';
    if (status.includes('degraded') || status.includes('warning')) return 'warning';
    if (status.includes('down') || status.includes('error')) return 'danger';
    return 'neutral';
  }
}
