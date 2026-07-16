import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TimetableData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-timetable-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-list">
      <div class="w-list__row" *ngFor="let slot of data.slots">
        <span class="w-list__icon"><i class="pi pi-book"></i></span>
        <div class="w-list__main">
          <p class="w-list__title">
            {{ slot.subjectName || 'Free period' }}
            <span class="w-tag" data-tone="neutral" *ngIf="slot.periodName">{{ slot.periodName }}</span>
          </p>
          <p class="w-list__meta">
            <span *ngIf="slot.className">{{ slot.className }}</span>
            <span *ngIf="slot.teacherName">{{ slot.teacherName }}</span>
            <span *ngIf="slot.roomLabel">{{ slot.roomLabel }}</span>
          </p>
        </div>
        <span class="w-list__trail">{{ slot.startTime }}<ng-container *ngIf="slot.endTime"> - {{ slot.endTime }}</ng-container></span>
      </div>
    </div>
  `
})
export class TimetableWidgetComponent {
  @Input({ required: true }) data!: TimetableData;
}
