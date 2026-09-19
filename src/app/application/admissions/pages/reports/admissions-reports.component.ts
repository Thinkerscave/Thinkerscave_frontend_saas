import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize } from 'rxjs';

import {
  AdmissionReportDashboard,
  AdmissionReportFilter,
  CounselorOption,
  LookupOption
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';
import {
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  formatAdmissionsLabel
} from '../../data/admissions-workspace.config';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import {
  SaasPageHeaderComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';
import { TcAcademicYearSelectorComponent } from '../../../../shared/ui/academic-year-selector';

const APPLICATION_STATUS_OPTIONS = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'DOCUMENTS_PENDING',
  'FEE_PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ENROLLED'
] as const;

const CHART_COLORS = [
  '#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
  '#14b8a6', '#6366f1', '#ec4899', '#64748b', '#0ea5e9'
];

@Component({
  selector: 'app-admissions-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent,
    CommonModule,
    FormsModule,
    ChartModule,
    DropdownModule,
    SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent,
    SaasPillComponent,
    TcPageSkeletonComponent
  ],
  providers: [MessageService],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './admissions-reports.component.html'
})
export class AdmissionsReportsComponent {
  private readonly api = inject(AdmissionsCrmService);
  private readonly nav = inject(AdmissionsNavService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly leadStatusOptions = [
    { label: 'All lead statuses', value: null },
    ...LEAD_STATUS_OPTIONS.map(v => ({ label: formatAdmissionsLabel(v), value: v }))
  ];
  readonly sourceOptions = [
    { label: 'All sources', value: null },
    ...LEAD_SOURCE_OPTIONS.map(v => ({ label: formatAdmissionsLabel(v), value: v }))
  ];
  readonly applicationStatusOptions = [
    { label: 'All application statuses', value: null },
    ...APPLICATION_STATUS_OPTIONS.map(v => ({ label: formatAdmissionsLabel(v), value: v }))
  ];

  loading = true;
  exporting = false;
  errorMessage = '';
  dashboard: AdmissionReportDashboard | null = null;
  lastUpdated: Date | null = null;

  classes: LookupOption[] = [];
  counselors: CounselorOption[] = [];
  private chartsReady = false;

  filter: AdmissionReportFilter = {
    academicYearId: null,
    classId: null,
    source: null,
    counselorId: null,
    leadStatus: null,
    applicationStatus: null,
    dateFrom: null,
    dateTo: null,
    trendGranularity: 'MONTHLY',
    recentLimit: 15
  };

  trendData: Record<string, unknown> = {};
  trendOptions: Record<string, unknown> = {};
  sourceDonutData: Record<string, unknown> = {};
  leadStatusDonutData: Record<string, unknown> = {};
  appStatusDonutData: Record<string, unknown> = {};
  docDonutData: Record<string, unknown> = {};
  classBarData: Record<string, unknown> = {};
  doughnutOptions: Record<string, unknown> = {};
  barOptions: Record<string, unknown> = {};

  constructor() {
    this.api.searchCounselors('', 0, 100).subscribe({
      next: page => {
        this.counselors = page.content ?? [];
        this.cdr.markForCheck();
      }
    });
  }

  onAcademicYearChange(yearId: number | null): void {
    if (!this.chartsReady) {
      this.initChartOptions();
      this.chartsReady = true;
    }
    this.filter.academicYearId = yearId;
    this.filter.classId = null;
    this.classes = [];
    if (yearId == null) {
      this.dashboard = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.api.academicClasses(yearId).subscribe({
      next: classes => {
        this.classes = classes;
        this.cdr.markForCheck();
      }
    });
    this.load();
  }

  onYearChange(): void {
    this.filter.classId = null;
    this.classes = [];
    if (!this.filter.academicYearId) return;
    this.api.academicClasses(this.filter.academicYearId).subscribe({
      next: classes => {
        this.classes = classes;
        this.cdr.markForCheck();
      }
    });
  }

  applyFilters(): void {
    this.load();
  }

  resetFilters(): void {
    const yearId = this.filter.academicYearId;
    this.filter = {
      academicYearId: yearId,
      classId: null,
      source: null,
      counselorId: null,
      leadStatus: null,
      applicationStatus: null,
      dateFrom: null,
      dateTo: null,
      trendGranularity: this.filter.trendGranularity || 'MONTHLY',
      recentLimit: 15
    };
    this.onYearChange();
    this.load();
  }

  setTrendGranularity(value: 'WEEKLY' | 'MONTHLY'): void {
    this.filter.trendGranularity = value;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.reportsDashboard(this.filter)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: dash => {
          this.dashboard = dash;
          this.lastUpdated = dash.generatedAt ? new Date(dash.generatedAt) : new Date();
          this.buildCharts(dash);
        },
        error: () => {
          this.errorMessage = 'Unable to load admissions report.';
          this.messages.add({ severity: 'error', summary: 'Load failed', detail: this.errorMessage });
        }
      });
  }

  exportReport(): void {
    this.exporting = true;
    this.api.exportReportsCsv(this.filter)
      .pipe(finalize(() => {
        this.exporting = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'admissions-report.csv';
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.messages.add({
          severity: 'error',
          summary: 'Export failed',
          detail: 'Could not export the report.'
        })
      });
  }

  openApplication(row: { applicationId: number; status: string }): void {
    if (['DRAFT', 'ACTION_REQUIRED'].includes(row.status)) {
      this.nav.toApplication(row.applicationId, 'reports');
      return;
    }
    this.nav.toApplicationReview(row.applicationId, 'reports');
  }

  viewAllApplications(): void {
    void this.router.navigate(['/app/admissions/applications']);
  }

  formatLabel(value: string | null | undefined): string {
    return formatAdmissionsLabel(value || '');
  }

  deltaText(value: number | null | undefined, asPoints = false): string {
    if (value == null) return '';
    const sign = value > 0 ? '↑' : value < 0 ? '↓' : '→';
    const abs = Math.abs(value).toFixed(1);
    return asPoints ? `${sign} ${abs} pts` : `${sign} ${abs}%`;
  }

  deltaTone(value: number | null | undefined): 'up' | 'down' | 'flat' {
    if (value == null || value === 0) return 'flat';
    return value > 0 ? 'up' : 'down';
  }

  statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    switch (status) {
      case 'APPROVED':
      case 'ENROLLED':
        return 'success';
      case 'REJECTED':
      case 'CANCELLED':
        return 'danger';
      case 'ACTION_REQUIRED':
      case 'DOCUMENTS_PENDING':
        return 'warning';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'info';
      default:
        return 'neutral';
    }
  }

  funnelWidth(count: number): string {
    const max = this.dashboard?.funnel?.[0]?.count || 1;
    const pct = Math.max(8, Math.round((count / Math.max(max, 1)) * 100));
    return `${pct}%`;
  }

  private initChartOptions(): void {
    this.doughnutOptions = {
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx: { label?: string; parsed?: number }) => `${ctx.label}: ${ctx.parsed}` } }
      },
      maintainAspectRatio: false
    };
    this.barOptions = {
      indexAxis: 'y' as const,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(148,163,184,.25)' } },
        y: { grid: { display: false } }
      },
      maintainAspectRatio: false
    };
    this.trendOptions = {
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(148,163,184,.25)' } }
      },
      maintainAspectRatio: false
    };
  }

  private buildCharts(dash: AdmissionReportDashboard): void {
    const trend = dash.trend;
    this.trendData = {
      labels: trend?.labels ?? [],
      datasets: [
        { label: 'Inquiries', data: trend?.inquiries ?? [], borderColor: '#2563eb', tension: 0.35, fill: false },
        { label: 'Leads', data: trend?.leads ?? [], borderColor: '#10b981', tension: 0.35, fill: false },
        { label: 'Applications', data: trend?.applications ?? [], borderColor: '#8b5cf6', tension: 0.35, fill: false },
        { label: 'Approved', data: trend?.approved ?? [], borderColor: '#f59e0b', tension: 0.35, fill: false },
        { label: 'Enrolled', data: trend?.enrolled ?? [], borderColor: '#14b8a6', tension: 0.35, fill: false }
      ]
    };

    this.sourceDonutData = this.toDonut(
      dash.leadsBySource.map(r => r.label),
      dash.leadsBySource.map(r => r.leads)
    );
    this.leadStatusDonutData = this.toDonut(
      dash.leadsByStatus.map(r => r.label),
      dash.leadsByStatus.map(r => r.count)
    );
    this.appStatusDonutData = this.toDonut(
      dash.applicationStatus.map(r => r.label),
      dash.applicationStatus.map(r => r.count)
    );
    this.docDonutData = this.toDonut(
      dash.documentVerification.map(r => r.label),
      dash.documentVerification.map(r => r.count)
    );
    this.classBarData = {
      labels: dash.applicationsByClass.map(r => r.label),
      datasets: [{
        data: dash.applicationsByClass.map(r => r.count),
        backgroundColor: '#2563eb',
        borderRadius: 6,
        barThickness: 14
      }]
    };
  }

  private toDonut(labels: string[], values: number[]): Record<string, unknown> {
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 0
      }]
    };
  }
}
