import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { Subscription, finalize } from 'rxjs';

import { AcademicYearContextService } from '../../../../../shared/services/academic-year-context.service';
import { AppToastComponent } from '../../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../../core/feedback/ui-feedback.service';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { SaasPageHeaderComponent, SaasPillComponent } from '../../../../../shared/ui/saas';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import {
  FINANCE_REPORTS_RESOURCE,
  FinanceReportOverview,
  FinanceReportPeriod,
  FinanceReportQuery
} from '../models/finance-reports.model';
import { FinanceReportsApiService } from '../services/finance-reports-api.service';

const CHART_COLORS = [
  '#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
  '#14b8a6', '#6366f1', '#ec4899', '#64748b', '#0ea5e9'
];

@Component({
  selector: 'app-finance-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChartModule,
    DropdownModule,
    AppToastComponent,
    HasPermissionDirective,
    SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent,
    SaasPillComponent,
    TcPageSkeletonComponent
  ],
  templateUrl: './finance-reports-page.component.html',
  styleUrls: ['./finance-reports-page.component.scss', '../../../fees.shared.scss']
})
export class FinanceReportsPageComponent {
  private readonly api = inject(FinanceReportsApiService);
  private readonly yearCtx = inject(AcademicYearContextService);
  private readonly router = inject(Router);
  private readonly feedback = inject(UiFeedbackService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly resource = FINANCE_REPORTS_RESOURCE;
  readonly chartColors = CHART_COLORS;
  readonly periods: Array<{ label: string; value: FinanceReportPeriod }> = [
    { label: 'This Month', value: 'THIS_MONTH' },
    { label: 'Last Month', value: 'LAST_MONTH' },
    { label: 'This Quarter', value: 'THIS_QUARTER' },
    { label: 'This Academic Year', value: 'THIS_ACADEMIC_YEAR' },
    { label: 'This Financial Year', value: 'THIS_FINANCIAL_YEAR' },
    { label: 'Custom', value: 'CUSTOM' }
  ];

  draftFilter: FinanceReportQuery = this.defaultFilter();
  appliedFilter: FinanceReportQuery = this.defaultFilter();
  overview: FinanceReportOverview | null = null;
  loading = true;
  exporting = false;
  exportOpen = false;
  errorMessage = '';
  forbidden = false;
  lastUpdated: Date | null = null;

  incomeOutflowData: Record<string, unknown> = {};
  feeCategoryData: Record<string, unknown> = {};
  feeTrendData: Record<string, unknown> = {};
  payrollTrendData: Record<string, unknown> = {};
  expenseCategoryData: Record<string, unknown> = {};
  expenseStatusData: Record<string, unknown> = {};
  trendOptions: Record<string, unknown> = {};
  doughnutOptions: Record<string, unknown> = {};
  private overviewSub: Subscription | null = null;
  private chartsConfigured = false;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.exportOpen = false;
  }

  onAcademicYearChange(yearId: number | null): void {
    if (!this.chartsConfigured) {
      this.configureCharts();
      this.chartsConfigured = true;
    }
    this.draftFilter = { ...this.draftFilter, academicYearId: yearId };
    this.appliedFilter = { ...this.appliedFilter, academicYearId: yearId };
    if (yearId == null) {
      this.overview = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.overview = null;
    this.loading = true;
    this.cdr.markForCheck();
    this.load();
  }

  get periodLabel(): string {
    return this.periods.find(p => p.value === this.appliedFilter.period)?.label
      ?? this.overview?.filter?.label
      ?? 'Selected period';
  }

  applyFilters(): void {
    if (this.draftFilter.period === 'CUSTOM' && (!this.draftFilter.from || !this.draftFilter.to)) {
      this.feedback.error('Invalid period', 'Choose both From and To dates for a custom period.');
      return;
    }
    if (this.draftFilter.period === 'CUSTOM' && this.draftFilter.from! > this.draftFilter.to!) {
      this.feedback.error('Invalid period', 'From date cannot be after To date.');
      return;
    }
    this.errorMessage = '';
    this.appliedFilter = { ...this.draftFilter };
    this.load();
  }

  resetFilters(): void {
    this.draftFilter = {
      ...this.defaultFilter(),
      academicYearId: this.yearCtx.selectedYearId()
    };
    this.appliedFilter = { ...this.draftFilter };
    this.errorMessage = '';
    this.load();
  }

  load(): void {
    this.overviewSub?.unsubscribe();
    this.loading = true;
    this.errorMessage = '';
    this.forbidden = false;
    this.cdr.markForCheck();
    this.overviewSub = this.api.overview(this.appliedFilter)
      .pipe(finalizeBusy(v => {
        this.loading = v;
        this.cdr.detectChanges();
      }))
      .subscribe({
      next: overview => {
        try {
          this.overview = overview;
          this.lastUpdated = new Date();
          this.buildCharts(overview);
        } catch (error) {
          console.error('Finance reports chart build failed', error);
          this.errorMessage = 'Report loaded, but one or more charts could not be rendered.';
        }
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.overview = null;
        this.forbidden = error.status === 403;
        this.errorMessage = this.forbidden
          ? 'You do not have permission to view Finance Reports.'
          : 'Unable to load Finance Reports. Please try again.';
        if (!this.forbidden) {
          this.feedback.error('Reports', this.errorMessage);
        }
        this.cdr.detectChanges();
      }
    });
  }

  toggleExport(event: Event): void {
    event.stopPropagation();
    this.exportOpen = !this.exportOpen;
  }

  exportReport(format: 'pdf' | 'csv', event?: Event): void {
    event?.stopPropagation();
    this.exportOpen = false;
    if (this.exporting || this.loading) return;
    this.exporting = true;
    this.api.export(this.appliedFilter, format)
      .pipe(finalize(() => this.exporting = false))
      .subscribe({
        next: file => {
          const url = URL.createObjectURL(file.blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = file.fileName;
          anchor.click();
          URL.revokeObjectURL(url);
          this.feedback.success('Export ready', `${format.toUpperCase()} download started.`);
        },
        error: () => {
          this.errorMessage = 'Unable to export the current report.';
          this.feedback.error('Export failed', this.errorMessage);
        }
      });
  }

  navigate(path: string | null | undefined, fallback: string): void {
    void this.router.navigateByUrl(path || fallback);
  }

  money(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(value ?? 0));
  }

  label(value: string | null | undefined): string {
    return (value ?? '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  outstandingLabel(value: string | null | undefined): string {
    if (!value || value.toUpperCase() === 'CURRENT') {
      return 'Current balance';
    }
    return this.label(value);
  }

  hasFinanceData(report: FinanceReportOverview): boolean {
    return Object.values(report.kpis ?? {}).some(value => Number(value) !== 0) ||
      (report.incomeOutflowTrend?.length ?? 0) > 0 ||
      (report.feeAnalytics?.collectionByCategory?.length ?? 0) > 0 ||
      (report.feeAnalytics?.collectionTrend?.length ?? 0) > 0 ||
      (report.payroll?.costTrend?.length ?? 0) > 0 ||
      (report.expenses?.byCategory?.length ?? 0) > 0 ||
      (report.expenses?.statusDistribution?.length ?? 0) > 0 ||
      (report.outstanding?.byClass?.length ?? 0) > 0 ||
      (report.attention?.length ?? 0) > 0 ||
      (report.recentActivity?.length ?? 0) > 0;
  }

  statusTone(status: string | null | undefined): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
    const value = (status ?? '').toUpperCase();
    if (['PAID', 'SUCCESS', 'COMPLETED', 'APPROVED'].includes(value)) return 'success';
    if (['PENDING', 'PARTIALLY_PAID', 'PENDING_APPROVAL', 'GENERATED'].includes(value)) return 'warning';
    if (['FAILED', 'REJECTED', 'UNPAID', 'OVERDUE'].includes(value)) return 'danger';
    if (['FEE', 'FEE_COLLECTION', 'EXPENSE', 'PAYROLL'].includes(value)) return 'info';
    return 'neutral';
  }

  private defaultFilter(): FinanceReportQuery {
    return { academicYearId: null, period: 'THIS_ACADEMIC_YEAR', from: null, to: null };
  }

  private configureCharts(): void {
    const currencyTick = (value: string | number) => new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(Number(value));
    this.trendOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 10, padding: 16 } },
        tooltip: {
          callbacks: {
            label: (context: { dataset?: { label?: string }; parsed?: { y?: number } }) =>
              `${context.dataset?.label}: ${this.money(context.parsed?.y)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0 } },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, .18)' },
          ticks: { callback: currencyTick }
        }
      }
    };
    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: { label?: string; parsed?: number }) =>
              `${context.label}: ${this.money(context.parsed)}`
          }
        }
      }
    };
  }

  private buildCharts(report: FinanceReportOverview): void {
    const trend = report.incomeOutflowTrend ?? [];
    this.incomeOutflowData = {
      labels: trend.map(point => point.label),
      datasets: [
        {
          label: 'Fee Collection',
          data: trend.map(point => point.feeCollection),
          backgroundColor: '#10b981',
          borderRadius: 8,
          maxBarThickness: 28
        },
        {
          label: 'Total Outflow',
          data: trend.map(point => point.totalOutflow),
          backgroundColor: '#2563eb',
          borderRadius: 8,
          maxBarThickness: 28
        }
      ]
    };
    this.feeCategoryData = this.donut(
      report.feeAnalytics?.collectionByCategory?.map(item => item.name) ?? [],
      report.feeAnalytics?.collectionByCategory?.map(item => item.amount) ?? []
    );
    this.feeTrendData = this.line(report.feeAnalytics?.collectionTrend ?? [], 'Fee Collection', '#10b981', true);
    this.payrollTrendData = this.line(report.payroll?.costTrend ?? [], 'Payroll Paid', '#8b5cf6');
    this.expenseCategoryData = this.donut(
      report.expenses?.byCategory?.map(item => item.name) ?? [],
      report.expenses?.byCategory?.map(item => item.amount) ?? []
    );
    this.expenseStatusData = this.donut(
      report.expenses?.statusDistribution?.map(item => this.label(item.status)) ?? [],
      report.expenses?.statusDistribution?.map(item => item.amount) ?? []
    );
  }

  private line(
    points: Array<{ label: string; amount: number }>,
    label: string,
    color: string,
    fill = false
  ): Record<string, unknown> {
    return {
      labels: points.map(point => point.label),
      datasets: [{
        label,
        data: points.map(point => point.amount),
        borderColor: color,
        backgroundColor: fill ? `${color}22` : color,
        tension: 0.35,
        fill,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2
      }]
    };
  }

  private donut(labels: string[], values: number[]): Record<string, unknown> {
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  }
}
