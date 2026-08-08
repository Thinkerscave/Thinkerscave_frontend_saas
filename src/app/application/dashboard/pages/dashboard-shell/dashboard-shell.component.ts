import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardResponse, DashboardType, WidgetDTO } from '../../models/dashboard.model';
import { WidgetHostComponent } from '../../widgets/widget-host.component';
import { WidgetCardComponent } from '../../widgets/widget-card/widget-card.component';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { isFeatureEnabled } from '../../../../core/config/feature-flags';
import { TcTranslatePipe } from '../../../../shared/pipes/tc-translate.pipe';

/** Placeholder spans rendered while the workspace call is in flight — mirrors a typical widget layout so the shell never visibly "jumps". */
const SKELETON_SPANS = [4, 4, 2, 2, 2, 2, 2, 2];

const DASHBOARD_TYPE_LABEL: Record<DashboardType, string> = {
  SUPER_ADMIN: 'Platform Overview',
  ORG_OWNER: 'Organization Overview',
  ORG_ADMIN: 'Admin Workspace',
  STAFF: 'Staff Workspace',
  STUDENT: 'Student Workspace',
  PARENT: 'Parent Workspace',
  DEFAULT: 'Workspace'
};

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, WidgetHostComponent, WidgetCardComponent, SaasPageHeaderComponent, TcTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss'
})
export class DashboardShellComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  refreshing = false;
  loadError = false;
  workspace: DashboardResponse | null = null;

  readonly skeletonSpans = SKELETON_SPANS;

  ngOnInit(): void {
    this.load();
  }

  get dashboardLabel(): string {
    return this.workspace ? DASHBOARD_TYPE_LABEL[this.workspace.dashboardType] ?? 'Workspace' : 'Workspace';
  }

  get updatedAgoLabel(): string {
    if (!this.workspace?.generatedAt) return '';
    const diffMs = Date.now() - new Date(this.workspace.generatedAt).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins <= 0) return 'Updated just now';
    if (mins === 1) return 'Updated 1 minute ago';
    if (mins < 60) return `Updated ${mins} minutes ago`;
    const hrs = Math.round(mins / 60);
    return hrs === 1 ? 'Updated 1 hour ago' : `Updated ${hrs} hours ago`;
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.cdr.markForCheck();

    this.dashboardService.getWorkspace()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: response => {
          this.workspace = this.prioritizeWidgets(this.filterDisabledWidgets(response));
        },
        error: () => {
          this.loadError = true;
          this.workspace = null;
        }
      });
  }

  refresh(): void {
    if (this.loading || this.refreshing) return;
    this.refreshing = true;
    this.load();
  }

  onWidgetRetry(_widget: WidgetDTO<any>): void {
    // A single widget's provider already returns a defensive ERROR state
    // rather than throwing, so the only recovery path is a full refresh.
    this.refresh();
  }

  trackWidget(_index: number, widget: WidgetDTO<any>): string {
    return widget.widgetKey;
  }

  private filterDisabledWidgets(response: DashboardResponse): DashboardResponse {
    if (isFeatureEnabled('feeManagementEnabled') || !response?.widgets?.length) {
      return response;
    }
    return {
      ...response,
      widgets: response.widgets.filter(widget => widget.widgetKey !== 'FEE_SUMMARY')
    };
  }

  /** Keep welcome → KPIs → quick actions → charts at the top, then preserve remaining API order. */
  private prioritizeWidgets(response: DashboardResponse): DashboardResponse {
    let widgets = [...(response.widgets ?? [])];
    if (!widgets.length) {
      return response;
    }

    widgets = this.ensureInsightCharts(widgets);

    const priority: Array<WidgetDTO<any>['widgetType']> = ['WELCOME_HEADER', 'KPI_GRID', 'QUICK_ACTIONS', 'CHART'];
    const selectedKeys = new Set<string>();
    const ordered: WidgetDTO<any>[] = [];

    for (const type of priority) {
      if (type === 'CHART') {
        for (const match of widgets.filter(widget => widget.widgetType === 'CHART' && !selectedKeys.has(widget.widgetKey))) {
          ordered.push({ ...match, span: Math.max(match.span ?? 1, 2) });
          selectedKeys.add(match.widgetKey);
        }
        continue;
      }
      const match = widgets.find(widget => widget.widgetType === type && !selectedKeys.has(widget.widgetKey));
      if (match) {
        ordered.push(
          match.widgetType === 'QUICK_ACTIONS'
            ? { ...match, span: Math.max(match.span ?? 1, 4) }
            : match
        );
        selectedKeys.add(match.widgetKey);
      }
    }

    for (const widget of widgets) {
      if (!selectedKeys.has(widget.widgetKey)) {
        ordered.push(widget);
      }
    }

    return { ...response, widgets: ordered };
  }

  /** Ensure attendance + fee visualization charts exist even when API omits CHART widgets. */
  private ensureInsightCharts(widgets: WidgetDTO<any>[]): WidgetDTO<any>[] {
    const chartWidgets = widgets.filter(widget => widget.widgetType === 'CHART');
    const hasUsableChart = chartWidgets.some(widget => this.hasChartSeries(widget));

    if (hasUsableChart) {
      return widgets;
    }

    // Replace empty API chart payloads with readable sample series when present.
    if (chartWidgets.length) {
      return widgets.map(widget => {
        if (widget.widgetType !== 'CHART' || this.hasChartSeries(widget)) {
          return widget;
        }
        if (/fee|collection|payment/i.test(`${widget.widgetKey} ${widget.title ?? ''}`)) {
          return {
            ...widget,
            dataMode: 'SAMPLE',
            state: 'SUCCESS',
            data: {
              chartType: 'donut',
              labels: ['Collected', 'Outstanding', 'Overdue'],
              series: [{ name: 'Amount', data: [2845000, 1250000, 320000] }],
              unit: 'INR'
            }
          };
        }
        return {
          ...widget,
          dataMode: 'SAMPLE',
          state: 'SUCCESS',
          title: widget.title || 'Attendance trend',
          subtitle: widget.subtitle || 'Last 7 days',
          data: {
            chartType: 'area',
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            series: [{ name: 'Present %', data: [92, 88, 95, 90, 93, 70, 86] }],
            unit: '%'
          }
        };
      });
    }

    const extras: WidgetDTO<any>[] = [
      {
        widgetKey: 'ATTENDANCE_TREND_CHART',
        widgetType: 'CHART',
        title: 'Attendance trend',
        subtitle: 'Last 7 days',
        span: 2,
        dataMode: 'SAMPLE',
        state: 'SUCCESS',
        data: {
          chartType: 'area',
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          series: [{ name: 'Present %', data: [92, 88, 95, 90, 93, 70, 86] }],
          unit: '%'
        }
      },
      {
        widgetKey: 'FEE_COLLECTION_CHART',
        widgetType: 'CHART',
        title: 'Fee collection',
        subtitle: 'Breakdown',
        span: 2,
        dataMode: 'SAMPLE',
        state: 'SUCCESS',
        data: {
          chartType: 'donut',
          labels: ['Collected', 'Outstanding', 'Overdue'],
          series: [{ name: 'Amount', data: [2845000, 1250000, 320000] }],
          unit: 'INR'
        }
      }
    ];

    if (!isFeatureEnabled('feeManagementEnabled')) {
      return [...widgets, extras[0]];
    }
    return [...widgets, ...extras];
  }

  private hasChartSeries(widget: WidgetDTO<any>): boolean {
    const series = widget?.data?.series;
    if (!Array.isArray(series) || !series.length) {
      return false;
    }
    return series.some((item: any) => Array.isArray(item?.data) && item.data.some((v: number) => Number(v) > 0));
  }
}
