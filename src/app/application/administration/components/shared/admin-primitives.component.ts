import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  AdminActivity,
  AdminAuditEvent,
  AdminKpi,
  AdminMonitoringWidget,
  AdminPermissionMatrixRow,
  AdminSection
} from '../../models/admin-control.model';

@Component({
  selector: 'tc-admin-nav',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="admin-nav" aria-label="Administration navigation">
      <a *ngFor="let item of items" [routerLink]="item.route" routerLinkActive="is-active" class="admin-nav-item">
        <i [class]="item.icon"></i>
        <span>{{ item.label }}</span>
        <small>{{ item.description }}</small>
      </a>
    </nav>
  `
})
export class AdminNavComponent {
  @Input() items: AdminSection[] = [];
}

@Component({
  selector: 'tc-admin-kpi-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="admin-kpi-card" [attr.data-tone]="metric.tone">
      <span class="admin-kpi-icon"><i [class]="metric.icon"></i></span>
      <div>
        <small>{{ metric.label }}</small>
        <strong>{{ metric.value }}</strong>
        <em>{{ metric.helper }}</em>
      </div>
    </article>
  `
})
export class AdminKpiCardComponent {
  @Input({ required: true }) metric!: AdminKpi;
}

@Component({
  selector: 'tc-admin-status-badge',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `<span class="admin-status-badge" [attr.data-tone]="tone"><i [class]="icon"></i>{{ label }}</span>`
})
export class AdminStatusBadgeComponent {
  @Input() label = 'Active';
  @Input() tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'success';
  @Input() icon = 'pi pi-circle-fill';
}

@Component({
  selector: 'tc-admin-monitoring-widget',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, AdminStatusBadgeComponent],
  template: `
    <article class="admin-monitor-widget" [attr.data-tone]="widget.tone">
      <header>
        <span><i [class]="widget.icon"></i></span>
        <tc-admin-status-badge [label]="widget.status" [tone]="widget.tone" icon="pi pi-sparkles"></tc-admin-status-badge>
      </header>
      <small>{{ widget.label }}</small>
      <strong>{{ widget.value }}</strong>
      <p>{{ widget.helper }}</p>
    </article>
  `
})
export class AdminMonitoringWidgetComponent {
  @Input({ required: true }) widget!: AdminMonitoringWidget;
}

@Component({
  selector: 'tc-admin-activity-timeline',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="admin-panel admin-timeline-panel">
      <header class="admin-section-header">
        <div>
          <span>{{ eyebrow }}</span>
          <h2>{{ title }}</h2>
        </div>
      </header>
      <div *ngIf="!items.length" class="admin-empty-state">
        <span><i class="pi pi-history"></i></span>
        <strong>No activity available</strong>
      </div>
      <div class="admin-timeline" *ngIf="items.length">
        <article *ngFor="let item of items" [attr.data-tone]="item.tone">
          <span><i [class]="item.icon"></i></span>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
            <small>{{ item.actor }} · {{ item.occurredAt | date:'medium' }}</small>
          </div>
        </article>
      </div>
    </section>
  `
})
export class AdminActivityTimelineComponent {
  @Input() eyebrow = 'Administrative activity';
  @Input() title = 'Recent activity';
  @Input() items: AdminActivity[] = [];
}

@Component({
  selector: 'tc-admin-permission-matrix',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="admin-panel permission-matrix-panel">
      <header class="admin-section-header">
        <div>
          <span>Permission matrix</span>
          <h2>Role Coverage</h2>
        </div>
      </header>
      <div class="permission-matrix">
        <article class="permission-row" *ngFor="let role of rows">
          <div class="permission-role">
            <strong>{{ role.roleName }}</strong>
            <small>{{ role.roleCode }}</small>
          </div>
          <div class="permission-cells">
            <div class="permission-cell" *ngFor="let permission of role.permissions" [class.is-assigned]="permission.assigned">
              <span>{{ permission.privilegeName }}</span>
              <strong>{{ permission.assignedPages }}</strong>
              <small>/ {{ permission.totalPages }} pages</small>
            </div>
          </div>
        </article>
      </div>
    </section>
  `
})
export class AdminPermissionMatrixComponent {
  @Input() rows: AdminPermissionMatrixRow[] = [];
}

@Component({
  selector: 'tc-admin-audit-table',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, AdminStatusBadgeComponent],
  template: `
    <section class="admin-panel admin-table-panel">
      <header class="admin-section-header">
        <div>
          <span>{{ eyebrow }}</span>
          <h2>{{ title }}</h2>
        </div>
      </header>
      <div class="admin-table-wrap" *ngIf="items.length; else emptyState">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Entity</th>
              <th>Actor</th>
              <th>Source</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items" (click)="selected.emit(item)">
              <td>
                <tc-admin-status-badge [label]="item.eventType" [tone]="toneForEvent(item.eventType)" icon="pi pi-history"></tc-admin-status-badge>
                <strong>{{ item.action }}</strong>
                <small>{{ item.summary }}</small>
              </td>
              <td>{{ item.entityType || 'System' }} <small>{{ item.entityId }}</small></td>
              <td>{{ item.actorUsername || 'System' }}</td>
              <td>{{ item.sourceIp || 'Internal' }}</td>
              <td>{{ item.occurredAt | date:'short' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ng-template #emptyState>
        <div class="admin-empty-state compact">
          <span><i class="pi pi-history"></i></span>
          <strong>No audit rows found</strong>
        </div>
      </ng-template>
    </section>
  `
})
export class AdminAuditTableComponent {
  @Input() eyebrow = 'Audit explorer';
  @Input() title = 'Audit Logs';
  @Input() items: AdminAuditEvent[] = [];
  @Output() selected = new EventEmitter<AdminAuditEvent>();

  toneForEvent(eventType?: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (eventType === 'DELETE' || eventType === 'REJECTION') {
      return 'danger';
    }
    if (eventType === 'CONFIG_CHANGE' || eventType === 'STATE_CHANGE') {
      return 'warning';
    }
    if (eventType === 'CREATE' || eventType === 'APPROVAL') {
      return 'success';
    }
    return 'info';
  }
}
