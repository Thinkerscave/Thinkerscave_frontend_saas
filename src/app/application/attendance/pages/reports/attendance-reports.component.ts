import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasTabsComponent,
  SaasFilterRowComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';
import { SchoolOperationsDataService } from '../../../school-operations/services/school-operations-data.service';
import {
  AttendanceClassSummaryRow,
  AttendanceDefaulterRow,
  AttendanceMonthlyTrendRow,
  AttendanceSummaryReport,
  ClassRecord,
  StaffAttendanceReportRow
} from '../../../school-operations/models/school-operations.model';

interface SelectOption { label: string; value: string; }

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasTabsComponent,
    SaasFilterRowComponent,
    SaasPillComponent
  ],
  templateUrl: './attendance-reports.component.html',
  styleUrl: './attendance-reports.component.scss'
})
export class AttendanceReportsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dataService = inject(SchoolOperationsDataService);

  loading = true;
  errorMessage = '';
  classes: ClassRecord[] = [];
  report: AttendanceSummaryReport | null = null;
  staffRows: StaffAttendanceReportRow[] = [];

  filters = {
    reportType: 'student',
    fromDate: this.dataService.dateBeforeDays(30),
    toDate: this.dataService.today(),
    classId: 'all',
    sectionName: 'all'
  };

  readonly reportTypeOptions: SelectOption[] = [
    { label: 'Student Attendance', value: 'student' },
    { label: 'Staff Attendance', value: 'staff' }
  ];

  activeTab = 'summary';
  readonly tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'trend', label: 'Monthly Trend' },
    { key: 'comparison', label: 'Class Comparison' },
    { key: 'defaulter', label: 'Defaulter Report' },
    { key: 'staff', label: 'Staff Attendance' }
  ];

  defaulterThreshold = 75;

  ngOnInit(): void {
    this.dataService.loadAttendanceWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.classes = data.classes ?? [];
          this.cdr.markForCheck();
        },
        error: () => { this.classes = []; }
      });
    this.refresh();
  }

  get classSelectOptions(): SelectOption[] {
    return [
      { label: 'All Classes', value: 'all' },
      ...this.classes.map(c => ({ label: c.className, value: String(c.classId) }))
    ];
  }

  get sectionSelectOptions(): SelectOption[] {
    return [{ label: 'All Sections', value: 'all' }];
  }

  refresh(): void {
    this.loading = true;
    this.errorMessage = '';
    const classId = this.filters.classId !== 'all' ? Number(this.filters.classId) : null;
    const payload = {
      fromDate: this.filters.fromDate,
      toDate: this.filters.toDate,
      classId,
      defaulterThreshold: this.defaulterThreshold
    };

    forkJoin({
      summary: this.dataService.getAttendanceSummaryReport(payload),
      staff: this.dataService.getStaffAttendanceReport(payload)
    }).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ summary, staff }) => {
        this.report = summary;
        this.staffRows = staff ?? [];
        if (this.filters.reportType === 'staff') {
          this.activeTab = 'staff';
        }
      },
      error: () => {
        this.report = null;
        this.staffRows = [];
        this.errorMessage = 'Unable to load attendance reports for the selected filters.';
      }
    });
  }

  reset(): void {
    this.filters = {
      reportType: 'student',
      fromDate: this.dataService.dateBeforeDays(30),
      toDate: this.dataService.today(),
      classId: 'all',
      sectionName: 'all'
    };
    this.defaulterThreshold = 75;
    this.refresh();
  }

  get summary() {
    const trend = this.report?.monthlyTrend ?? [];
    let present = 0;
    let absent = 0;
    let late = 0;
    for (const row of trend) {
      const b = row.statusBreakdown ?? {};
      present += Number(b['PRESENT'] ?? 0);
      absent += Number(b['ABSENT'] ?? 0);
      late += Number(b['LATE'] ?? 0);
    }
    const presentLike = present + late;
    const totalMarks = presentLike + absent;
    const presentPct = this.report?.overallPercent
      ?? (totalMarks > 0 ? Math.round((presentLike / totalMarks) * 1000) / 10 : 0);
    const absentPct = totalMarks > 0 ? Math.round((absent / totalMarks) * 1000) / 10 : 0;
    return {
      present: presentLike,
      absent,
      total: this.report?.totalStudents ?? 0,
      presentPct,
      absentPct,
      avgPct: presentPct
    };
  }

  get donutGradient(): string {
    const p = Math.min(100, Math.max(0, this.summary.presentPct));
    return `conic-gradient(var(--saas-success) 0 ${p}%, var(--saas-danger) ${p}% 100%)`;
  }

  get trendPoints(): { label: string; v: number }[] {
    return (this.report?.monthlyTrend ?? []).map((t: AttendanceMonthlyTrendRow) => ({
      label: `${t.year}-${String(t.month).padStart(2, '0')}`,
      v: Math.max(0, Math.min(100, Number(t.avgAttendancePercent) || 0))
    }));
  }

  get trendPath(): string {
    const points = this.trendPoints;
    if (!points.length) return '';
    const w = 600, h = 160, pad = 20;
    const step = (w - 2 * pad) / Math.max(points.length - 1, 1);
    return points.map((p, i) => {
      const x = pad + step * i;
      const y = h - pad - ((p.v / 100) * (h - 2 * pad));
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }

  get defaulters(): Array<{ roll: string; name: string; className: string; pct: number; absent: number }> {
    return (this.report?.defaulters ?? []).map((d: AttendanceDefaulterRow) => ({
      roll: d.rollNumber || d.admissionNumber || String(d.studentId),
      name: d.studentName,
      className: [d.className, d.sectionName].filter(Boolean).join(' / ') || '—',
      pct: Math.round(Number(d.attendancePercent) || 0),
      absent: Math.max(0, (d.totalDays || 0) - (d.presentDays || 0))
    }));
  }

  get classComparison(): { className: string; pct: number; tone: string }[] {
    return (this.report?.classWiseSummary ?? []).map((row: AttendanceClassSummaryRow) => {
      const pct = Math.round(Number(row.avgAttendancePercent) || 0);
      const tone = pct >= 90 ? 'success' : pct >= 75 ? 'warning' : 'danger';
      const label = [row.className, row.sectionName].filter(Boolean).join(' / ');
      return { className: label || 'Unassigned', pct, tone };
    }).sort((a, b) => b.pct - a.pct);
  }

  exportPdf(): void { window.print(); }

  onThresholdChange(): void {
    this.refresh();
  }
}
