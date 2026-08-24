import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RecentActivityData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-recent-activity-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-list">
      <div class="w-list__row" *ngFor="let item of data?.items || []">
        <span class="w-list__icon"><i class="pi" [ngClass]="item.icon || 'pi-history'"></i></span>
        <div class="w-list__main">
          <p class="w-list__title">{{ item.title }}</p>
          <p class="w-list__meta" *ngIf="item.description || item.actorName">
            <span *ngIf="item.actorName">{{ item.actorName }}</span>
            <span *ngIf="item.description">{{ item.description }}</span>
          </p>
        </div>
        <span class="w-list__trail">{{ item.occurredAt | date:'MMM d, h:mm a' }}</span>
      </div>
    </div>
  `
})
export class RecentActivityWidgetComponent {
  @Input({ required: true }) data!: RecentActivityData;
}
