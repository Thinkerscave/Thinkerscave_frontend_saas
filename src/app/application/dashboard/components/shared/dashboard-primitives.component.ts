import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, OnDestroy, OnChanges, SimpleChanges, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import {
  DashboardActionTarget,
  DashboardActivity,
  DashboardAlert,
  DashboardApproval,
  DashboardChart,
  DashboardChartDataset,
  DashboardFinancialSummary,
  DashboardKpi,
  DashboardPriority,
  DashboardProfileCard,
  DashboardQuickAction,
  DashboardShortcut,
  DashboardWorkspace
} from '../../models/dashboard-workspace.model';

Chart.register(...registerables);

@Component({
  selector: 'tc-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="tc-card tc-card--kpi tc-hover-lift" [attr.data-tone]="metric.tone">
      <div class="kpi-header">
        <span class="kpi-icon"><i [class]="metric.icon"></i></span>
        <div class="kpi-trend" [ngClass]="getTrendClass()">
          <i [class]="getTrendIcon()"></i>
          <span>{{ getTrendValue() }}</span>
        </div>
      </div>
      <div class="kpi-body">
        <strong>{{ metric.value }}</strong>
        <span>{{ metric.label }}</span>
      </div>
    </article>
  `
})
export class KpiCardComponent {
  @Input({ required: true }) metric!: DashboardKpi;

  getTrendClass() {
    if (!this.metric.helper) return 'neutral';
    if (this.metric.helper.includes('+') || this.metric.helper.toLowerCase().includes('up')) return 'positive';
    if (this.metric.helper.includes('-') || this.metric.helper.toLowerCase().includes('down')) return 'negative';
    return 'neutral';
  }

  getTrendIcon() {
    const cls = this.getTrendClass();
    if (cls === 'positive') return 'pi pi-arrow-up-right';
    if (cls === 'negative') return 'pi pi-arrow-down-right';
    return 'pi pi-minus';
  }

  getTrendValue() {
    return this.metric.helper || 'No change';
  }
}

@Component({
  selector: 'tc-quick-action-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tc-card tc-card--panel">
      <header class="tc-card__header">
        <div>
          <span>Quick Access</span>
          <h2>Common Tasks</h2>
        </div>
      </header>
      <div class="dash-quick-actions" *ngIf="items.length; else emptyState">
        <button type="button" *ngFor="let action of items.slice(0, 4); trackBy: trackByKey" class="tc-card is-clickable tc-action-card tc-stagger-2" (click)="selected.emit(action)">
          <div class="action-icon">
            <i [class]="action.icon"></i>
          </div>
          <div class="action-content">
            <strong>{{ action.label }}</strong>
            <small>{{ action.description }}</small>
          </div>
          <i class="pi pi-arrow-right" style="color: var(--dash-muted)"></i>
        </button>
      </div>
      <ng-template #emptyState>
        <div class="tc-empty-state tc-empty-state--inline"><i class="pi pi-bolt"></i><strong>No quick actions available</strong></div>
      </ng-template>
    </section>
  `
})
export class QuickActionPanelComponent {
  @Input() items: DashboardQuickAction[] = [];
  @Output() selected = new EventEmitter<DashboardQuickAction>();

  trackByKey(index: number, item: DashboardQuickAction): string | number {
    return item.key || index;
  }
}

@Component({
  selector: 'tc-activity-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tc-card tc-card--panel">
      <header class="tc-card__header">
        <div>
          <span>Timeline</span>
          <h2>Recent Activity</h2>
        </div>
        <button type="button" class="tc-btn tc-btn--ghost tc-btn--icon"><i class="pi pi-ellipsis-h"></i></button>
      </header>
      <div class="tc-list" *ngIf="items.length; else emptyState">
        <button type="button" class="tc-list__item is-clickable tc-stagger-3" *ngFor="let item of items.slice(0, 5); trackBy: trackByKey" (click)="selected.emit(item)">
          <div class="row-icon"><i [class]="item.icon"></i></div>
          <div class="row-main">
            <strong>{{ item.title }}</strong>
            <small>{{ item.actor }}</small>
          </div>
          <div class="row-meta">{{ item.occurredAt | date:'MMM d, h:mm a' }}</div>
          <div class="row-badge" [ngClass]="getBadgeClass(item)">{{ getStatus(item) }}</div>
        </button>
      </div>
      <ng-template #emptyState>
        <div class="tc-empty-state tc-empty-state--inline"><i class="pi pi-history"></i><strong>No recent activity</strong></div>
      </ng-template>
    </section>
  `
})
export class ActivityFeedComponent {
  @Input() items: DashboardActivity[] = [];
  @Output() selected = new EventEmitter<DashboardActivity>();

  trackByKey(index: number, item: DashboardActivity): string | number {
    return item.key || index;
  }

  getStatus(item: DashboardActivity) {
    if (item.title.toLowerCase().includes('approved')) return 'Approved';
    if (item.title.toLowerCase().includes('alert')) return 'Alert';
    return 'Pending';
  }

  getBadgeClass(item: DashboardActivity) {
    const status = this.getStatus(item);
    if (status === 'Approved') return 'status-approved';
    if (status === 'Alert') return 'status-alert';
    return 'status-pending';
  }
}

@Component({
  selector: 'tc-chart-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tc-card tc-card--panel dash-chart-panel">
      <header class="tc-card__header">
        <div>
          <span>{{ chart?.subtitle || 'Analytics' }}</span>
          <h2>{{ chart?.title || title }}</h2>
        </div>
      </header>
      <ng-container *ngIf="hasData(); else emptyState">
        <div class="chart-container">
          <canvas #chartCanvas></canvas>
        </div>
      </ng-container>
      <ng-template #emptyState>
        <div class="tc-empty-state tc-empty-state--inline">
          <i class="pi pi-chart-line"></i>
          <strong>{{ chart?.emptyMessage || 'No data yet' }}</strong>
        </div>
      </ng-template>
    </section>
  `
})
export class ChartWidgetComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;
  @Input() title = 'Overview';
  @Input() chart: DashboardChart | null = null;

  private instance: Chart | null = null;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      queueMicrotask(() => this.render());
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chart'] && this.instance) {
      this.render();
    }
  }

  ngOnDestroy() {
    this.instance?.destroy();
    this.instance = null;
  }

  hasData(): boolean {
    if (!this.chart || !this.chart.datasets?.length) return false;
    return this.chart.datasets.some(ds => (ds.data || []).some(v => Number(v) > 0));
  }

  private render() {
    if (!this.canvasRef || !this.chart) return;
    if (!this.hasData()) {
      this.instance?.destroy();
      this.instance = null;
      return;
    }
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(document.body);
    const textColor = style.getPropertyValue('--tc-text-muted').trim() || '#94a3b8';
    const gridColor = style.getPropertyValue('--tc-border').trim() || 'rgba(148, 163, 184, 0.2)';

    const palette = this.palette(style);
    const chartType = (this.chart.type as ChartType) || 'bar';
    const datasets = this.chart.datasets.map((ds, idx) => this.buildDataset(ds, idx, chartType, palette));

    const config: ChartConfiguration = {
      type: chartType,
      data: { labels: this.chart.labels || [], datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartType === 'doughnut' || chartType === 'pie' || datasets.length > 1,
            position: 'bottom',
            labels: { color: textColor, boxWidth: 12, padding: 14 }
          },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: (chartType === 'doughnut' || chartType === 'pie') ? undefined : {
          x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 0, autoSkip: true } },
          y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
        }
      }
    };

    this.instance?.destroy();
    this.instance = new Chart(ctx, config);
  }

  private palette(style: CSSStyleDeclaration): string[] {
    const v = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    return [
      v('--tc-primary-500', '#6366f1'),
      v('--tc-info', '#0ea5e9'),
      v('--tc-success', '#10b981'),
      v('--tc-warning', '#f59e0b'),
      v('--tc-danger', '#ef4444'),
      v('--tc-primary-700', '#4f46e5')
    ];
  }

  private buildDataset(ds: DashboardChartDataset, idx: number, type: ChartType, palette: string[]): any {
    const data = (ds.data || []).map(v => Number(v) || 0);
    const colorByTone: Record<string, string> = {
      success: palette[2], info: palette[1], warning: palette[3],
      danger: palette[4], primary: palette[0], neutral: palette[5]
    };
    const baseColor = colorByTone[ds.tone] || palette[idx % palette.length];

    if (type === 'doughnut' || type === 'pie') {
      return {
        label: ds.label,
        data,
        backgroundColor: data.map((_, i) => palette[i % palette.length]),
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 6
      };
    }

    if (type === 'line') {
      return {
        label: ds.label,
        data,
        borderColor: baseColor,
        backgroundColor: this.fade(baseColor, 0.18),
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: baseColor,
        borderWidth: 2
      };
    }

    // bar
    return {
      label: ds.label,
      data,
      backgroundColor: data.map((_, i) => palette[i % palette.length]),
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 40
    };
  }

  private fade(color: string, alpha: number): string {
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return color;
  }
}

@Component({
  selector: 'tc-profile-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tc-card tc-card--panel tc-card" *ngIf="profile">
      <div class="profile-hero">
        <div class="profile-avatar">{{ profile.avatarInitials }}</div>
        <div class="profile-meta">
          <strong>{{ profile.displayName }}</strong>
          <span>{{ profile.roleLabel }}</span>
          <small *ngIf="profile.classLabel">
            {{ profile.classLabel }}<ng-container *ngIf="profile.sectionLabel"> · Section {{ profile.sectionLabel }}</ng-container>
            <ng-container *ngIf="profile.rollNumber"> · Roll {{ profile.rollNumber }}</ng-container>
          </small>
        </div>
      </div>
      <dl class="profile-stats">
        <div *ngIf="profile.attendanceRate !== null && profile.attendanceRate !== undefined">
          <dt>Attendance · 30d</dt>
          <dd [attr.data-tone]="attendanceTone()">{{ profile.attendanceRate }}%</dd>
        </div>
        <div *ngIf="profile.presentDays !== null && profile.presentDays !== undefined">
          <dt>Present</dt>
          <dd>{{ profile.presentDays }} day{{ profile.presentDays === 1 ? '' : 's' }}</dd>
        </div>
        <div *ngIf="profile.absentDays !== null && profile.absentDays !== undefined">
          <dt>Absent</dt>
          <dd>{{ profile.absentDays }} day{{ profile.absentDays === 1 ? '' : 's' }}</dd>
        </div>
        <div *ngIf="profile.childOf">
          <dt>Parent / Guardian</dt>
          <dd>{{ profile.childOf }}</dd>
        </div>
        <div *ngIf="profile.contactPhone">
          <dt>Contact</dt>
          <dd>{{ profile.contactPhone }}</dd>
        </div>
        <div *ngIf="profile.contactEmail">
          <dt>Email</dt>
          <dd class="truncate">{{ profile.contactEmail }}</dd>
        </div>
      </dl>
    </section>
  `
})
export class ProfileCardComponent {
  @Input() profile: DashboardProfileCard | null = null;

  attendanceTone(): string {
    const rate = this.profile?.attendanceRate ?? 0;
    if (rate >= 90) return 'success';
    if (rate >= 75) return 'warning';
    return 'danger';
  }
}

@Component({
  selector: 'tc-financial-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tc-card tc-card--panel dash-financial-card" *ngIf="summary">
      <header class="tc-card__header">
        <div>
          <span>Finance</span>
          <h2>Financial Summary</h2>
        </div>
        <small *ngIf="summary.helper" class="dash-section-helper">{{ summary.helper }}</small>
      </header>
      <div class="finance-grid">
        <article class="finance-tile" data-tone="info">
          <span>Total Revenue</span>
          <strong>{{ summary.currencySymbol }}{{ summary.totalRevenue }}</strong>
        </article>
        <article class="finance-tile" data-tone="success">
          <span>Paid</span>
          <strong>{{ summary.currencySymbol }}{{ summary.paid }}</strong>
          <small *ngIf="summary.invoicesPaid !== null">{{ summary.invoicesPaid }} invoice{{ summary.invoicesPaid === 1 ? '' : 's' }}</small>
        </article>
        <article class="finance-tile" data-tone="warning">
          <span>Pending</span>
          <strong>{{ summary.currencySymbol }}{{ summary.pending }}</strong>
          <small *ngIf="summary.invoicesPending !== null">{{ summary.invoicesPending }} invoice{{ summary.invoicesPending === 1 ? '' : 's' }}</small>
        </article>
        <article class="finance-tile" data-tone="danger">
          <span>Overdue</span>
          <strong>{{ summary.currencySymbol }}{{ summary.overdue }}</strong>
          <small *ngIf="summary.invoicesOverdue !== null">{{ summary.invoicesOverdue }} invoice{{ summary.invoicesOverdue === 1 ? '' : 's' }}</small>
        </article>
      </div>
    </section>
  `
})
export class FinancialSummaryComponent {
  @Input() summary: DashboardFinancialSummary | null = null;
}

@Component({
  selector: 'tc-priorities-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tc-card tc-card--panel">
      <header class="tc-card__header">
        <div>
          <span>Priorities</span>
          <h2>{{ heading }}</h2>
        </div>
      </header>
      <div class="tc-list" *ngIf="items.length; else empty">
        <button type="button" class="tc-list__item is-clickable" *ngFor="let item of items" (click)="selected.emit(item)">
          <div class="row-icon" [attr.data-tone]="item.tone"><i [class]="item.icon"></i></div>
          <div class="row-main">
            <strong>{{ item.title }}</strong>
            <small>{{ item.description }}</small>
          </div>
          <span class="row-meta">{{ item.dueLabel }}</span>
        </button>
      </div>
      <ng-template #empty>
        <div class="tc-empty-state tc-empty-state--inline"><i class="pi pi-check-circle"></i><strong>{{ emptyMessage }}</strong></div>
      </ng-template>
    </section>
  `
})
export class PrioritiesPanelComponent {
  @Input() items: DashboardPriority[] = [];
  @Input() heading = 'Action Center';
  @Input() emptyMessage = 'No priority items today';
  @Output() selected = new EventEmitter<DashboardPriority>();
}

@Component({
  selector: 'tc-alerts-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tc-card tc-card--panel">
      <header class="tc-card__header">
        <div>
          <span>Alerts</span>
          <h2>Smart Alerts</h2>
        </div>
      </header>
      <div class="tc-list" *ngIf="items.length; else empty">
        <button type="button" class="tc-list__item is-clickable" *ngFor="let item of items" (click)="selected.emit(item)">
          <div class="row-icon" [attr.data-tone]="item.tone"><i [class]="item.icon"></i></div>
          <div class="row-main">
            <strong>{{ item.title }}</strong>
            <small>{{ item.description }}</small>
          </div>
          <span class="row-badge" [attr.data-tone]="item.tone">{{ item.severity }}</span>
        </button>
      </div>
      <ng-template #empty>
        <div class="tc-empty-state tc-empty-state--inline"><i class="pi pi-shield"></i><strong>All clear</strong></div>
      </ng-template>
    </section>
  `
})
export class AlertsPanelComponent {
  @Input() items: DashboardAlert[] = [];
  @Output() selected = new EventEmitter<DashboardAlert>();
}

@Component({
  selector: 'tc-approvals-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tc-card tc-card--panel">
      <header class="tc-card__header">
        <div>
          <span>Approvals</span>
          <h2>Pending Approvals</h2>
        </div>
      </header>
      <div class="tc-list" *ngIf="items.length; else empty">
        <button type="button" class="tc-list__item is-clickable" *ngFor="let item of items" (click)="selected.emit(item)">
          <div class="row-icon" [attr.data-tone]="item.tone"><i class="pi pi-check-square"></i></div>
          <div class="row-main">
            <strong>{{ item.title }}</strong>
            <small>{{ item.description }}</small>
          </div>
          <span class="row-badge" [attr.data-tone]="item.tone">{{ item.status }}</span>
        </button>
      </div>
      <ng-template #empty>
        <div class="tc-empty-state tc-empty-state--inline"><i class="pi pi-inbox"></i><strong>No approvals waiting</strong></div>
      </ng-template>
    </section>
  `
})
export class ApprovalsPanelComponent {
  @Input() items: DashboardApproval[] = [];
  @Output() selected = new EventEmitter<DashboardApproval>();
}

@Component({
  selector: 'tc-shortcuts-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tc-card tc-card--panel" *ngIf="items?.length">
      <header class="tc-card__header">
        <div>
          <span>Shortcuts</span>
          <h2>{{ heading }}</h2>
        </div>
      </header>
      <div class="tc-list">
        <button type="button" class="tc-list__item is-clickable" *ngFor="let item of items" (click)="selected.emit(item)">
          <div class="row-icon"><i [class]="item.icon"></i></div>
          <div class="row-main"><strong>{{ item.label }}</strong><small *ngIf="item.description">{{ item.description }}</small></div>
          <span class="row-meta" *ngIf="item.count !== null && item.count !== undefined">{{ item.count }}</span>
          <i class="pi pi-chevron-right" style="color: var(--dash-soft)"></i>
        </button>
      </div>
    </section>
  `
})
export class ShortcutsPanelComponent {
  @Input() items: DashboardShortcut[] | null = [];
  @Input() heading = 'Workspaces';
  @Output() selected = new EventEmitter<DashboardShortcut>();
}

@Component({
  selector: 'tc-role-dashboard-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    QuickActionPanelComponent,
    ActivityFeedComponent,
    ChartWidgetComponent,
    ProfileCardComponent,
    FinancialSummaryComponent,
    PrioritiesPanelComponent,
    AlertsPanelComponent,
    ApprovalsPanelComponent,
    ShortcutsPanelComponent
  ],
  template: `
    <div class="dash-renderer" [attr.data-role]="canonicalRole">

      <section class="dash-kpi-grid tc-animate-slide-up" aria-label="KPIs">
        <tc-kpi-card *ngFor="let metric of workspace.kpis; trackBy: trackByKpi" [metric]="metric"></tc-kpi-card>
      </section>

      <ng-container [ngSwitch]="canonicalRole">

        <!-- SUPERADMIN -->
        <ng-container *ngSwitchCase="'SUPERADMIN'">
          <tc-financial-summary [summary]="workspace.financialSummary"></tc-financial-summary>
          <div class="dash-two-column wide-left">
            <tc-chart-widget [chart]="chartAt(0)"></tc-chart-widget>
            <tc-chart-widget [chart]="chartAt(1)"></tc-chart-widget>
          </div>
          <tc-chart-widget [chart]="chartAt(2)"></tc-chart-widget>
          <tc-quick-action-panel [items]="workspace.quickActions" (selected)="actionSelected.emit($event)"></tc-quick-action-panel>
          <div class="dash-two-column wide-left">
            <tc-alerts-panel [items]="workspace.smartAlerts" (selected)="actionSelected.emit($event)"></tc-alerts-panel>
            <tc-activity-feed [items]="workspace.recentActivities" (selected)="actionSelected.emit($event)"></tc-activity-feed>
          </div>
        </ng-container>

        <!-- ORGANIZATION_OWNER -->
        <ng-container *ngSwitchCase="'OWNER'">
          <tc-financial-summary [summary]="workspace.financialSummary"></tc-financial-summary>
          <div class="dash-two-column wide-left">
            <tc-chart-widget [chart]="chartAt(0)"></tc-chart-widget>
            <tc-chart-widget [chart]="chartAt(1)"></tc-chart-widget>
          </div>
          <tc-chart-widget [chart]="chartAt(2)"></tc-chart-widget>
          <tc-quick-action-panel [items]="workspace.quickActions" (selected)="actionSelected.emit($event)"></tc-quick-action-panel>
          <div class="dash-two-column wide-left">
            <tc-priorities-panel heading="Key Alerts" emptyMessage="No alerts today" [items]="workspace.priorities" (selected)="actionSelected.emit($event)"></tc-priorities-panel>
            <tc-activity-feed [items]="workspace.recentActivities" (selected)="actionSelected.emit($event)"></tc-activity-feed>
          </div>
          <tc-shortcuts-panel heading="Modules" [items]="workspace.moduleShortcuts" (selected)="actionSelected.emit($event)"></tc-shortcuts-panel>
        </ng-container>

        <!-- ORGANIZATION_ADMIN / HEADMASTER -->
        <ng-container *ngSwitchCase="'ADMIN'">
          <div class="dash-two-column wide-left">
            <tc-priorities-panel heading="Operational Alerts" [items]="workspace.priorities" (selected)="actionSelected.emit($event)"></tc-priorities-panel>
            <tc-financial-summary [summary]="workspace.financialSummary"></tc-financial-summary>
          </div>
          <tc-quick-action-panel [items]="workspace.quickActions" (selected)="actionSelected.emit($event)"></tc-quick-action-panel>
          <div class="dash-two-column wide-left">
            <tc-chart-widget [chart]="chartAt(0)"></tc-chart-widget>
            <tc-chart-widget [chart]="chartAt(1)"></tc-chart-widget>
          </div>
          <div class="dash-two-column wide-left">
            <tc-approvals-panel [items]="workspace.pendingApprovals" (selected)="actionSelected.emit($event)"></tc-approvals-panel>
            <tc-chart-widget [chart]="chartAt(2)"></tc-chart-widget>
          </div>
          <div class="dash-two-column wide-left">
            <tc-activity-feed [items]="workspace.recentActivities" (selected)="actionSelected.emit($event)"></tc-activity-feed>
            <tc-alerts-panel [items]="workspace.smartAlerts" (selected)="actionSelected.emit($event)"></tc-alerts-panel>
          </div>
        </ng-container>

        <!-- STAFF / TEACHER -->
        <ng-container *ngSwitchCase="'STAFF'">
          <tc-quick-action-panel [items]="workspace.quickActions" (selected)="actionSelected.emit($event)"></tc-quick-action-panel>
          <div class="dash-two-column wide-left">
            <tc-priorities-panel heading="Today's Tasks" emptyMessage="You're all caught up" [items]="workspace.priorities" (selected)="actionSelected.emit($event)"></tc-priorities-panel>
            <tc-chart-widget [chart]="chartAt(1)"></tc-chart-widget>
          </div>
          <tc-chart-widget [chart]="chartAt(0)"></tc-chart-widget>
          <div class="dash-two-column wide-left">
            <tc-activity-feed [items]="workspace.recentActivities" (selected)="actionSelected.emit($event)"></tc-activity-feed>
            <tc-shortcuts-panel heading="My Workspaces" [items]="workspace.moduleShortcuts" (selected)="actionSelected.emit($event)"></tc-shortcuts-panel>
          </div>
        </ng-container>

        <!-- STUDENT -->
        <ng-container *ngSwitchCase="'STUDENT'">
          <div class="dash-two-column wide-right">
            <tc-profile-card [profile]="workspace.profileCard"></tc-profile-card>
            <tc-chart-widget [chart]="chartAt(0)"></tc-chart-widget>
          </div>
          <tc-quick-action-panel [items]="workspace.quickActions" (selected)="actionSelected.emit($event)"></tc-quick-action-panel>
          <div class="dash-two-column wide-left">
            <tc-chart-widget [chart]="chartAt(1)"></tc-chart-widget>
            <tc-priorities-panel heading="Upcoming" emptyMessage="No upcoming items" [items]="workspace.priorities" (selected)="actionSelected.emit($event)"></tc-priorities-panel>
          </div>
          <tc-activity-feed [items]="workspace.recentActivities" (selected)="actionSelected.emit($event)"></tc-activity-feed>
        </ng-container>

        <!-- PARENT -->
        <ng-container *ngSwitchCase="'PARENT'">
          <div class="dash-two-column wide-right">
            <tc-profile-card [profile]="workspace.profileCard"></tc-profile-card>
            <tc-chart-widget [chart]="chartAt(0)"></tc-chart-widget>
          </div>
          <tc-quick-action-panel [items]="workspace.quickActions" (selected)="actionSelected.emit($event)"></tc-quick-action-panel>
          <div class="dash-two-column wide-left">
            <tc-chart-widget [chart]="chartAt(1)"></tc-chart-widget>
            <tc-priorities-panel heading="Updates" emptyMessage="No updates today" [items]="workspace.priorities" (selected)="actionSelected.emit($event)"></tc-priorities-panel>
          </div>
          <tc-activity-feed [items]="workspace.recentActivities" (selected)="actionSelected.emit($event)"></tc-activity-feed>
        </ng-container>

        <!-- Fallback -->
        <ng-container *ngSwitchDefault>
          <tc-quick-action-panel [items]="workspace.quickActions" (selected)="actionSelected.emit($event)"></tc-quick-action-panel>
          <div class="dash-two-column wide-left" *ngIf="workspace.charts?.length">
            <tc-chart-widget *ngFor="let c of workspace.charts" [chart]="c"></tc-chart-widget>
          </div>
          <div class="dash-two-column wide-left">
            <tc-activity-feed [items]="workspace.recentActivities" (selected)="actionSelected.emit($event)"></tc-activity-feed>
            <tc-shortcuts-panel [items]="workspace.moduleShortcuts" (selected)="actionSelected.emit($event)"></tc-shortcuts-panel>
          </div>
        </ng-container>

      </ng-container>

    </div>
  `
})
export class RoleDashboardRendererComponent {
  @Input({ required: true }) workspace!: DashboardWorkspace;
  @Output() actionSelected = new EventEmitter<DashboardActionTarget>();

  trackByKpi(index: number, item: DashboardKpi): string | number {
    return item.key || index;
  }

  get canonicalRole(): 'SUPERADMIN' | 'OWNER' | 'ADMIN' | 'STAFF' | 'STUDENT' | 'PARENT' {
    const raw = (this.workspace?.context?.primaryRoleCode || '').toString().trim().toUpperCase().replace(/^ROLE_/, '');
    switch (raw) {
      case 'SUPERADMIN':
      case 'SUPER_ADMIN':
      case 'PLATFORM_ADMIN':
        return 'SUPERADMIN';
      case 'ORGANIZATION_OWNER':
      case 'OWNER':
      case 'PRINCIPAL':
      case 'DIRECTOR':
        return 'OWNER';
      case 'ORGANIZATION_ADMIN':
      case 'ADMIN':
      case 'HEADMASTER':
      case 'VICE_PRINCIPAL':
        return 'ADMIN';
      case 'STUDENT':
        return 'STUDENT';
      case 'PARENT':
      case 'GUARDIAN':
        return 'PARENT';
      default:
        return 'STAFF';
    }
  }

  chartAt(index: number): DashboardChart | null {
    return this.workspace?.charts?.[index] ?? null;
  }
}
