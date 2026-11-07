import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { StatListItem } from '../../models/dashboard.model';

/** Renders a generic list of labelled statistics for the `STAT_LIST` widget. */
@Component({
  selector: 'tc-stat-list-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-list">
      <div class="w-list__row" *ngFor="let item of items">
        <span class="w-list__icon"><i class="pi" [ngClass]="item.icon || 'pi-circle'"></i></span>
        <div class="w-list__main">
          <p class="w-list__title">{{ item.label }}</p>
          <p class="w-list__meta" *ngIf="item.secondaryLabel">{{ item.secondaryLabel }}</p>
        </div>
        <span class="w-tag" [attr.data-tone]="item.tone || 'neutral'">{{ item.value }}</span>
      </div>
    </div>
  `
})
export class StatListWidgetComponent {
  @Input({ required: true }) items!: StatListItem[];
}
