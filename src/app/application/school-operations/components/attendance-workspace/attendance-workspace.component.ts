import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject , ChangeDetectionStrategy} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import {
  ActivityItem,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceTrendPoint,
  AttendanceWorkspaceData,
  KpiMetric,
  RosterAttendanceRow,
  StaffRecord,
  StudentRecord,
  AttendanceWorkspacePage
} from '../../models/school-operations.model';
import { SchoolOperationsDataService } from '../../services/school-operations-data.service';
import {
  OpsHeaderComponent,
  OpsKpiCardComponent,
  OpsNavComponent,
  OpsNavItem,
  OpsTimelineComponent
} from '../shared/operations-primitives.component';

@Component({
  selector: 'app-attendance-workspace',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    OpsNavComponent,
    OpsHeaderComponent,
    OpsKpiCardComponent,
    OpsTimelineComponent
  ],
  templateUrl: './attendance-workspace.component.html'
})
export class AttendanceWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(SchoolOperationsDataService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly navItems: OpsNavItem[] = [
    { label: 'Dashboard', description: 'Daily attendance command view', route: '/app/attendance/dashboard', icon: 'pi pi-chart-line' },
    { label: 'Student Attendance', description: 'Class roster marking', route: '/app/attendance/students', icon: 'pi pi-users' },
    { label: 'Staff Attendance', description: 'Workforce roster marking', route: '/app/attendance/staff', icon: 'pi pi-id-card' },
    { label: 'Reports', description: 'Attendance analytics and exports', route: '/app/attendance/reports', icon: 'pi pi-chart-bar' },
    { label: 'Settings', description: 'Attendance rules and freeze policy', route: '/app/attendance/settings', icon: 'pi pi-cog' }
  ];

  readonly studentStatuses: { label: string; value: AttendanceStatus; icon: string }[] = [
    { label: 'Present', value: 'PRESENT', icon: 'pi pi-check' },
    { label: 'Absent', value: 'ABSENT', icon: 'pi pi-times' },
    { label: 'Leave', value: 'EXCUSED', icon: 'pi pi-calendar-minus' },
    { label: 'Late', value: 'LATE', icon: 'pi pi-clock' }
  ];

  readonly staffStatuses: { label: string; value: AttendanceStatus; icon: string }[] = [
    { label: 'Present', value: 'PRESENT', icon: 'pi pi-check' },
    { label: 'Absent', value: 'ABSENT', icon: 'pi pi-times' },
    { label: 'Leave', value: 'ON_LEAVE', icon: 'pi pi-calendar-minus' },
    { label: 'WFH', value: 'WFH', icon: 'pi pi-home' },
    { label: 'Half Day', value: 'HALF_DAY', icon: 'pi pi-clock' }
  ];

  data: AttendanceWorkspaceData = this.emptyData();
  activePage: AttendanceWorkspacePage = 'dashboard';
  loading = true;
  rosterLoading = false;
  saving = false;
  studentRows: RosterAttendanceRow[] = [];
  staffRows: RosterAttendanceRow[] = [];

  studentFilters = {
    date: this.dataService.today(),
    classId: 'all',
    sectionName: 'all'
  };

  staffFilters = {
    date: this.dataService.today(),
    department: 'all',
    branch: 'all',
    shift: 'Morning'
  };

  reportFilters = {
    scope: 'students' as 'students' | 'staff',
    fromDate: this.dataService.dateBeforeDays(30),
    toDate: this.dataService.today(),
    classId: 'all',
    department: 'all',
    threshold: 75
  };

  settings = {
    attendanceMode: 'DAILY' as 'DAILY' | 'PERIOD_WISE',
    schoolStartTime: '08:30',
    schoolEndTime: '14:30',
    lateArrivalAfter: '08:40',
    defaulterThreshold: 75,
    freezeAfterMinutes: 120,
    allowCorrectionRequest: true,
    notifyOnLowAttendance: false,
    notifyOnTeacherAbsence: true
  };

  settingsSaving = false;

  ngOnInit(): void {
    this.loadStoredSettings();
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.activePage = (data['workspacePage'] as AttendanceWorkspacePage | undefined) ?? 'dashboard';
      if (!this.loading) {
        this.loadActiveRoster();
      }
      this.cdr.markForCheck();
    });
    this.refresh();
  }

  get metrics(): KpiMetric[] {
    const studentRate = this.percent(this.presentCount(this.data.todayClassAttendance), Math.max(this.data.students.length, 1));
    const staffRate = this.percent(this.presentCount(this.data.todayStaffAttendance), Math.max(this.data.staff.length, 1));
    const absentStudents = this.data.todayClassAttendance.filter(item => item.status === 'ABSENT').length;
    const absentStaff = this.data.todayStaffAttendance.filter(item => item.status === 'ABSENT').length;
    const lateEntries = [...this.data.todayClassAttendance, ...this.data.todayStaffAttendance].filter(item => item.status === 'LATE' || item.status === 'HALF_DAY').length;
    const overallRate = this.percent(this.presentCount([...this.data.todayClassAttendance, ...this.data.todayStaffAttendance]), Math.max(this.data.students.length + this.data.staff.length, 1));

    return [
      { label: 'Student Attendance Today', value: `${studentRate}%`, helper: `${this.data.todayClassAttendance.length} marked of ${this.data.students.length}`, icon: 'pi pi-users', tone: studentRate >= 90 ? 'success' : 'warning' },
      { label: 'Staff Attendance Today', value: `${staffRate}%`, helper: `${this.data.todayStaffAttendance.length} marked of ${this.data.staff.length}`, icon: 'pi pi-id-card', tone: staffRate >= 90 ? 'success' : 'warning' },
      { label: 'Absent Students', value: absentStudents, helper: 'Marked absent today', icon: 'pi pi-user-minus', tone: absentStudents ? 'danger' : 'success' },
      { label: 'Absent Staff', value: absentStaff, helper: 'Workforce exceptions', icon: 'pi pi-exclamation-triangle', tone: absentStaff ? 'danger' : 'success' },
      { label: 'Late Entries', value: lateEntries, helper: 'Late or half day entries', icon: 'pi pi-clock', tone: lateEntries ? 'warning' : 'neutral' },
      { label: 'Attendance Rate', value: `${overallRate}%`, helper: 'Students and staff combined', icon: 'pi pi-chart-line', tone: overallRate >= 90 ? 'success' : 'warning' }
    ];
  }

  get availableSections(): string[] {
    const names = this.data.students
      .filter(student => this.studentFilters.classId === 'all' || String(student.classId ?? '') === this.studentFilters.classId)
      .map(student => student.sectionName)
      .filter((section): section is string => Boolean(section));
    return Array.from(new Set(names)).sort();
  }

  get shiftOptions(): string[] {
    const shifts = Array.from(new Set(this.data.todayStaffAttendance.map(item => item.shift).filter((shift): shift is string => Boolean(shift))));
    return shifts.length ? shifts : ['Morning'];
  }

  get attendanceActivities(): ActivityItem[] {
    const studentItems = this.data.todayClassAttendance.slice(0, 4).map(item => this.toActivity(item));
    const staffItems = this.data.todayStaffAttendance.slice(0, 4).map(item => this.toActivity(item));
    return [...studentItems, ...staffItems].slice(0, 8);
  }

  get lowAttendanceClasses(): { className: string; rate: number; absent: number }[] {
    const grouped = new Map<string, AttendanceRecord[]>();
    this.data.todayClassAttendance.forEach(item => {
      const key = item.className || 'Unassigned class';
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });

    return Array.from(grouped.entries())
      .map(([className, records]) => ({ className, rate: this.percent(this.presentCount(records), records.length), absent: records.filter(item => item.status === 'ABSENT').length }))
      .filter(item => item.rate < 90 || item.absent > 0)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 5);
  }

  get absenceAlerts(): AttendanceRecord[] {
    return [...this.data.todayClassAttendance, ...this.data.todayStaffAttendance]
      .filter(item => item.status === 'ABSENT' || item.status === 'ON_LEAVE' || item.status === 'EXCUSED')
      .slice(0, 6);
  }

  refresh(): void {
    this.loading = true;
    this.dataService.loadAttendanceWorkspace()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.data = data;
          this.loadActiveRoster();
        },
        error: () => {
          this.data = this.emptyData();
          this.messageService.add({ severity: 'error', summary: 'Attendance workspace unavailable', detail: 'Unable to load attendance records.' });
        }
      });
  }

  loadStudentRoster(): void {
    this.rosterLoading = true;
    this.dataService.loadStudentRoster(this.studentFilters)
      .pipe(finalize(() => {
        this.rosterLoading = false;
        this.cdr.markForCheck();
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: rows => this.studentRows = rows,
        error: () => this.messageService.add({ severity: 'error', summary: 'Roster unavailable', detail: 'Unable to load student roster.' })
      });
  }

  loadStaffRoster(): void {
    this.rosterLoading = true;
    this.dataService.loadStaffRoster(this.staffFilters)
      .pipe(finalize(() => {
        this.rosterLoading = false;
        this.cdr.markForCheck();
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: rows => this.staffRows = rows,
        error: () => this.messageService.add({ severity: 'error', summary: 'Roster unavailable', detail: 'Unable to load staff roster.' })
      });
  }

  markAll(rows: RosterAttendanceRow[], status: AttendanceStatus): void {
    rows.forEach(row => row.status = status);
  }

  markSelected(rows: RosterAttendanceRow[], status: AttendanceStatus): void {
    rows.filter(row => row.selected).forEach(row => row.status = status);
  }

  clearSelection(rows: RosterAttendanceRow[]): void {
    rows.forEach(row => row.selected = false);
  }

  setRowStatus(row: RosterAttendanceRow, status: AttendanceStatus): void {
    row.status = status;
  }

  submitStudentAttendance(): void {
    this.submitAttendance(this.studentRows, 'CLASS');
  }

  submitStaffAttendance(): void {
    this.submitAttendance(this.staffRows, 'STAFF');
  }

  openStudents(): void {
    void this.router.navigateByUrl('/app/attendance/students');
  }

  openStaff(): void {
    void this.router.navigateByUrl('/app/attendance/staff');
  }

  exportAttendanceReport(): void {
    const rows = [...this.data.todayClassAttendance, ...this.data.todayStaffAttendance].map(record => [
      record.attendanceType,
      record.referenceName,
      record.className ?? record.department ?? '',
      record.sectionName ?? record.shift ?? '',
      record.status,
      record.attendanceDate,
      record.remarks ?? ''
    ]);
    const csv = [['Type', 'Name', 'Group', 'Section/Shift', 'Status', 'Date', 'Remarks'], ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `attendance-report-${this.data.today}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  rowSummary(rows: RosterAttendanceRow[], status: AttendanceStatus): number {
    return rows.filter(row => row.status === status).length;
  }

  selectedCount(rows: RosterAttendanceRow[]): number {
    return rows.filter(row => row.selected).length;
  }

  trendHeight(point: AttendanceTrendPoint, key: 'studentRate' | 'staffRate'): number {
    return Math.max(point[key], 4);
  }

  statusLabel(status: AttendanceStatus): string {
    const labels: Record<AttendanceStatus, string> = {
      PRESENT: 'Present',
      ABSENT: 'Absent',
      LATE: 'Late',
      EXCUSED: 'Leave',
      WFH: 'WFH',
      ON_LEAVE: 'Leave',
      NIGHT_OUT: 'Night Out',
      HALF_DAY: 'Half Day'
    };
    return labels[status];
  }

  statusTone(status: AttendanceStatus): string {
    if (this.isPresentLike(status)) {
      return 'success';
    }
    if (status === 'ABSENT') {
      return 'danger';
    }
    return 'warning';
  }

  fullStudentName(student: StudentRecord): string {
    return [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ').trim() || 'Student';
  }

  fullStaffName(staff: StaffRecord): string {
    return [staff.firstName, staff.middleName, staff.lastName].filter(Boolean).join(' ').trim() || staff.email || 'Staff member';
  }

  trackByRow(_: number, row: RosterAttendanceRow): number {
    return row.referenceId;
  }

  trackByRecord(_: number, record: AttendanceRecord): number | string {
    return record.id ?? `${record.attendanceType}-${record.referenceName}-${record.attendanceDate}`;
  }

  private loadActiveRoster(): void {
    if (this.activePage === 'students') {
      this.loadStudentRoster();
    }
    if (this.activePage === 'staff') {
      this.loadStaffRoster();
    }
  }

  private submitAttendance(rows: RosterAttendanceRow[], type: 'CLASS' | 'STAFF'): void {
    if (!rows.length) {
      this.messageService.add({ severity: 'warn', summary: 'Roster empty', detail: 'Load a roster before submitting attendance.' });
      return;
    }

    this.saving = true;
    this.dataService.saveAttendanceBatch(rows, type)
      .pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Attendance submitted', detail: `${rows.length} ${type === 'CLASS' ? 'student' : 'staff'} records saved.` });
          this.refresh();
        },
        error: error => this.messageService.add({ severity: 'error', summary: 'Submit failed', detail: this.errorMessage(error) })
      });
  }

  private presentCount(records: AttendanceRecord[]): number {
    return records.filter(item => this.isPresentLike(item.status)).length;
  }

  private percent(value: number, total: number): number {
    if (!total) {
      return 0;
    }
    return Math.round((value / total) * 100);
  }

  private isPresentLike(status: AttendanceStatus): boolean {
    return status === 'PRESENT' || status === 'LATE' || status === 'WFH' || status === 'HALF_DAY';
  }

  private toActivity(record: AttendanceRecord): ActivityItem {
    const group = record.attendanceType === 'CLASS' ? `${record.className ?? 'Class'} ${record.sectionName ?? ''}`.trim() : record.department ?? 'Staff';
    return {
      title: `${this.statusLabel(record.status)} marked`,
      description: `${record.referenceName} in ${group}`,
      meta: record.markedBy ? `Marked by ${record.markedBy}` : record.attendanceDate,
      icon: record.attendanceType === 'CLASS' ? 'pi pi-users' : 'pi pi-id-card',
      tone: this.statusTone(record.status) as ActivityItem['tone']
    };
  }

  private emptyData(): AttendanceWorkspaceData {
    return {
      today: this.dataService.today(),
      students: [],
      staff: [],
      classes: [],
      sections: [],
      departments: [],
      branches: [],
      todayClassAttendance: [],
      todayStaffAttendance: [],
      trends: []
    };
  }

  private errorMessage(error: unknown): string {
    const candidate = error as { error?: { message?: string }; message?: string };
    return candidate.error?.message ?? candidate.message ?? 'Please try again.';
  }

  // ============ Reports ============

  get reportRows(): ReportRow[] {
    const source: AttendanceRecord[] = this.reportFilters.scope === 'staff'
      ? this.data.todayStaffAttendance
      : this.data.todayClassAttendance;

    const grouped = new Map<string, AttendanceRecord[]>();
    source.forEach(record => {
      const key = `${record.referenceId ?? record.referenceName}|${record.referenceName}`;
      grouped.set(key, [...(grouped.get(key) ?? []), record]);
    });

    return Array.from(grouped.entries()).map(([key, records]) => {
      const referenceName = key.split('|')[1] || 'Unknown';
      const total = records.length || 1;
      const present = records.filter(r => this.isPresentLike(r.status)).length;
      const absent = records.filter(r => r.status === 'ABSENT').length;
      const late = records.filter(r => r.status === 'LATE' || r.status === 'HALF_DAY').length;
      const rate = Math.round((present / total) * 100);
      const meta = this.reportFilters.scope === 'staff'
        ? (records[0]?.department ?? '-')
        : `${records[0]?.className ?? ''} ${records[0]?.sectionName ?? ''}`.trim();
      return { referenceName, meta, present, absent, late, total, rate };
    }).sort((a, b) => a.rate - b.rate);
  }

  get reportDefaulters(): ReportRow[] {
    return this.reportRows.filter(row => row.rate < this.reportFilters.threshold);
  }

  exportReportsCsv(): void {
    const rows = [
      ['Name', this.reportFilters.scope === 'staff' ? 'Department' : 'Class', 'Present', 'Absent', 'Late', 'Total', 'Attendance %'],
      ...this.reportRows.map(r => [r.referenceName, r.meta, r.present, r.absent, r.late, r.total, `${r.rate}%`])
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `attendance-${this.reportFilters.scope}-${this.reportFilters.fromDate}-to-${this.reportFilters.toDate}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  averageRate(rows: ReportRow[]): number {
    if (!rows.length) { return 0; }
    return Math.round(rows.reduce((sum, r) => sum + r.rate, 0) / rows.length);
  }

  trackByName(_: number, row: ReportRow): string {
    return row.referenceName;
  }

  // ============ Settings ============

  saveSettings(): void {
    this.settingsSaving = true;
    try {
      localStorage.setItem('tc.attendance.settings', JSON.stringify(this.settings));
      this.messageService.add({ severity: 'success', summary: 'Settings saved', detail: 'Attendance configuration updated.' });
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Save failed', detail: 'Unable to persist settings.' });
    } finally {
      this.settingsSaving = false;
      this.cdr.markForCheck();
    }
  }

  resetSettings(): void {
    this.settings = {
      attendanceMode: 'DAILY',
      schoolStartTime: '08:30',
      schoolEndTime: '14:30',
      lateArrivalAfter: '08:40',
      defaulterThreshold: 75,
      freezeAfterMinutes: 120,
      allowCorrectionRequest: true,
      notifyOnLowAttendance: false,
      notifyOnTeacherAbsence: true
    };
    this.messageService.add({ severity: 'info', summary: 'Settings reset', detail: 'Restored default attendance configuration.' });
  }

  private loadStoredSettings(): void {
    try {
      const stored = localStorage.getItem('tc.attendance.settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch { /* ignore */ }
  }
}

export interface ReportRow {
  referenceName: string;
  meta: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}
