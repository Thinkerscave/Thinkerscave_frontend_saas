import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AcademicsActivityItem,
  AcademicsAlert,
  AcademicsChartSlice,
  AcademicsInsight,
  AcademicsMetric,
  AcademicsQuickAction,
  AcademicsWorkloadItem,
  AcademicsWorkspaceData
} from '../../../models/academics-workspace.model';
import { AcademicActivityTimelineComponent } from '../../shared/activity-timeline/activity-timeline.component';
import { AcademicMetricCardComponent } from '../../shared/metric-card/metric-card.component';
import { AcademicProgressRingComponent } from '../../shared/progress-ring/progress-ring.component';

@Component({
  selector: 'app-academic-dashboard-page',
  standalone: true,
  imports: [CommonModule, AcademicMetricCardComponent, AcademicProgressRingComponent, AcademicActivityTimelineComponent],
  template: `
    <section class="acad-dashboard-page">
      <div class="acad-metric-grid">
        <app-academic-metric-card *ngFor="let metric of metrics" [metric]="metric"></app-academic-metric-card>
      </div>

      <div class="acad-dashboard-grid">
        <section class="acad-panel acad-health-map">
          <div class="acad-section-head">
            <div>
              <span>Academic progress map</span>
              <h2>Readiness overview</h2>
            </div>
          </div>
          <div class="acad-insight-grid">
            <article *ngFor="let insight of insights" [ngClass]="'tone-' + insight.tone">
              <i [ngClass]="insight.icon"></i>
              <div>
                <span>{{ insight.title }}</span>
                <strong>{{ insight.value }}</strong>
                <p>{{ insight.description }}</p>
              </div>
              <app-academic-progress-ring *ngIf="insight.progress !== undefined" [value]="insight.progress" [tone]="insight.tone"></app-academic-progress-ring>
            </article>
          </div>
        </section>

        <section class="acad-panel acad-visual-panel">
          <div class="acad-section-head">
            <div>
              <span>Visual analytics</span>
              <h2>Subject distribution</h2>
            </div>
          </div>
          <div class="acad-donut-layout">
            <div class="acad-donut" [style.background]="donutBackground(distribution)">
              <strong>{{ totalDistribution(distribution) }}</strong>
              <span>Subjects</span>
            </div>
            <div class="acad-legend">
              <div *ngFor="let slice of distribution" [ngClass]="'tone-' + slice.tone">
                <span></span>
                <strong>{{ slice.label }}</strong>
                <small>{{ slice.value }}</small>
              </div>
            </div>
          </div>
        </section>

        <section class="acad-panel acad-workload-panel">
          <div class="acad-section-head">
            <div>
              <span>Teacher workload</span>
              <h2>Weekly load balance</h2>
            </div>
          </div>
          <div class="acad-bars">
            <article *ngFor="let item of workloads" [ngClass]="'tone-' + item.tone">
              <div>
                <strong>{{ item.teacherName }}</strong>
                <small>{{ item.totalPeriods }} periods · {{ item.allocationCount }} assignments</small>
              </div>
              <span><i [style.width.%]="item.utilization"></i></span>
            </article>
          </div>
        </section>

        <section class="acad-panel acad-ai-panel">
          <div class="acad-section-head">
            <div>
              <span>AI-ready recommendations</span>
              <h2>What needs attention</h2>
            </div>
          </div>
          <div class="acad-alert-list">
            <article *ngFor="let alert of alerts" [ngClass]="'tone-' + alert.tone">
              <i [ngClass]="alert.icon"></i>
              <div>
                <strong>{{ alert.title }}</strong>
                <p>{{ alert.description }}</p>
              </div>
            </article>
          </div>
        </section>

        <app-academic-activity-timeline [items]="activities"></app-academic-activity-timeline>

        <section class="acad-panel acad-calendar-mini">
          <div class="acad-section-head">
            <div>
              <span>Calendar mini widget</span>
              <h2>Upcoming events</h2>
            </div>
            <button type="button" class="acad-ghost-button" (click)="openCalendarAction()" *ngIf="calendarAction">Add event</button>
          </div>
          <div class="acad-event-list">
            <article *ngFor="let event of data.calendarEvents.slice(0, 5)">
              <span>{{ event.startDate | date: 'dd' }}</span>
              <div>
                <strong>{{ event.title }}</strong>
                <small>{{ event.eventType }} · {{ event.startDate | date: 'MMM yyyy' }}</small>
              </div>
            </article>
          </div>
        </section>
      </div>
    </section>
  `
})
export class AcademicDashboardPageComponent {
  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Input() metrics: AcademicsMetric[] = [];
  @Input() insights: AcademicsInsight[] = [];
  @Input() alerts: AcademicsAlert[] = [];
  @Input() activities: AcademicsActivityItem[] = [];
  @Input() distribution: AcademicsChartSlice[] = [];
  @Input() workloads: AcademicsWorkloadItem[] = [];
  @Input() actions: AcademicsQuickAction[] = [];
  @Output() actionRequested = new EventEmitter<AcademicsQuickAction>();

  totalDistribution(distribution: AcademicsChartSlice[]): number {
    return distribution.reduce((sum, item) => sum + item.value, 0);
  }

  get calendarAction(): AcademicsQuickAction | undefined {
    return this.actions.find(action => action.actionMode === 'calendar-event');
  }

  openCalendarAction(): void {
    if (this.calendarAction) {
      this.actionRequested.emit(this.calendarAction);
    }
  }

  donutBackground(distribution: AcademicsChartSlice[]): string {
    const total = this.totalDistribution(distribution);
    if (!total) {
      return 'conic-gradient(var(--acad-primary) 0 100%)';
    }

    let cursor = 0;
    const colors: Record<string, string> = {
      primary: 'var(--acad-primary)',
      success: 'var(--acad-emerald)',
      info: 'var(--acad-blue)',
      warning: 'var(--acad-amber)',
      danger: 'var(--acad-rose)',
      neutral: 'rgba(148, 163, 184, 0.7)'
    };
    const stops = distribution.map(slice => {
      const start = cursor;
      cursor += (slice.value / total) * 100;
      return `${colors[slice.tone]} ${start}% ${cursor}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }
}
