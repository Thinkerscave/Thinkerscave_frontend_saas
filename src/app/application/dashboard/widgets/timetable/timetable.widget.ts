import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TimetableData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-timetable-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="staff-schedule">
      <article class="staff-schedule__row" *ngFor="let slot of data.slots || []" [attr.data-status]="slot.attendanceStatus || 'UPCOMING'">
        <div class="staff-schedule__time">
          <strong>{{ slot.startTime?.slice(0, 5) }}</strong>
          <span>{{ slot.endTime?.slice(0, 5) }}</span>
        </div>
        <span class="staff-schedule__period">{{ slot.periodName || ('P' + slot.periodNumber) }}</span>
        <div class="staff-schedule__subject">
          <strong>{{ slot.subjectName || 'Class session' }}</strong>
          <span>{{ slot.className || 'Class' }}<span *ngIf="slot.roomLabel"> · {{ slot.roomLabel }}</span></span>
          <span class="staff-schedule__substitute" *ngIf="slot.substitute">Replacement teacher</span>
        </div>
        <span class="staff-schedule__status" [attr.data-status]="slot.attendanceStatus || 'UPCOMING'">{{ statusLabel(slot) }}</span>
        <a
          *ngIf="slot.canMarkAttendance"
          class="staff-schedule__action staff-schedule__action--primary"
          [routerLink]="['/app/attendance/students']"
          [queryParams]="attendanceParams(slot)">
          Mark
        </a>
        <a
          *ngIf="!slot.canMarkAttendance && slot.canViewAttendance && slot.attendanceStatus === 'COMPLETED'"
          class="staff-schedule__action"
          [routerLink]="['/app/attendance/students']"
          [queryParams]="attendanceParams(slot)">
          View
        </a>
        <span *ngIf="slot.attendanceMode === 'DAILY' && !slot.attendanceAllowed" class="staff-schedule__hint">
          First class takes attendance
        </span>
      </article>
    </div>
  `,
  styleUrl: './timetable.widget.scss'
})
export class TimetableWidgetComponent {
  @Input({ required: true }) data!: TimetableData;

  attendanceParams(slot: TimetableData['slots'][number]): Record<string, string | number> {
    const params: Record<string, string | number> = {
      date: this.data.date || '',
      academicYearId: slot.academicYearId ?? '',
      classId: slot.classId ?? '',
      sectionId: slot.sectionId ?? ''
    };
    if (slot.attendanceMode === 'PERIOD_WISE') {
      params['periodId'] = slot.periodId ?? '';
      params['periodNumber'] = slot.periodNumber ?? '';
      params['periodName'] = slot.periodName ?? '';
      params['subjectName'] = slot.subjectName ?? '';
    }
    return params;
  }

  statusLabel(slot: TimetableData['slots'][number]): string {
    switch (slot.attendanceStatus) {
      case 'COMPLETED': return 'Completed';
      case 'IN_PROGRESS': return 'In progress';
      case 'PENDING': return 'Pending';
      case 'NO_STUDENTS': return 'No students';
      default: return 'Upcoming';
    }
  }
}
