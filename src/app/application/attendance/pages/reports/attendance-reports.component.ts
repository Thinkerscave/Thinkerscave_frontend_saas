import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasTabsComponent,
  SaasFilterRowComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';
import { SchoolOperationsDataService } from '../../../school-operations/services/school-operations-data.service';
import { AttendanceWorkspaceData } from '../../../school-operations/models/school-operations.model';

interface DefaulterRow { roll: number; name: string; className: string; pct: number; absent: number; }

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent, SaasTabsComponent, SaasFilterRowComponent, SaasPillComponent],
  templateUrl: './attendance-reports.component.html',
  styleUrl: './attendance-reports.component.scss'
})
export class AttendanceReportsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dataService = inject(SchoolOperationsDataService);

  data: AttendanceWorkspaceData = this.empty();
  loading = true;

  filters = {
    reportType: 'student',
    fromDate: this.dataService.dateBeforeDays(30),
    toDate: this.dataService.today(),
    classId: 'all',
    sectionName: 'all'
  };

  activeTab = 'summary';
  readonly tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'trend', label: 'Monthly Trend' },
    { key: 'comparison', label: 'Class Comparison' },
    { key: 'defaulter', label: 'Defaulter Report' },
    { key: 'staff', label: 'Staff Attendance' }
  ];

  defaulterThreshold = 75;

  constructor() {}

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.loading = true;
    this.dataService.loadAttendanceWorkspace()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: data => this.data = data, error: () => this.data = this.empty() });
  }

  reset(): void {
    this.filters = { reportType: 'student', fromDate: this.dataService.dateBeforeDays(30), toDate: this.dataService.today(), classId: 'all', sectionName: 'all' };
  }

  get summary() {
    const records = this.data.todayClassAttendance;
    const present = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const total = Math.max(this.data.students.length, 1);
    const presentPct = Math.round((present / total) * 1000) / 10;
    const absentPct = Math.round((absent / total) * 1000) / 10;
    return { present, absent, total: this.data.students.length, presentPct, absentPct, avgPct: presentPct };
  }

  get donutGradient(): string {
    const p = this.summary.presentPct;
    return `conic-gradient(var(--saas-success) 0 ${p}%, var(--saas-danger) ${p}% 100%)`;
  }

  get trendPoints(): { label: string; v: number }[] {
    return this.data.trends.slice(0, 12).map(t => ({ label: t.label, v: Math.max(20, t.studentRate) }));
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

  get defaulters(): DefaulterRow[] {
    const grouped = new Map<string, { name: string; className: string; total: number; present: number; absent: number; }>();
    this.data.todayClassAttendance.forEach(r => {
      const key = String(r.referenceId ?? r.referenceName);
      const e = grouped.get(key) ?? { name: r.referenceName, className: r.className || '-', total: 0, present: 0, absent: 0 };
      e.total += 1;
      if (r.status === 'PRESENT' || r.status === 'LATE') e.present += 1;
      if (r.status === 'ABSENT') e.absent += 1;
      grouped.set(key, e);
    });
    return Array.from(grouped.values()).map((e, i) => ({
      roll: i + 1,
      name: e.name,
      className: e.className,
      pct: Math.round((e.present / Math.max(e.total, 1)) * 100),
      absent: e.absent
    })).filter(r => r.pct < this.defaulterThreshold).sort((a, b) => a.pct - b.pct).slice(0, 10);
  }

  get classComparison(): { className: string; pct: number; tone: string }[] {
    const grouped = new Map<string, { total: number; present: number; }>();
    this.data.todayClassAttendance.forEach(r => {
      const key = r.className || 'Unassigned';
      const e = grouped.get(key) ?? { total: 0, present: 0 };
      e.total += 1;
      if (r.status === 'PRESENT' || r.status === 'LATE') e.present += 1;
      grouped.set(key, e);
    });
    return Array.from(grouped.entries()).map(([className, e]) => {
      const pct = Math.round((e.present / Math.max(e.total, 1)) * 100);
      const tone = pct >= 90 ? 'success' : pct >= 75 ? 'warning' : 'danger';
      return { className, pct, tone };
    }).sort((a, b) => b.pct - a.pct);
  }

  readonly quickReports = [
    { label: 'Individual Student Report', icon: 'pi pi-user' },
    { label: 'Class Attendance Report', icon: 'pi pi-th-large' },
    { label: 'Staff Attendance Report', icon: 'pi pi-id-card' },
    { label: 'Daily Attendance Sheet', icon: 'pi pi-calendar' }
  ];

  exportPdf(): void { window.print(); }

  private empty(): AttendanceWorkspaceData {
    return {
      today: this.dataService.today(), students: [], staff: [], classes: [], sections: [], departments: [], branches: [],
      todayClassAttendance: [], todayStaffAttendance: [], trends: []
    };
  }
}
