import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';

import {
  SaasPageHeaderComponent,
  SaasStatGridComponent,
  SaasPanelComponent,
  SaasFilterRowComponent,
  SaasStat
} from '../../../../shared/ui/saas';
import { SchoolOperationsDataService } from '../../../school-operations/services/school-operations-data.service';
import { AttendanceWorkspaceData, RosterAttendanceRow } from '../../../school-operations/models/school-operations.model';

interface PendingClass { className: string; sectionName: string; completed: number; total: number; pct: number; }
interface SelectOption { label: string; value: string; }

@Component({
  selector: 'app-attendance-student',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasFilterRowComponent],
  templateUrl: './attendance-student.component.html',
  styleUrl: './attendance-student.component.scss'
})
export class AttendanceStudentComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dataService = inject(SchoolOperationsDataService);

  data: AttendanceWorkspaceData = this.empty();
  rows: RosterAttendanceRow[] = [];
  loading = true;
  rosterLoading = false;
  saving = false;
  copying = false;
  allowCopyPrevious = true;
  copyError: string | null = null;

  filters = {
    academicYear: '2025-26',
    classId: 'all',
    sectionName: 'all',
    date: this.dataService.today()
  };

  readonly academicYearOptions: SelectOption[] = [
    { label: '2025-26', value: '2025-26' },
    { label: '2024-25', value: '2024-25' }
  ];

  /** Thumb-friendly primary marking states (Leave maps to EXCUSED). */
  readonly statuses = [
    { label: 'Present', value: 'PRESENT' as const, short: 'P' },
    { label: 'Absent', value: 'ABSENT' as const, short: 'A' },
    { label: 'Leave', value: 'EXCUSED' as const, short: 'L' }
  ];

  constructor() {}

  ngOnInit(): void { this.refresh(); }

  get classSelectOptions(): SelectOption[] {
    return [
      { label: 'All Classes', value: 'all' },
      ...this.data.classes.map(c => ({ label: c.className, value: String(c.classId) }))
    ];
  }

  get sectionSelectOptions(): SelectOption[] {
    return [
      { label: 'All Sections', value: 'all' },
      ...this.sections.map(s => ({ label: s, value: s }))
    ];
  }

  onClassChanged(): void {
    this.filters.sectionName = 'all';
  }

  get rosterSummary(): { present: number; absent: number; leave: number; late: number; unmarked: number } {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;
    let unmarked = 0;
    for (const row of this.rows) {
      if (row.status === 'PRESENT') present += 1;
      else if (row.status === 'ABSENT') absent += 1;
      else if (row.status === 'EXCUSED' || row.status === 'ON_LEAVE') leave += 1;
      else if (row.status === 'LATE') late += 1;
      else unmarked += 1;
    }
    return { present, absent, leave, late, unmarked };
  }

  get stats(): SaasStat[] {
    const totalStudents = this.data.students.length;
    const present = this.data.todayClassAttendance.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absent = this.data.todayClassAttendance.filter(r => r.status === 'ABSENT').length;
    const leave = this.data.todayClassAttendance.filter(r => r.status === 'EXCUSED' || r.status === 'ON_LEAVE').length;
    const pct = totalStudents ? Math.round((present / totalStudents) * 100) : 0;
    return [
      { key: 'total', label: 'Total Students', value: totalStudents.toLocaleString(), helper: 'All Classes', icon: 'pi pi-users', tone: 'primary' },
      { key: 'present', label: 'Present Today', value: present.toLocaleString(), helper: `${pct}%`, icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'absent', label: 'Absent Today', value: absent.toLocaleString(), helper: totalStudents ? `${Math.round((absent / totalStudents) * 100)}%` : '0%', icon: 'pi pi-user-minus', tone: 'danger' },
      { key: 'leave', label: 'On Leave', value: leave.toLocaleString(), helper: 'Excused', icon: 'pi pi-calendar', tone: 'info' }
    ];
  }

  get sections(): string[] {
    const names = this.data.students
      .filter(s => this.filters.classId === 'all' || String(s.classId ?? '') === this.filters.classId)
      .map(s => s.sectionName)
      .filter((n): n is string => Boolean(n));
    return Array.from(new Set(names)).sort();
  }

  get pendingClasses(): PendingClass[] {
    const totals = new Map<string, { total: number; marked: number; section: string }>();
    this.data.students.forEach(s => {
      const key = `${s.className}|${s.sectionName ?? '-'}`;
      const e = totals.get(key) ?? { total: 0, marked: 0, section: s.sectionName ?? '-' };
      e.total += 1;
      totals.set(key, e);
    });
    this.data.todayClassAttendance.forEach(r => {
      const key = `${r.className}|${r.sectionName ?? '-'}`;
      const e = totals.get(key);
      if (e) { e.marked += 1; }
    });
    return Array.from(totals.entries()).map(([key, info]) => {
      const className = key.split('|')[0] || 'Unassigned';
      const pct = info.total ? Math.round((info.marked / info.total) * 100) : 0;
      return {
        className: className === 'null' || className === 'undefined' ? 'Unassigned' : className,
        sectionName: !info.section || info.section === '-' || info.section === 'null' ? '—' : info.section,
        completed: info.marked,
        total: info.total,
        pct
      };
    }).sort((a, b) => a.pct - b.pct).slice(0, 6);
  }

  loadRoster(): void {
    this.rosterLoading = true;
    this.dataService.loadStudentRoster(this.filters)
      .pipe(finalize(() => { this.rosterLoading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: rows => this.rows = rows,
        error: () => this.rows = []
      });
  }

  markAllPresent(): void {
    this.rows.forEach(r => r.status = 'PRESENT');
    this.cdr.markForCheck();
  }

  markAllAbsent(): void {
    this.rows.forEach(r => r.status = 'ABSENT');
    this.cdr.markForCheck();
  }

  get canCopyPrevious(): boolean {
    return this.allowCopyPrevious
      && this.filters.classId !== 'all'
      && !!this.filters.date
      && !this.copying
      && !this.rosterLoading;
  }

  copyPrevious(): void {
    if (!this.canCopyPrevious) { return; }
    const classId = Number(this.filters.classId);
    if (!Number.isFinite(classId)) { return; }

    const sectionId = this.resolveSectionId();
    this.copying = true;
    this.copyError = null;
    this.dataService.copyPreviousAttendance(classId, this.filters.date, sectionId)
      .pipe(finalize(() => { this.copying = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadRoster(),
        error: (err) => {
          this.copyError = err?.error?.message || err?.message || 'Could not copy previous attendance.';
        }
      });
  }

  setStatus(row: RosterAttendanceRow, status: RosterAttendanceRow['status']): void {
    row.status = status;
    this.cdr.markForCheck();
  }

  selectPending(pending: PendingClass): void {
    const match = this.data.classes.find(c => c.className === pending.className);
    if (match) {
      this.filters.classId = String(match.classId);
      this.filters.sectionName = pending.sectionName === '-' ? 'all' : pending.sectionName;
      this.loadRoster();
    }
  }

  submit(): void {
    if (!this.rows.length) { return; }
    this.saving = true;
    this.dataService.saveAttendanceBatch(this.rows, 'CLASS')
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.refresh() });
  }

  exportCsv(): void {
    const rows = [['Roll', 'Name', 'Class', 'Section', 'Status', 'Remarks']];
    this.rows.forEach((r, i) => rows.push([String(i + 1), r.referenceName, r.className ?? '', r.sectionName ?? '', r.status, r.remarks ?? '']));
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `student-attendance-${this.filters.date}.csv`; a.click();
    window.URL.revokeObjectURL(url);
  }

  refresh(): void {
    this.loading = true;
    this.dataService.getAttendanceSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(settings => {
        this.allowCopyPrevious = settings.allowCopyPrevious;
        this.cdr.markForCheck();
      });
    this.dataService.loadAttendanceWorkspace()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.data = data; if (this.rows.length) { this.loadRoster(); } },
        error: () => this.data = this.empty()
      });
  }

  trackByRow(_: number, row: RosterAttendanceRow): number { return row.referenceId; }

  statusTone(status: RosterAttendanceRow['status']): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
    if (status === 'PRESENT') return 'success';
    if (status === 'ABSENT') return 'danger';
    if (status === 'LATE') return 'warning';
    if (status === 'EXCUSED') return 'info';
    return 'neutral';
  }

  pctTone(pct: number): 'success' | 'warning' | 'danger' | 'neutral' {
    if (pct >= 90) return 'success';
    if (pct >= 70) return 'warning';
    if (pct === 0) return 'neutral';
    return 'danger';
  }

  private resolveSectionId(): number | null {
    if (this.filters.sectionName === 'all') { return null; }
    const match = this.data.students.find(s =>
      (this.filters.classId === 'all' || String(s.classId ?? '') === this.filters.classId)
      && (s.sectionName ?? '') === this.filters.sectionName
      && s.sectionId != null
    );
    return match?.sectionId != null ? Number(match.sectionId) : null;
  }

  private empty(): AttendanceWorkspaceData {
    return {
      today: this.dataService.today(),
      students: [], staff: [], classes: [], sections: [], departments: [], branches: [],
      todayClassAttendance: [], todayStaffAttendance: [], trends: []
    };
  }
}
