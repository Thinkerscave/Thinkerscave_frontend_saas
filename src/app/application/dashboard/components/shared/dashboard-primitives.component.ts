import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DashboardActionTarget,
  DashboardActivity,
  DashboardAlert,
  DashboardApproval,
  DashboardKpi,
  DashboardPriority,
  DashboardQuickAction,
  DashboardSearchResult,
  DashboardShortcut,
  DashboardWorkspace
} from '../../models/dashboard-workspace.model';

@Component({
  selector: 'tc-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="dash-kpi-card" [attr.data-tone]="metric.tone">
      <span class="dash-card-icon"><i [class]="metric.icon"></i></span>
      <div>
        <small>{{ metric.label }}</small>
        <strong>{{ metric.value }}</strong>
        <em>{{ metric.helper }}</em>
      </div>
    </article>
  `
})
export class KpiCardComponent {
  @Input({ required: true }) metric!: DashboardKpi;
}

@Component({
  selector: 'tc-quick-action-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dash-panel dash-actions-panel">
      <header class="dash-section-header">
        <div>
          <span>Quick actions</span>
          <h2>Start Work</h2>
        </div>
      </header>
      <div class="dash-action-grid" *ngIf="items.length; else emptyState">
        <button type="button" *ngFor="let action of items; trackBy: trackByKey" class="dash-action-button" [attr.data-tone]="action.tone" (click)="selected.emit(action)">
          <span><i [class]="action.icon"></i></span>
          <strong>{{ action.label }}</strong>
          <small>{{ action.description }}</small>
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
  selector: 'tc-approval-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dash-panel">
      <header class="dash-section-header">
        <div>
          <span>Pending approvals</span>
          <h2>Decision Queue</h2>
        </div>
        <strong class="dash-count-pill">{{ items.length }}</strong>
      </header>
      <div class="dash-list" *ngIf="items.length; else emptyState">
        <button type="button" class="dash-list-item" *ngFor="let item of items; trackBy: trackByKey" [attr.data-tone]="item.tone" (click)="selected.emit(item)">
          <span class="dash-mini-icon"><i class="pi pi-check-square"></i></span>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
            <small>{{ item.requester || 'System' }} · {{ item.status }}</small>
          </div>
        </button>
      </div>
      <ng-template #emptyState>
        <div class="dash-empty-state compact"><i class="pi pi-check-circle"></i><strong>No approvals waiting</strong></div>
      </ng-template>
    </section>
  `
})
export class ApprovalCenterComponent {
  @Input() items: DashboardApproval[] = [];
  @Output() selected = new EventEmitter<DashboardApproval>();

  trackByKey(index: number, item: DashboardApproval): string | number {
    return item.key || index;
  }
}

@Component({
  selector: 'tc-alert-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dash-panel">
      <header class="dash-section-header">
        <div>
          <span>Smart alerts</span>
          <h2>Needs Attention</h2>
        </div>
        <strong class="dash-count-pill">{{ items.length }}</strong>
      </header>
      <div class="dash-list" *ngIf="items.length; else emptyState">
        <button type="button" class="dash-list-item" *ngFor="let alert of items; trackBy: trackByKey" [attr.data-tone]="alert.tone" (click)="selected.emit(alert)">
          <span class="dash-mini-icon"><i [class]="alert.icon"></i></span>
          <div>
            <strong>{{ alert.title }}</strong>
            <p>{{ alert.description }}</p>
            <small>{{ alert.severity }}</small>
          </div>
        </button>
      </div>
      <ng-template #emptyState>
        <div class="dash-empty-state compact"><i class="pi pi-shield"></i><strong>No smart alerts</strong></div>
      </ng-template>
    </section>
  `
})
export class AlertCenterComponent {
  @Input() items: DashboardAlert[] = [];
  @Output() selected = new EventEmitter<DashboardAlert>();

  trackByKey(index: number, item: DashboardAlert): string | number {
    return item.key || index;
  }
}

@Component({
  selector: 'tc-activity-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dash-panel dash-activity-panel">
      <header class="dash-section-header">
        <div>
          <span>Recent activity</span>
          <h2>Latest Updates</h2>
        </div>
      </header>
      <div class="dash-timeline" *ngIf="items.length; else emptyState">
        <button type="button" *ngFor="let item of items; trackBy: trackByKey" [attr.data-tone]="item.tone" (click)="selected.emit(item)">
          <span><i [class]="item.icon"></i></span>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
            <small>{{ item.actor }} · {{ item.occurredAt | date:'short' }}</small>
          </div>
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
}

@Component({
  selector: 'tc-widget-registry',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dash-panel dash-shortcuts-panel">
      <header class="dash-section-header">
        <div>
          <span>Module shortcuts</span>
          <h2>Workspaces</h2>
        </div>
      </header>
      <div class="dash-shortcut-grid" *ngIf="items.length; else emptyState">
        <button type="button" *ngFor="let item of items; trackBy: trackByKey" class="dash-shortcut" [attr.data-tone]="item.tone" (click)="selected.emit(item)">
          <span><i [class]="item.icon"></i></span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.description }}</small>
          <em *ngIf="item.count !== null">{{ item.count }}</em>
        </button>
      </div>
      <ng-template #emptyState>
        <div class="dash-empty-state compact"><i class="pi pi-th-large"></i><strong>No shortcuts available</strong></div>
      </ng-template>
    </section>
  `
})
export class WidgetRegistryComponent {
  @Input() items: DashboardShortcut[] = [];
  @Output() selected = new EventEmitter<DashboardShortcut>();

  trackByKey(index: number, item: DashboardShortcut): string | number {
    return item.key || index;
  }
}

@Component({
  selector: 'tc-role-dashboard-renderer',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, QuickActionPanelComponent, ApprovalCenterComponent, AlertCenterComponent, ActivityFeedComponent, WidgetRegistryComponent],
  template: `
    <div class="dash-renderer">
      <tc-quick-action-panel [items]="workspace.quickActions" (selected)="actionSelected.emit($event)"></tc-quick-action-panel>

      <section class="dash-kpi-grid" aria-label="Important KPIs">
        <tc-kpi-card *ngFor="let metric of workspace.kpis; trackBy: trackByKpi" [metric]="metric"></tc-kpi-card>
      </section>

      <section class="dash-panel dash-priority-panel">
        <header class="dash-section-header">
          <div>
            <span>Today’s priorities</span>
            <h2>Next Best Actions</h2>
          </div>
        </header>
        <div class="dash-priority-stack" *ngIf="workspace.priorities.length; else emptyPriorities">
          <button type="button" *ngFor="let priority of workspace.priorities; trackBy: trackByPriority" [attr.data-tone]="priority.tone" (click)="actionSelected.emit(priority)">
            <span><i [class]="priority.icon"></i></span>
            <div>
              <strong>{{ priority.title }}</strong>
              <p>{{ priority.description }}</p>
              <small>{{ priority.dueLabel }}</small>
            </div>
          </button>
        </div>
        <ng-template #emptyPriorities>
          <div class="dash-empty-state compact"><i class="pi pi-check-circle"></i><strong>No urgent priorities</strong></div>
        </ng-template>
      </section>

      <div class="dash-two-column">
        <tc-approval-center [items]="workspace.pendingApprovals" (selected)="actionSelected.emit($event)"></tc-approval-center>
        <tc-alert-center [items]="workspace.smartAlerts" (selected)="actionSelected.emit($event)"></tc-alert-center>
      </div>

      <div class="dash-two-column wide-left">
        <tc-activity-feed [items]="workspace.recentActivities" (selected)="actionSelected.emit($event)"></tc-activity-feed>
        <tc-widget-registry [items]="workspace.moduleShortcuts" (selected)="actionSelected.emit($event)"></tc-widget-registry>
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

  trackByPriority(index: number, item: DashboardPriority): string | number {
    return item.key || index;
  }
}

@Component({
  selector: 'tc-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RoleDashboardRendererComponent],
  template: `
    <section class="role-dashboard-workspace">
      <div *ngIf="loading" class="dash-loading-state">
        <span><i class="pi pi-spin pi-spinner"></i></span>
        <strong>Loading dashboard</strong>
      </div>

      <div *ngIf="!loading && error" class="dash-error-state">
        <span><i class="pi pi-exclamation-triangle"></i></span>
        <strong>{{ error }}</strong>
        <button type="button" class="dash-command-button" (click)="refresh.emit()"><i class="pi pi-refresh"></i>Retry</button>
      </div>

      <ng-container *ngIf="!loading && !error && workspace as data">
        <header class="dash-hero">
          <div class="dash-hero-copy">
            <span class="dash-eyebrow">{{ data.context.primaryRoleName }} · {{ data.context.organizationName }}</span>
            <h1>{{ data.context.welcomeTitle }}</h1>
            <p>{{ data.context.focusMessage }}</p>
          </div>
          <div class="dash-hero-tools">
            <button type="button" class="dash-icon-button" (click)="refresh.emit()" aria-label="Refresh dashboard">
              <i class="pi pi-refresh"></i>
            </button>
          </div>
          <div class="dash-search-box">
            <i class="pi pi-search"></i>
            <input #searchInput type="search" [value]="searchQuery" [placeholder]="data.search.placeholder" (input)="searchChanged.emit(searchInput.value)" />
            <span *ngIf="searchLoading" class="dash-search-spinner"><i class="pi pi-spin pi-spinner"></i></span>
          </div>
          <div class="dash-search-results" *ngIf="searchQuery.length > 1 || searchResults.length">
            <div class="dash-search-categories">
              <span *ngFor="let category of data.search.categories">{{ category }}</span>
            </div>
            <div class="dash-result-list" *ngIf="searchResults.length; else noResults">
              <button type="button" *ngFor="let result of searchResults; trackBy: trackByResult" [attr.data-tone]="result.tone" (click)="resultSelected.emit(result)">
                <span><i [class]="result.icon"></i></span>
                <div>
                  <strong>{{ result.title }}</strong>
                  <small>{{ result.entityType }} · {{ result.subtitle || result.entityId }}</small>
                  <p>{{ result.detail }}</p>
                </div>
              </button>
            </div>
            <ng-template #noResults>
              <div class="dash-empty-state compact search"><i class="pi pi-search"></i><strong>No matching records</strong></div>
            </ng-template>
          </div>
        </header>

        <tc-role-dashboard-renderer [workspace]="data" (actionSelected)="actionSelected.emit($event)"></tc-role-dashboard-renderer>

        <aside class="dash-detail-drawer" [class.is-open]="!!selectedResult" aria-live="polite">
          <div class="dash-detail-panel" *ngIf="selectedResult as result">
            <header>
              <div>
                <span>{{ result.entityType }}</span>
                <h2>{{ result.title }}</h2>
              </div>
              <button type="button" class="dash-icon-button" (click)="closeResult.emit()" aria-label="Close details">
                <i class="pi pi-times"></i>
              </button>
            </header>
            <div class="dash-detail-hero" [attr.data-tone]="result.tone">
              <span><i [class]="result.icon"></i></span>
              <div>
                <strong>{{ result.subtitle || result.entityId }}</strong>
                <p>{{ result.detail }}</p>
              </div>
            </div>
            <dl class="dash-detail-grid" *ngIf="metadataEntries(result).length">
              <div *ngFor="let entry of metadataEntries(result)">
                <dt>{{ entry.key }}</dt>
                <dd>{{ entry.value }}</dd>
              </div>
            </dl>
            <button type="button" class="dash-command-button primary" *ngIf="result.route" (click)="openRoute.emit(result.route)">
              <i class="pi pi-arrow-up-right"></i>Open workspace
            </button>
          </div>
        </aside>
      </ng-container>
    </section>
  `
})
export class DashboardLayoutComponent {
  @Input() workspace: DashboardWorkspace | null = null;
  @Input() loading = false;
  @Input() error = '';
  @Input() searchQuery = '';
  @Input() searchResults: DashboardSearchResult[] = [];
  @Input() searchLoading = false;
  @Input() selectedResult: DashboardSearchResult | null = null;
  @Output() refresh = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() actionSelected = new EventEmitter<DashboardActionTarget>();
  @Output() resultSelected = new EventEmitter<DashboardSearchResult>();
  @Output() closeResult = new EventEmitter<void>();
  @Output() openRoute = new EventEmitter<string>();

  trackByResult(index: number, item: DashboardSearchResult): string | number {
    return item.key || index;
  }

  metadataEntries(result: DashboardSearchResult): Array<{ key: string; value: unknown }> {
    return Object.entries(result.metadata || {}).map(([key, value]) => ({ key, value }));
  }
}