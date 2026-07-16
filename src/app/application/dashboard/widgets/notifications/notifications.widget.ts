import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NotificationsData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-notifications-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-list">
      <div class="w-list__row" *ngFor="let item of data.items">
        <span class="w-list__icon"><i [class]="item.pinned ? 'pi pi-bell' : 'pi pi-info-circle'"></i></span>
        <div class="w-list__main">
          <p class="w-list__title">{{ item.title }}</p>
          <p class="w-list__meta" *ngIf="item.message">{{ item.message }}</p>
        </div>
        <span class="w-list__trail">{{ item.date | date:'MMM d' }}</span>
      </div>
    </div>
  `
})
export class NotificationsWidgetComponent {
  @Input({ required: true }) data!: NotificationsData;
}
