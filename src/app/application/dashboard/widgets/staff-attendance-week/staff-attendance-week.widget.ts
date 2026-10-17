import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { StaffAttendanceWeekData, StaffAttendanceWeekDay } from '../../models/dashboard.model';

@Component({
  selector: 'tc-staff-attendance-week-widget',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './staff-attendance-week.widget.html',
  styleUrl: './staff-attendance-week.widget.scss'
})
export class StaffAttendanceWeekWidgetComponent {
  @Input({ required: true }) data!: StaffAttendanceWeekData;

  iconFor(day: StaffAttendanceWeekDay): string {
    switch (day.displayStatus) {
      case 'PRESENT':
      case 'LATE':
      case 'WFH':
        return 'pi pi-check';
      case 'ABSENT':
        return 'pi pi-times';
      case 'HALF_DAY':
        return 'pi pi-minus';
      case 'NOT_STARTED':
        return 'pi pi-clock';
      case 'ON_LEAVE':
        return 'pi pi-briefcase';
      default:
        return '';
    }
  }

  statusLabel(day: StaffAttendanceWeekDay): string {
    if (day.displayStatus === 'NOT_STARTED') return 'Not yet recorded';
    if (day.displayStatus === 'FUTURE') return 'Upcoming';
    if (day.displayStatus === 'ON_LEAVE') return 'On leave';
    if (day.displayStatus === 'WEEKEND') return 'Weekend';
    if (day.displayStatus === 'HOLIDAY') return 'Holiday';
    if (day.displayStatus === 'NOT_RECORDED') return 'Not recorded';
    return day.displayStatus.replaceAll('_', ' ').toLowerCase();
  }
}