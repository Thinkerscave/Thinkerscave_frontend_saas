import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasFilterRowComponent,
  SaasStatGridComponent,
  SaasStat
} from '../../../../shared/ui/saas';
import { SchoolOperationsDataService } from '../../../school-operations/services/school-operations-data.service';
import { AttendanceWorkspaceData } from '../../../school-operations/models/school-operations.model';

interface DayCell { day: number; date: Date; status?: 'P' | 'A' | 'H' | 'L'; weekend?: boolean; today?: boolean; otherMonth?: boolean; }
interface SelectOption { label: string; value: string; }

@Component({
  selector: 'app-attendance-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, SaasPageHeaderComponent, SaasPanelComponent, SaasFilterRowComponent, SaasStatGridComponent],
  templateUrl: './attendance-calendar.component.html',
  styleUrl: './attendance-calendar.component.scss'
})
export class AttendanceCalendarComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dataService = inject(SchoolOperationsDataService);

  data: AttendanceWorkspaceData = this.empty();
  loading = true;
  filters = { studentName: '', classId: 'all', sectionName: 'all', month: new Date().getMonth(), year: new Date().getFullYear() };
  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  constructor() {}

  ngOnInit(): void { this.refresh(); }

  get studentSelectOptions(): SelectOption[] {
    return [
      { label: 'All Students', value: '' },
      ...this.data.students.map(s => {
        const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
        return { label: name || 'Unknown', value: name };
      })
    ];
  }

  get classSelectOptions(): SelectOption[] {
    return [
      { label: 'All', value: 'all' },
      ...this.data.classes.map(c => ({ label: c.className, value: String(c.classId) }))
    ];
  }

  get sectionSelectOptions(): SelectOption[] {
    return [{ label: 'All', value: 'all' }];
  }

  refresh(): void {
    this.loading = true;
    this.dataService.loadAttendanceWorkspace()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: data => this.data = data, error: () => this.data = this.empty() });
  }

  prev(): void {
    if (this.filters.month === 0) { this.filters.month = 11; this.filters.year -= 1; }
    else { this.filters.month -= 1; }
  }
  next(): void {
    if (this.filters.month === 11) { this.filters.month = 0; this.filters.year += 1; }
    else { this.filters.month += 1; }
  }

  get monthLabel(): string { return `${this.months[this.filters.month]} ${this.filters.year}`; }

  get days(): DayCell[] {
    const first = new Date(this.filters.year, this.filters.month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(this.filters.year, this.filters.month + 1, 0).getDate();
    const todayStr = this.dataService.today();
    const cells: DayCell[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ day: 0, date: new Date(0), otherMonth: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(this.filters.year, this.filters.month, d);
      const weekday = date.getDay();
      const weekend = weekday === 0;
      let status: DayCell['status'] = undefined;
      if (!weekend) {
        const seed = (d + this.filters.month) % 9;
        status = seed === 4 ? 'A' : seed === 7 ? 'L' : seed === 8 ? 'H' : 'P';
      }
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      cells.push({ day: d, date, status, weekend, today: iso === todayStr });
    }
    while (cells.length % 7 !== 0) cells.push({ day: 0, date: new Date(0), otherMonth: true });
    return cells;
  }

  get summary(): SaasStat[] {
    const present = this.days.filter(d => d.status === 'P' || d.status === 'L').length;
    const absent = this.days.filter(d => d.status === 'A').length;
    const working = this.days.filter(d => d.status).length;
    const pct = working ? Math.round((present / working) * 100) : 0;
    return [
      { key: 'present', label: 'Present Days', value: present.toString(), icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'absent', label: 'Absent Days', value: absent.toString(), icon: 'pi pi-times-circle', tone: 'danger' },
      { key: 'pct', label: 'Attendance %', value: `${pct}%`, icon: 'pi pi-chart-line', tone: 'info' },
      { key: 'working', label: 'Total Working Days', value: working.toString(), icon: 'pi pi-calendar', tone: 'primary' }
    ];
  }

  trackByDay(_i: number, cell: DayCell): string { return cell.otherMonth ? `o${_i}` : `${cell.day}-${cell.date.getMonth()}`; }

  private empty(): AttendanceWorkspaceData {
    return {
      today: this.dataService.today(), students: [], staff: [], classes: [], sections: [], departments: [], branches: [],
      todayClassAttendance: [], todayStaffAttendance: [], trends: []
    };
  }
}
