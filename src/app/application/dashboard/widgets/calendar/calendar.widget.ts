import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CalendarData } from '../../models/dashboard.model';

/** Shared body for both the CALENDAR and EVENTS widget types (identical payload shape). */
@Component({
  selector: 'tc-calendar-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-list">
      <div class="w-list__row" *ngFor="let item of data.items">
        <span class="w-list__icon"><i [class]="iconFor(item.eventType)"></i></span>
        <div class="w-list__main">
          <p class="w-list__title">{{ item.title }}</p>
          <p class="w-list__meta" *ngIf="item.eventType">{{ item.eventType }}</p>
        </div>
        <span class="w-list__trail">
          {{ item.startDate | date:'MMM d' }}
          <ng-container *ngIf="item.endDate && item.endDate !== item.startDate"> - {{ item.endDate | date:'MMM d' }}</ng-container>
        </span>
      </div>
    </div>
  `
})
export class CalendarWidgetComponent {
  @Input({ required: true }) data!: CalendarData;

  iconFor(eventType?: string): string {
    const type = (eventType || '').toLowerCase();
    if (type.includes('holiday')) return 'pi pi-sun';
    if (type.includes('exam')) return 'pi pi-pencil';
    if (type.includes('meeting')) return 'pi pi-users';
    return 'pi pi-calendar';
  }
}
