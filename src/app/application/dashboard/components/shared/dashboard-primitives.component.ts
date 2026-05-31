import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import {
  DashboardActionTarget,
  DashboardActivity,
  DashboardAlert,
  DashboardApproval,
  DashboardKpi,
  DashboardPriority,
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
    <article class="dash-kpi-card tc-hover-lift" [attr.data-tone]="metric.tone">
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
    <section class="dash-panel">
      <header class="dash-section-header">
        <div>
          <span>Quick Access</span>
          <h2>Common Tasks</h2>
        </div>
      </header>
      <div class="dash-quick-actions" *ngIf="items.length; else emptyState">
        <button type="button" *ngFor="let action of items.slice(0, 4); trackBy: trackByKey" class="dash-action-card tc-stagger-2" (click)="selected.emit(action)">
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
        <div class="dash-empty-state compact"><i class="pi pi-bolt"></i><strong>No quick actions available</strong></div>
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
    <section class="dash-panel">
      <header class="dash-section-header">
        <div>
          <span>Timeline</span>
          <h2>Recent Activity</h2>
        </div>
        <button type="button" class="dash-icon-button"><i class="pi pi-ellipsis-h"></i></button>
      </header>
      <div class="dash-table-list" *ngIf="items.length; else emptyState">
        <button type="button" class="dash-table-row tc-stagger-3" *ngFor="let item of items.slice(0, 5); trackBy: trackByKey" (click)="selected.emit(item)">
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
        <div class="dash-empty-state compact"><i class="pi pi-history"></i><strong>No recent activity</strong></div>
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
    <section class="dash-panel">
      <header class="dash-section-header">
        <div>
          <span>Analytics</span>
          <h2>{{ title }}</h2>
        </div>
      </header>
      <div class="chart-container" style="position: relative; height: 260px; width: 100%;">
        <canvas #chartCanvas></canvas>
      </div>
    </section>
  `
})
export class ChartWidgetComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() title = 'Overview';
  @Input() type: 'bar' | 'doughnut' | 'line' = 'bar';
  @Input() data: any = null;

  private chart: Chart | null = null;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.canvasRef) {
      setTimeout(() => this.initChart(), 100);
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initChart() {
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(document.body);
    const textColor = style.getPropertyValue('--tc-text-muted') || '#94a3b8';
    const gridColor = style.getPropertyValue('--tc-border') || 'rgba(148, 163, 184, 0.2)';
    const primaryColor = style.getPropertyValue('--tc-primary-500') || '#6366f1';
    const cyanColor = style.getPropertyValue('--tc-info') || '#0ea5e9';
    const orangeColor = style.getPropertyValue('--tc-warning') || '#f59e0b';

    const defaultData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [{
        label: 'Activity',
        data: [12, 19, 15, 25, 22],
        backgroundColor: [primaryColor, cyanColor, orangeColor, primaryColor, cyanColor],
        borderRadius: 4
      }]
    };

    this.chart = new Chart(ctx, {
      type: this.type,
      data: this.data || defaultData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.type === 'doughnut',
            position: 'bottom',
            labels: { color: textColor }
          }
        },
        scales: this.type !== 'doughnut' ? {
          x: {
            grid: { display: false },
            ticks: { color: textColor }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor }
          }
        } : undefined
      }
    });
  }
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
    ChartWidgetComponent
  ],
  template: `
    <div class="dash-renderer">
      
      <section class="dash-kpi-grid tc-animate-slide-up" aria-label="Important KPIs">
        <tc-kpi-card *ngFor="let metric of workspace.kpis; trackBy: trackByKpi" [metric]="metric"></tc-kpi-card>
      </section>

      <tc-quick-action-panel class="tc-animate-slide-up" style="animation-delay: 100ms" [items]="workspace.quickActions" (selected)="actionSelected.emit($event)"></tc-quick-action-panel>

      <div class="dash-two-column wide-left tc-animate-slide-up" style="animation-delay: 200ms">
        <tc-chart-widget title="Attendance Overview" type="bar"></tc-chart-widget>
        <tc-chart-widget title="Status Distribution" type="doughnut"></tc-chart-widget>
      </div>

      <div class="dash-two-column wide-left tc-animate-slide-up" style="animation-delay: 300ms">
        <tc-activity-feed [items]="workspace.recentActivities" (selected)="actionSelected.emit($event)"></tc-activity-feed>
        
        <section class="dash-panel">
          <header class="dash-section-header">
            <div>
              <span>Shortcuts</span>
              <h2>Workspaces</h2>
            </div>
          </header>
          <div class="dash-table-list">
             <button type="button" class="dash-table-row" *ngFor="let item of workspace.moduleShortcuts" (click)="actionSelected.emit(item)">
                <div class="row-icon"><i [class]="item.icon"></i></div>
                <div class="row-main">
                  <strong>{{ item.label }}</strong>
                </div>
                <i class="pi pi-chevron-right" style="color: var(--dash-soft)"></i>
             </button>
          </div>
        </section>
      </div>

    </div>
  `
})
export class RoleDashboardRendererComponent {
  @Input({ required: true }) workspace!: DashboardWorkspace;
  @Output() actionSelected = new EventEmitter<DashboardActionTarget>();

  trackByKpi(index: number, item: DashboardKpi): string | number {
    return item.key || index;
  }
}