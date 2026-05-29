import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  AdminActivity,
  AdminAuditEvent,
  AdminBranch,
  AdminKpi,
  AdminMonitoringWidget,
  AdminOrganization,
  AdminPermissionMatrixRow,
  AdminSection
} from '../../models/admin-control.model';

@Component({
  selector: 'tc-admin-nav',
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

@Component({
  selector: 'tc-admin-organization-drawer',
  standalone: true,
  imports: [CommonModule, AdminStatusBadgeComponent],
  template: `
    <aside class="admin-drawer" [class.is-open]="open" aria-live="polite">
      <div class="admin-drawer-panel" *ngIf="organization">
        <header>
          <div>
            <span>Organization profile</span>
            <h2>{{ organization.orgName }}</h2>
          </div>
          <button type="button" class="admin-icon-button" (click)="closed.emit()" aria-label="Close panel">
            <i class="pi pi-times"></i>
          </button>
        </header>
        <div class="organization-drawer-hero">
          <strong>{{ organization.brandName || organization.orgCode }}</strong>
          <tc-admin-status-badge [label]="organization.active ? 'ACTIVE' : 'SUSPENDED'" [tone]="organization.active ? 'success' : 'danger'"></tc-admin-status-badge>
        </div>
        <div class="drawer-tabs">
          <button type="button" [class.is-active]="activeTab === 'profile'" (click)="activeTab = 'profile'">Profile</button>
          <button type="button" [class.is-active]="activeTab === 'branches'" (click)="activeTab = 'branches'">Branches</button>
          <button type="button" [class.is-active]="activeTab === 'subscription'" (click)="activeTab = 'subscription'">Subscription</button>
          <button type="button" [class.is-active]="activeTab === 'branding'" (click)="activeTab = 'branding'">Branding</button>
        </div>
        <section class="drawer-section" *ngIf="activeTab === 'profile'">
          <dl class="drawer-definition-grid">
            <div><dt>Type</dt><dd>{{ organization.orgType || 'School' }}</dd></div>
            <div><dt>Tenant</dt><dd>{{ organization.tenantId || 'public' }}</dd></div>
            <div><dt>Location</dt><dd>{{ organization.city || 'N/A' }}, {{ organization.state || 'N/A' }}</dd></div>
            <div><dt>Owner</dt><dd>{{ organization.ownerName || 'N/A' }}</dd></div>
            <div><dt>Owner Email</dt><dd>{{ organization.ownerEmail || 'N/A' }}</dd></div>
            <div><dt>Health</dt><dd>{{ organization.healthScore }}%</dd></div>
          </dl>
        </section>
        <section class="drawer-section" *ngIf="activeTab === 'branches'">
          <article class="drawer-mini-card" *ngFor="let branch of branches">
            <div>
              <strong>{{ branch.branchName }}</strong>
              <small>{{ branch.location || branch.branchCode }}</small>
            </div>
            <tc-admin-status-badge [label]="branch.active ? 'ACTIVE' : 'INACTIVE'" [tone]="branch.active ? 'success' : 'warning'"></tc-admin-status-badge>
          </article>
        </section>
        <section class="drawer-section" *ngIf="activeTab === 'subscription'">
          <dl class="drawer-definition-grid">
            <div><dt>Plan</dt><dd>{{ organization.subscriptionType || 'STANDARD' }}</dd></div>
            <div><dt>Active Users</dt><dd>{{ organization.activeUsers }}</dd></div>
            <div><dt>API Usage</dt><dd>{{ organization.apiUsageToday }}</dd></div>
            <div><dt>Storage</dt><dd>{{ organization.storageUsedMb }} / {{ organization.storageLimitMb }} MB</dd></div>
          </dl>
        </section>
        <section class="drawer-section" *ngIf="activeTab === 'branding'">
          <div class="branding-preview">
            <span>{{ initials(organization) }}</span>
            <div>
              <strong>{{ organization.brandName || organization.orgName }}</strong>
              <small>{{ organization.orgCode }}</small>
            </div>
          </div>
        </section>
      </div>
    </aside>
  `
})
export class AdminOrganizationDrawerComponent {
  @Input() open = false;
  @Input() organization: AdminOrganization | null = null;
  @Input() branches: AdminBranch[] = [];
  @Output() closed = new EventEmitter<void>();
  activeTab: 'profile' | 'branches' | 'subscription' | 'branding' = 'profile';

  initials(organization: AdminOrganization): string {
    return (organization.brandName || organization.orgName || 'TC')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  }
}