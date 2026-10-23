import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';

import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { LoginService } from '../../../../core/services/login.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { AcademicsMeApiService } from '../../../academics/services/academics-me-api.service';
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
    TcPageSkeletonComponent, AppToastComponent, AvatarComponent],
  providers: [MessageService],
  templateUrl: './attendance-student.component.html',
  styleUrl: './attendance-student.component.scss'
})
export class AttendanceStudentComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(StudentAttendanceApiService);
  private readonly academicsMe = inject(AcademicsMeApiService);
  private readonly login = inject(LoginService);
  private readonly permissions = inject(PermissionService);
  private readonly messages = inject(MessageService);

  readonly menuCode = 'ATTENDANCE';

  readonly todayIso = this.todayLocal();

  years: AcademicLookupItem[] = [];
  classes: AcademicLookupItem[] = [];
  sections: AcademicLookupItem[] = [];

  filters = {
    academicYearId: null as number | null,
    classId: null as number | null,
    sectionId: null as number | null,
    periodId: null as number | null,
    periodNumber: null as number | null,
    periodName: null as string | null,
    subjectName: null as string | null,
    date: this.todayLocal()
  };

  private prefilledFromSchedule = false;

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
  rosterError: string | null = null;
  bulkOverwrite: { status: 'PRESENT' | 'ABSENT'; count: number } | null = null;

  ngOnInit(): void {
    this.prefillFromRoute();
    this.loadLookups();
  }

  ngOnDestroy(): void {
    this.revokePhotos(this.rows);
  }

  get classSelectOptions(): SelectOption[] {
    return this.classes.map(c => ({ label: c.name, value: c.id }));
  }

  get sectionSelectOptions(): SelectOption[] {
    return this.sections.map(s => ({ label: s.name, value: s.id }));
  }

  onClassChanged(): void {
    this.filters.sectionId = null;
    this.clearPeriodContext();
    this.prefilledFromSchedule = false;
    this.sections = [];
    this.recentSessions = [];
    this.resetRoster();
    this.loadSections();
  }

  onSectionChanged(): void {
    this.clearPeriodContext();
    this.prefilledFromSchedule = false;
    this.resetRoster();
  }

  onDateChanged(): void {
    this.resetRoster();
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
          this.filters.academicYearId ??= preferred.id;
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
          if (this.filters.classId == null) {
            this.selectAssignedClass(yearId);
          } else if (this.prefilledFromSchedule) {
            this.loadSections(true);
          } else {
            this.loadSections();
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loading = false; this.cdr.markForCheck(); }
      });
  }

  /** Defaults to the first class/section assigned to the signed-in teacher; users without assignments pick manually. */
  private selectAssignedClass(yearId: number): void {
    this.academicsMe.myClasses(yearId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          const first = data?.classes?.[0];
          if (!first || this.filters.classId != null) { return; }
          this.filters.classId = first.classId;
          this.filters.sectionId = first.sectionId;
          this.loadSections(true);
          this.cdr.markForCheck();
        },
        error: () => { /* no teacher assignments: selection stays manual */ }
      });
  }

  private loadSections(loadPrefilledRoster = false): void {
    const classId = this.filters.classId;
    if (classId == null) { this.sections = []; this.cdr.markForCheck(); return; }
    this.api.getSectionsByClass(classId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: sections => {
          this.sections = sections;
          if (loadPrefilledRoster && this.filters.sectionId != null
              && sections.some(section => section.id === this.filters.sectionId)) {
            this.loadRoster();
          }
          this.cdr.markForCheck();
        },
        error: () => { this.sections = []; this.cdr.markForCheck(); }
      });
  }

  loadRoster(): void {
    const classId = this.filters.classId;
    if (classId == null || !this.filters.date) { this.resetRoster(); return; }
    this.rosterLoading = true;
    this.rosterError = null;
    this.saveError = null;
    this.api.getRoster(classId, this.filters.sectionId, this.filters.date, this.filters.periodId)
      .pipe(finalize(() => { this.rosterLoading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: roster => {
          this.revokePhotos(this.rows);
          this.roster = roster;
          this.rows = roster?.students ?? [];
          this.bulkOverwrite = null;
          this.loadPhotos(this.rows);
          this.loadHistory();
          this.cdr.markForCheck();
        },
        error: err => {
          this.revokePhotos(this.rows);
          this.roster = null;
          this.rows = [];
          this.recentSessions = [];
          this.rosterError = err?.status === 403 && this.isTeachingStaff()
            ? this.scheduleAccessMessage()
            : extractApiError(err, 'Unable to load the attendance roster.').message;
          this.cdr.markForCheck();
        }
      });
  }

  /** Five most recent attendance records for the loaded class (newest first). */
  loadHistory(): void {
    const classId = this.filters.classId;
    if (classId == null) { this.recentSessions = []; this.cdr.markForCheck(); return; }
    const to = this.todayLocal();
    const from = this.daysBefore(to, 120);
    this.sessionsLoading = true;
    this.api.getSessions(from, to, classId, this.filters.sectionId, 5)
      .pipe(finalize(() => { this.sessionsLoading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: sessions => { this.recentSessions = sessions ?? []; this.cdr.markForCheck(); },
        error: () => { this.recentSessions = []; this.cdr.markForCheck(); }
      });
  }

  /** Totals for the Mark Attendance tiles and class donut (LATE counts as present, matching the saved record). */
  get markCounts(): { total: number; present: number; absent: number; rate: number } {
    const total = this.rows.length;
    const present = this.rows.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absent = this.rows.filter(r => r.status === 'ABSENT').length;
    const rate = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, rate };
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

  get canMarkAttendance(): boolean {
    if (this.readOnly) { return false; }
    if (!this.roster) { return false; }
    if (this.roster.frozen) { return false; }
    if (!this.roster.attendanceRequired) { return false; }
    if (!this.roster.editable) { return false; }
    return this.roster.attendanceMode === 'DAILY' || this.filters.periodId != null;
  }

  get markingBlockReason(): string | null {
    const r = this.roster;
    if (!r) { return null; }
    if (r.frozen) { return `Attendance is frozen for this date and cannot be modified.`; }
    if (!r.attendanceRequired) {
      const reason = r.holiday ? (r.holidayName ? `holiday — ${r.holidayName}` : 'holiday') : 'weekend';
      return `This date is a ${reason}. Attendance cannot be marked.`;
    }
    if (!r.editable) {
      return r.editabilityReason || 'This date can no longer be edited under the attendance editing policy.';
    }
    if (r.attendanceMode === 'PERIOD_WISE' && this.filters.periodId == null) {
      return 'Choose a scheduled period from your timetable before marking attendance.';
    }
    return null;
  }

  get readOnly(): boolean {
    return this.permissions.isLoaded() && !this.permissions.canManage(this.menuCode);
  }

  private isTeachingStaff(): boolean {
    return (this.login.getUser()?.roles ?? []).some(role =>
      ['STAFF', 'TEACHER'].includes(role.replace(/^ROLE_/, '').toUpperCase())
    );
  }

  /** Marks every row; rows already marked with a different status require overwrite confirmation. */
  requestMarkAll(status: 'PRESENT' | 'ABSENT'): void {
    if (!this.canMarkAttendance || !this.rows.length) { return; }
    const overwriteCount = this.rows.filter(r => r.status && r.status !== status).length;
    if (overwriteCount > 0) {
      this.bulkOverwrite = { status, count: overwriteCount };
      this.cdr.markForCheck();
      return;
    }
    this.applyMarkAll(status);
  }

  confirmMarkAll(): void {
    if (!this.bulkOverwrite) { return; }
    this.applyMarkAll(this.bulkOverwrite.status);
  }

  cancelMarkAll(): void {
    this.bulkOverwrite = null;
    this.cdr.markForCheck();
  }

  private applyMarkAll(status: 'PRESENT' | 'ABSENT'): void {
    this.rows.forEach(r => { r.status = status; });
    this.bulkOverwrite = null;
    this.saveError = null;
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
    if (this.saving || this.confirmSummary.total === 0 || this.filters.classId == null) { return; }
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
    const payload = {
      academicYearId: this.filters.academicYearId,
      classId: this.filters.classId,
      sectionId: this.filters.sectionId,
      attendanceDate: this.filters.date,
      entries
    };
    const request$ = this.roster?.attendanceMode === 'PERIOD_WISE'
      ? this.api.markPeriod({
        ...payload,
        periodId: this.filters.periodId!,
        periodNumber: this.filters.periodNumber,
        periodName: this.filters.periodName,
        subjectName: this.filters.subjectName
      })
      : this.api.markDaily(payload);
    request$
      .pipe(finalize(() => { this.saving = false; this.showConfirm = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Saved', detail: `Attendance marked for ${entries.length} students.` });
          this.loadRoster();
        },
        error: (err) => {
          this.saveError = extractApiError(err, 'Attendance could not be saved. Your entries were kept.').message;
          this.messages.add({ severity: 'error', summary: 'Save failed', detail: this.saveError });
          this.cdr.markForCheck();
        }
      });
  }

  /** Loads a history record's date into the roster; editability comes from the backend policy. */
  viewSession(session: StudentSession): void {
    this.filters.date = session.date;
    this.filters.classId = session.classId;
    this.filters.sectionId = session.sectionId ?? null;
    if (session.className && !this.classes.some(c => c.id === session.classId)) {
      this.classes = [...this.classes, { id: session.classId, name: session.className }];
    }
    this.resetRoster();
    this.loadSections();
    this.loadRoster();
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

  photoFor(row: RosterStudent): string | null {
    return row.photoObjectUrl ?? null;
  }

  /** Loads each student's PHOTO through the authenticated download endpoint (blob → object URL). */
  private loadPhotos(rows: RosterStudent[]): void {
    for (const row of rows) {
      if (row.photoDocumentId == null) { continue; }
      this.api.downloadStudentPhoto(row.photoDocumentId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: blob => {
            if (!this.rows.includes(row)) { return; }
            row.photoObjectUrl = URL.createObjectURL(blob);
            this.cdr.markForCheck();
          },
          error: () => { row.photoObjectUrl = null; }
        });
    }
  }

  private revokePhotos(rows: RosterStudent[]): void {
    for (const row of rows) {
      if (row.photoObjectUrl) {
        URL.revokeObjectURL(row.photoObjectUrl);
        row.photoObjectUrl = null;
      }
    }
  }

  private resetRoster(): void {
    this.revokePhotos(this.rows);
    this.roster = null;
    this.rows = [];
    this.showConfirm = false;
    this.saveError = null;
    this.copyError = null;
    this.rosterError = null;
    this.bulkOverwrite = null;
  }

  private clearPeriodContext(): void {
    this.filters.periodId = null;
    this.filters.periodNumber = null;
    this.filters.periodName = null;
    this.filters.subjectName = null;
  }

  private scheduleAccessMessage(): string {
    const className = this.classes.find(item => item.id === this.filters.classId)?.name ?? 'this class';
    const sectionName = this.sections.find(item => item.id === this.filters.sectionId)?.name;
    const section = sectionName ? `-${sectionName}` : '';
    return `Your timetable does not authorize attendance for ${className}${section} on this date. Choose one of today's assigned classes from your dashboard or contact your administrator.`;
  }

  private prefillFromRoute(): void {
    const params = this.route.snapshot.queryParamMap;
    const date = params.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      this.filters.date = date;
    }
    const academicYearId = params.get('academicYearId');
    if (academicYearId && !Number.isNaN(Number(academicYearId))) {
      this.filters.academicYearId = Number(academicYearId);
    }
    const classId = params.get('classId');
    if (classId && !Number.isNaN(Number(classId))) {
      this.filters.classId = Number(classId);
    }
    const sectionId = params.get('sectionId');
    if (sectionId && !Number.isNaN(Number(sectionId))) {
      this.filters.sectionId = Number(sectionId);
    }
    const periodId = params.get('periodId');
    if (periodId && !Number.isNaN(Number(periodId))) {
      this.filters.periodId = Number(periodId);
    }
    const periodNumber = params.get('periodNumber');
    if (periodNumber && !Number.isNaN(Number(periodNumber))) {
      this.filters.periodNumber = Number(periodNumber);
    }
    this.filters.periodName = params.get('periodName');
    this.filters.subjectName = params.get('subjectName');
    this.prefilledFromSchedule = this.filters.classId != null && this.filters.sectionId != null;
  }

  private todayLocal(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private daysBefore(date: string, days: number): string {
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(y, m - 1, d - days);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  }
}