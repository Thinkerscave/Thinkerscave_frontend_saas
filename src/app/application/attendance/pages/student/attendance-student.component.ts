import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';

import {
  SaasPageHeaderComponent,
  SaasStatGridComponent,
  SaasPanelComponent,
  SaasFilterRowComponent,
  SaasStat
} from '../../../../shared/ui/saas';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { PermissionService } from '../../../../core/services/permission.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { StudentAttendanceApiService } from '../../services/student-attendance-api.service';
import {
  AcademicLookupItem,
  RosterStudent,
  StudentRoster,
  StudentSession,
  StudentStatus
} from '../../models/student-attendance.model';

interface SelectOption { label: string; value: number | null; }

@Component({
  selector: 'app-attendance-student',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, SaasPageHeaderComponent,
    TcPageSkeletonComponent, SaasStatGridComponent, SaasPanelComponent, SaasFilterRowComponent,
    AppToastComponent],
  providers: [MessageService],
  templateUrl: './attendance-student.component.html',
  styleUrl: './attendance-student.component.scss'
})
export class AttendanceStudentComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(StudentAttendanceApiService);
  private readonly permissions = inject(PermissionService);
  private readonly messages = inject(MessageService);

  readonly menuCode = 'ATTENDANCE';

  years: AcademicLookupItem[] = [];
  classes: AcademicLookupItem[] = [];
  sections: AcademicLookupItem[] = [];

  filters = {
    academicYearId: null as number | null,
    classId: null as number | null,
    sectionId: null as number | null,
    date: this.todayLocal()
  };

  roster: StudentRoster | null = null;
  rows: RosterStudent[] = [];
  recentSessions: StudentSession[] = [];

  loading = true;
  lookupsLoading = false;
  rosterLoading = false;
  sessionsLoading = false;
  saving = false;
  copying = false;

  showConfirm = false;
  saveError: string | null = null;
  copyError: string | null = null;

  ngOnInit(): void {
    this.prefillFromRoute();
    this.loadLookups();
    this.loadSessions();
  }

  get yearSelectOptions(): SelectOption[] {
    return this.years.map(y => ({ label: y.name, value: y.id }));
  }

  get classSelectOptions(): SelectOption[] {
    return this.classes.map(c => ({ label: c.name, value: c.id }));
  }

  get sectionSelectOptions(): SelectOption[] {
    return this.sections.map(s => ({ label: s.name, value: s.id }));
  }

  onYearChanged(): void {
    this.filters.classId = null;
    this.filters.sectionId = null;
    this.sections = [];
    this.resetRoster();
    this.loadClasses();
    this.loadSessions();
  }

  onClassChanged(): void {
    this.filters.sectionId = null;
    this.sections = [];
    this.resetRoster();
    this.loadSections();
    this.loadRoster();
    this.loadSessions();
  }

  onSectionChanged(): void {
    this.resetRoster();
    this.loadRoster();
    this.loadSessions();
  }

  onDateChanged(): void {
    this.resetRoster();
    this.loadRoster();
    this.loadSessions();
  }

  loadLookups(): void {
    this.lookupsLoading = true;
    this.loading = true;
    this.api.getYears()
      .pipe(finalize(() => { this.lookupsLoading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: years => {
          this.years = years;
          if (!years.length) {
            this.loading = false;
            this.cdr.markForCheck();
            return;
          }
          const preferred = years.find(y => (y.status ?? '').toUpperCase() === 'CURRENT') ?? years[0];
          this.filters.academicYearId = preferred.id;
          this.loadClasses();
        },
        error: () => { this.loading = false; this.cdr.markForCheck(); }
      });
  }

  private loadClasses(): void {
    const yearId = this.filters.academicYearId;
    if (yearId == null) { this.loading = false; this.cdr.markForCheck(); return; }
    this.api.getClassesByYear(yearId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: classes => {
          this.classes = classes;
          if (classes.length && this.filters.classId == null) {
            this.filters.classId = classes[0].id;
            this.loadSections();
            this.loadRoster();
            this.loadSessions();
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loading = false; this.cdr.markForCheck(); }
      });
  }

  private loadSections(): void {
    const classId = this.filters.classId;
    if (classId == null) { this.sections = []; this.cdr.markForCheck(); return; }
    this.api.getSectionsByClass(classId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: sections => {
          this.sections = sections;
          this.cdr.markForCheck();
        },
        error: () => { this.sections = []; this.cdr.markForCheck(); }
      });
  }

  loadRoster(): void {
    const classId = this.filters.classId;
    if (classId == null || !this.filters.date) { this.resetRoster(); return; }
    this.rosterLoading = true;
    this.saveError = null;
    this.api.getRoster(classId, this.filters.sectionId, this.filters.date)
      .pipe(finalize(() => { this.rosterLoading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: roster => {
          this.roster = roster;
          this.rows = roster?.students ?? [];
          this.cdr.markForCheck();
        },
        error: err => {
          this.roster = null;
          this.rows = [];
          this.saveError = extractApiError(err, 'Unable to load the attendance roster.').message;
          this.cdr.markForCheck();
        }
      });
  }

  loadSessions(): void {
    const from = this.monthStart(this.filters.date);
    const to = this.monthEnd(this.filters.date);
    this.sessionsLoading = true;
    this.api.getSessions(from, to, this.filters.classId, this.filters.sectionId)
      .pipe(finalize(() => { this.sessionsLoading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: sessions => { this.recentSessions = sessions ?? []; this.cdr.markForCheck(); },
        error: () => { this.recentSessions = []; this.cdr.markForCheck(); }
      });
  }

  get stats(): SaasStat[] {
    const total = this.rows.length;
    const present = this.rows.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absent = this.rows.filter(r => r.status === 'ABSENT').length;
    const leave = this.rows.filter(r => r.status === 'EXCUSED' || r.status === 'ON_LEAVE').length;
    const unmarked = total - present - absent - leave;
    const pct = total ? Math.round((present / total) * 100) : 0;
    return [
      { key: 'total', label: 'Total Students', value: total.toLocaleString(), helper: this.roster?.sectionName ?? 'Selected class', icon: 'pi pi-users', tone: 'primary' },
      { key: 'present', label: 'Present', value: present.toLocaleString(), helper: `${pct}%`, icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'absent', label: 'Absent', value: absent.toLocaleString(), helper: total ? `${Math.round((absent / total) * 100)}%` : '0%', icon: 'pi pi-user-minus', tone: 'danger' },
      { key: 'unmarked', label: 'Not Marked', value: unmarked.toLocaleString(), helper: 'Awaiting entry', icon: 'pi pi-hourglass', tone: 'info' }
    ];
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

  get monthLabel(): string {
    const parts = this.filters.date.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const names = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    if (!y || !m || m < 1 || m > 12) { return ''; }
    return `${names[m - 1]} ${y}`;
  }

  get canMarkAttendance(): boolean {
    if (this.readOnly) { return false; }
    if (!this.roster) { return true; }
    if (this.roster.frozen) { return false; }
    if (!this.roster.attendanceRequired) { return false; }
    return this.roster.attendanceMode === 'DAILY';
  }

  get markingBlockReason(): string | null {
    const r = this.roster;
    if (!r) { return null; }
    if (r.frozen) { return `Attendance is frozen for this date and cannot be modified.`; }
    if (!r.attendanceRequired) {
      const reason = r.holiday ? (r.holidayName ? `holiday — ${r.holidayName}` : 'holiday') : 'weekend';
      return `This date is a ${reason}. Attendance cannot be marked.`;
    }
    if (r.attendanceMode !== 'DAILY') {
      return 'This organization uses period-wise attendance. Marking for periods is not available on this screen yet.';
    }
    return null;
  }

  get readOnly(): boolean {
    return this.permissions.isLoaded() && !this.permissions.canManage(this.menuCode);
  }

  markAllPresent(): void {
    this.rows.forEach(r => { if (!r.status) { r.status = 'PRESENT'; } });
    this.cdr.markForCheck();
  }

  markAllAbsent(): void {
    this.rows.forEach(r => { if (!r.status) { r.status = 'ABSENT'; } });
    this.cdr.markForCheck();
  }

  setStatus(row: RosterStudent, status: StudentStatus): void {
    if (!this.canMarkAttendance) { return; }
    row.status = row.status === status ? null : status;
    this.cdr.markForCheck();
  }

  get canCopyPrevious(): boolean {
    return !this.readOnly
      && !!this.roster
      && this.roster.attendanceRequired
      && !this.roster.frozen
      && this.roster.attendanceMode === 'DAILY'
      && this.filters.classId != null
      && !!this.filters.date
      && !this.copying
      && !this.rosterLoading;
  }

  copyPrevious(): void {
    if (!this.canCopyPrevious) { return; }
    this.copying = true;
    this.copyError = null;
    this.api.copyPrevious(this.filters.classId!, this.filters.sectionId, this.filters.date)
      .pipe(finalize(() => { this.copying = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Copied', detail: 'Attendance copied from the previous working day.' });
          this.loadRoster();
        },
        error: (err) => {
          this.copyError = extractApiError(err, 'Could not copy previous attendance.').message;
          this.cdr.markForCheck();
        }
      });
  }

  get confirmSummary(): { present: number; absent: number; leave: number; late: number; total: number } {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;
    let total = 0;
    for (const row of this.rows) {
      if (!row.status) { continue; }
      total += 1;
      if (row.status === 'PRESENT') present += 1;
      else if (row.status === 'ABSENT') absent += 1;
      else if (row.status === 'EXCUSED' || row.status === 'ON_LEAVE') leave += 1;
      else if (row.status === 'LATE') late += 1;
    }
    return { present, absent, leave, late, total };
  }

  requestSave(): void {
    if (!this.rows.length || this.confirmSummary.total === 0) { return; }
    this.saveError = null;
    this.showConfirm = true;
    this.cdr.markForCheck();
  }

  cancelSave(): void {
    this.showConfirm = false;
    this.cdr.markForCheck();
  }

  submit(): void {
    if (this.confirmSummary.total === 0 || this.filters.classId == null) { return; }
    const entries = this.rows
      .filter(r => r.status)
      .map(r => ({
        studentId: r.studentId,
        studentName: r.studentName,
        rollNumber: r.rollNumber ?? null,
        admissionNumber: r.admissionNumber ?? null,
        status: r.status!,
        remarks: r.remarks ?? null
      }));

    this.saving = true;
    this.saveError = null;
    this.api.markDaily({
      academicYearId: this.filters.academicYearId,
      classId: this.filters.classId,
      sectionId: this.filters.sectionId,
      attendanceDate: this.filters.date,
      entries
    })
      .pipe(finalize(() => { this.saving = false; this.showConfirm = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Saved', detail: `Attendance marked for ${entries.length} students.` });
          this.loadRoster();
          this.loadSessions();
        },
        error: (err) => {
          this.saveError = extractApiError(err, 'Attendance could not be saved. Your entries were kept.').message;
          this.messages.add({ severity: 'error', summary: 'Save failed', detail: this.saveError });
          this.cdr.markForCheck();
        }
      });
  }

  selectSession(session: StudentSession): void {
    this.filters.date = session.date;
    this.filters.classId = session.classId;
    this.filters.sectionId = session.sectionId ?? null;
    // Keep the class dropdown consistent when the session belongs to a class outside the loaded year.
    if (session.className && !this.classes.some(c => c.id === session.classId)) {
      this.classes = [...this.classes, { id: session.classId, name: session.className }];
    }
    this.resetRoster();
    this.loadSections();
    this.loadRoster();
    this.loadSessions();
  }

  exportCsv(): void {
    const header = ['Roll No.', 'Student Name', 'Class', 'Section', 'Status', 'Remarks'];
    const body = this.rows.map((r, i) => [
      r.rollNumber ?? `${i + 1}`,
      r.studentName,
      this.roster?.className ?? '',
      this.roster?.sectionName ?? '',
      r.status ?? 'Not Marked',
      r.remarks ?? ''
    ]);
    const csv = [header, ...body]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-attendance-${this.filters.date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  pctTone(pct: number): 'success' | 'warning' | 'danger' | 'neutral' {
    if (pct >= 90) return 'success';
    if (pct >= 70) return 'warning';
    if (pct === 0) return 'neutral';
    return 'danger';
  }

  trackByStudent(_: number, row: RosterStudent): number { return row.studentId; }
  trackBySession(_: number, s: StudentSession): string { return `${s.date}-${s.classId}-${s.sectionId ?? 'X'}`; }

  private resetRoster(): void {
    this.roster = null;
    this.rows = [];
    this.showConfirm = false;
    this.saveError = null;
    this.copyError = null;
  }

  private prefillFromRoute(): void {
    const params = this.route.snapshot.queryParamMap;
    const date = params.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      this.filters.date = date;
    }
    const classId = params.get('classId');
    if (classId && !Number.isNaN(Number(classId))) {
      this.filters.classId = Number(classId);
    }
    const sectionId = params.get('sectionId');
    if (sectionId && !Number.isNaN(Number(sectionId))) {
      this.filters.sectionId = Number(sectionId);
    }
  }

  private todayLocal(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private monthStart(date: string): string {
    return `${date.slice(0, 7)}-01`;
  }

  private monthEnd(date: string): string {
    const [y, m] = date.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  }
}