import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RecentRecordsData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-recent-records-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-list">
      <div class="w-list__row" *ngFor="let item of data.items">
        <span class="w-list__icon"><i class="pi pi-file"></i></span>
        <div class="w-list__main">
          <p class="w-list__title">{{ item.primaryLabel }}</p>
          <p class="w-list__meta" *ngIf="item.secondaryLabel">{{ item.secondaryLabel }}</p>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
          <span class="w-tag" [attr.data-tone]="item.statusTone || 'neutral'" *ngIf="item.statusLabel">{{ item.statusLabel }}</span>
          <span class="w-list__trail" *ngIf="item.timestampLabel">{{ item.timestampLabel }}</span>
        </div>
      </div>
    </div>
  `
})
export class RecentRecordsWidgetComponent {
  @Input({ required: true }) data!: RecentRecordsData;
}
