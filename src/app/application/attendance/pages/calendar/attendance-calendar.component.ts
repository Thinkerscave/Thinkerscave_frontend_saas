import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
import { StudentAttendanceApiService } from '../../services/student-attendance-api.service';
import { AttendanceCalendarDay, AcademicLookupItem } from '../../models/student-attendance.model';

interface DayCell {
  day: number;
  date: string;
  isoDate: string;
  status?: AttendanceCalendarDay['status'];
  dayType?: AttendanceCalendarDay['dayType'];
  attendancePercent?: number | null;
  holidayName?: string | null;
  otherMonth: boolean;
}

interface SelectOption { label: string; value: number | null; }

@Component({
  selector: 'app-attendance-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, RouterModule,
    SaasPageHeaderComponent, SaasPanelComponent, SaasFilterRowComponent, SaasStatGridComponent],
  templateUrl: './attendance-calendar.component.html',
  styleUrl: './attendance-calendar.component.scss'
})
export class AttendanceCalendarComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly api = inject(StudentAttendanceApiService);

  years: AcademicLookupItem[] = [];
  classes: AcademicLookupItem[] = [];
  sections: AcademicLookupItem[] = [];

  filters = {
    academicYearId: null as number | null,
    classId: null as number | null,
    sectionId: null as number | null,
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  };

  loading = true;
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  calendarDays: AttendanceCalendarDay[] = [];

  constructor() {}

  ngOnInit(): void {
    this.loadLookups();
    this.refresh();
  }

  get classSelectOptions(): SelectOption[] {
    return [
      { label: 'All Classes', value: null },
      ...this.classes.map(c => ({ label: c.name, value: c.id }))
    ];
  }

  get sectionSelectOptions(): SelectOption[] {
    return [
      { label: 'All Sections', value: null },
      ...this.sections.map(s => ({ label: s.name, value: s.id }))
    ];
  }

  onClassChanged(): void {
    this.filters.sectionId = null;
    this.sections = [];
    this.loadSections();
    this.refresh();
  }

  onSectionChanged(): void {
    this.refresh();
  }

  prev(): void {
    if (this.filters.month === 0) { this.filters.month = 11; this.filters.year -= 1; }
    else { this.filters.month -= 1; }
    this.refresh();
  }

  next(): void {
    if (this.filters.month === 11) { this.filters.month = 0; this.filters.year += 1; }
    else { this.filters.month += 1; }
    this.refresh();
  }

  get monthLabel(): string { return `${this.months[this.filters.month]} ${this.filters.year}`; }

  get todayIso(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  cellDateLabel(cell: DayCell): string {
    if (cell.otherMonth) { return ''; }
    const [y, m, d] = cell.date.split('-').map(Number);
    const label = `${this.months[(m || 1) - 1]} ${d}, ${y}`;
    if (cell.dayType === 'HOLIDAY') { return `${label} · ${cell.holidayName ?? 'Holiday'}`; }
    if (cell.dayType === 'WEEKEND') { return `${label} · Weekend`; }
    if (!cell.status || cell.status === 'NO_DATA') { return `${label} · Not marked`; }
    return `${label} · ${cell.attendancePercent ?? 0}% (${cell.status.toLowerCase()})`;
  }

  refresh(): void {
    this.loading = true;
    this.api.getCalendar(this.filters.year, this.filters.month + 1, this.filters.classId, this.filters.sectionId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.calendarDays = data?.days ?? []; this.cdr.markForCheck(); },
        error: () => { this.calendarDays = []; this.cdr.markForCheck(); }
      });
  }

  get days(): DayCell[] {
    const daysInMonth = new Date(this.filters.year, this.filters.month + 1, 0).getDate();
    const firstWeekday = new Date(this.filters.year, this.filters.month, 1).getDay();
    const byDate = new Map(this.calendarDays.map(d => [d.date, d]));
    const cells: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: 0, date: '', isoDate: '', otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isoDate = this.iso(this.filters.year, this.filters.month + 1, d);
      const entry = byDate.get(isoDate);
      cells.push({
        day: d,
        date: isoDate,
        isoDate,
        otherMonth: false,
        status: entry?.status,
        dayType: entry?.dayType,
        attendancePercent: entry?.attendancePercent ?? null,
        holidayName: entry?.holidayName ?? null
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: 0, date: '', isoDate: '', otherMonth: true });
    }
    return cells;
  }

    get summary(): SaasStat[] {
    const working = this.calendarDays.filter(d => d.dayType === 'WORKING');
    const marked = working.filter(d => d.status !== 'NO_DATA');
    const avgList = marked.map(d => d.attendancePercent ?? 0);
    const avg = avgList.length ? Math.round(avgList.reduce((a, b) => a + b, 0) / avgList.length) : 0;
    const goodDays = marked.filter(d => d.status === 'GOOD').length;
    return [
      { key: 'working', label: 'Working Days', value: working.length.toString(), helper: 'Instructional days', icon: 'pi pi-calendar', tone: 'primary' },
      { key: 'marked', label: 'Days Marked', value: marked.length.toString(), helper: `${working.length ? Math.round((marked.length / working.length) * 100) : 0}% of working days`, icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'avg', label: 'Avg Attendance', value: `${avg}%`, helper: 'Over marked days', icon: 'pi pi-chart-line', tone: 'info' },
      { key: 'good', label: 'High Days', value: goodDays.toString(), helper: '≥85% present', icon: 'pi pi-flag', tone: 'success' }
    ];
  }

  openDay(cell: DayCell): void {
    if (cell.otherMonth) { return; }
    this.router.navigate(['/attendance/students'], {
      queryParams: {
        date: cell.date,
        ...(this.filters.classId != null ? { classId: String(this.filters.classId) } : {}),
        ...(this.filters.sectionId != null ? { sectionId: String(this.filters.sectionId) } : {})
      }
    });
  }

  trackByDay(_i: number, cell: DayCell): string { return cell.otherMonth ? `o${_i}` : cell.date; }

  private loadLookups(): void {
    this.api.getYears()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: years => {
          this.years = years;
          const current = years.find(y => (y.status ?? '').toUpperCase() === 'CURRENT');
          const yearId = current?.id ?? years[0]?.id ?? null;
          this.filters.academicYearId = yearId;
          if (yearId != null) { this.loadClasses(yearId); }
        },
        error: () => { /* calendar still works class-wide */ }
      });
  }

  private loadClasses(yearId: number): void {
    this.api.getClassesByYear(yearId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: classes => { this.classes = classes; this.cdr.markForCheck(); },
        error: () => { this.classes = []; this.cdr.markForCheck(); }
      });
  }

  private loadSections(): void {
    const classId = this.filters.classId;
    if (classId == null) { this.sections = []; this.cdr.markForCheck(); return; }
    this.api.getSectionsByClass(classId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: sections => { this.sections = sections; this.cdr.markForCheck(); },
        error: () => { this.sections = []; this.cdr.markForCheck(); }
      });
  }

  private iso(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}