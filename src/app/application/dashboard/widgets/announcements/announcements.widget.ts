import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AnnouncementsData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-announcements-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-list">
      <div class="w-list__row" *ngFor="let item of data.items">
        <span class="w-list__icon"><i [class]="item.pinned ? 'pi pi-bookmark-fill' : 'pi pi-megaphone'"></i></span>
        <div class="w-list__main">
          <p class="w-list__title">{{ item.title }}</p>
          <p class="w-list__meta" *ngIf="item.summary">
            <span *ngIf="item.category">{{ item.category }} ·</span> {{ item.summary }}
          </p>
        </div>
        <span class="w-list__trail">{{ item.publishedAt | date:'MMM d' }}</span>
      </div>
    </div>
  `
})
export class AnnouncementsWidgetComponent {
  @Input({ required: true }) data!: AnnouncementsData;
}
