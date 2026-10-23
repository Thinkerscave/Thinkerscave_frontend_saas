import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AnnouncementsData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-announcements-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './announcements.widget.scss',
  template: `
    <ul class="staff-announcements">
      <li class="staff-announcements__item" *ngFor="let item of data?.items || []; let i = index">
        <span class="staff-announcements__dot" [attr.data-tone]="i % 4"></span>
        <div class="staff-announcements__main">
          <p class="staff-announcements__title">{{ item.title }}</p>
          <p class="staff-announcements__summary" *ngIf="item.summary">
            <span *ngIf="item.category">{{ item.category }} · </span>{{ item.summary }}
          </p>
        </div>
        <time class="staff-announcements__time" *ngIf="item.publishedAt" [attr.datetime]="item.publishedAt">{{ timeAgo(item.publishedAt) }}</time>
      </li>
    </ul>
  `
})
export class AnnouncementsWidgetComponent {
  @Input({ required: true }) data!: AnnouncementsData;

  /** Relative time label, e.g. "2 hours ago". */
  timeAgo(value: string): string {
    const diffMs = Date.now() - new Date(value).getTime();
    if (Number.isNaN(diffMs)) return '';
    const mins = Math.max(0, Math.round(diffMs / 60000));
    if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} minutes ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    const days = Math.round(hours / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
}
