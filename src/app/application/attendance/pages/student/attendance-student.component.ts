import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

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

@Component({
  selector: 'app-attendance-student',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasFilterRowComponent],
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

  filters = {
    academicYear: '2025-26',
    classId: 'all',
    sectionName: 'all',
    date: this.dataService.today()
  };

  readonly statuses = [
    { label: 'Present', value: 'PRESENT' as const },
    { label: 'Absent', value: 'ABSENT' as const },
    { label: 'Late', value: 'LATE' as const },
    { label: 'Leave', value: 'EXCUSED' as const }
  ];

  constructor() {}

  ngOnInit(): void { this.refresh(); }

  get stats(): SaasStat[] {
    const totalStudents = this.data.students.length;
    const present = this.data.todayClassAttendance.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absent = this.data.todayClassAttendance.filter(r => r.status === 'ABSENT').length;
    const pct = totalStudents ? Math.round((present / totalStudents) * 100) : 0;
    return [
      { key: 'total', label: 'Total Students', value: totalStudents.toLocaleString(), helper: 'All Classes', icon: 'pi pi-users', tone: 'primary' },
      { key: 'present', label: 'Present Today', value: present.toLocaleString(), helper: `${pct}%`, icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'absent', label: 'Absent Today', value: absent.toLocaleString(), helper: totalStudents ? `${Math.round((absent / totalStudents) * 100)}%` : '0%', icon: 'pi pi-user-minus', tone: 'danger' },
      { key: 'percent', label: 'Attendance %', value: `${pct}%`, helper: 'Average', icon: 'pi pi-chart-line', tone: 'info' }
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
      const className = key.split('|')[0];
      const pct = info.total ? Math.round((info.marked / info.total) * 100) : 0;
      return { className, sectionName: info.section, completed: info.marked, total: info.total, pct };
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

  markAllPresent(): void { this.rows.forEach(r => r.status = 'PRESENT'); }

  setStatus(row: RosterAttendanceRow, status: RosterAttendanceRow['status']): void {
    row.status = status;
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

  private empty(): AttendanceWorkspaceData {
    return {
      today: this.dataService.today(),
      students: [], staff: [], classes: [], sections: [], departments: [], branches: [],
      todayClassAttendance: [], todayStaffAttendance: [], trends: []
    };
  }
}
