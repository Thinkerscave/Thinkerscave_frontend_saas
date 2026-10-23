import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CalendarData } from '../../models/dashboard.model';

/** Shared body for both the CALENDAR and EVENTS widget types (identical payload shape). */
@Component({
  selector: 'tc-calendar-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './calendar.widget.scss',
  template: `
    <div class="staff-events">
      <article class="staff-events__card" *ngFor="let item of data?.items || []">
        <div class="staff-events__date">
          <strong>{{ item.startDate | date:'d' }}</strong>
          <span>{{ item.startDate | date:'MMM' }}</span>
        </div>
        <div class="staff-events__main">
          <div class="staff-events__head">
            <p class="staff-events__title">{{ item.title }}</p>
            <span class="staff-events__tag" *ngIf="item.eventType">{{ item.eventType }}</span>
          </div>
          <p class="staff-events__meta" *ngIf="item.startTime">
            <i class="pi pi-clock"></i>{{ item.startTime }}<ng-container *ngIf="item.endTime">–{{ item.endTime }}</ng-container>
          </p>
          <p class="staff-events__meta" *ngIf="item.location">
            <i class="pi pi-map-marker"></i>{{ item.location }}
          </p>
        </div>
      </article>
    </div>
  `
})
export class CalendarWidgetComponent {
  @Input({ required: true }) data!: CalendarData;
}
