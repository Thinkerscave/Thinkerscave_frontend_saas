import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MigrationAuditEvent } from '../../../models/platform.model';
import { PlatformManagementService } from '../../../services/platform-management.service';
import { formatDateTime } from '../../../utils/platform-display.util';
import { SaasPanelComponent, SaasPillComponent } from '../../../../../shared/ui/saas';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { AppPaginatorComponent } from '../../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../../shared/config/ui-standards';
import { AppPageChangeEvent } from '../../../../../shared/utils/paged-result.util';

@Component({
  selector: 'app-migration-history-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, SaasPanelComponent, SaasPillComponent, TcPageSkeletonComponent,
    AppPaginatorComponent
  ],
  styleUrl: '../migration-center.shared.scss',
  template: `
    <div class="mc-tab">
      <div class="mc-toolbar">
        <div class="mc-toolbar__group">
          <label class="mc-search">
            <i class="pi pi-search"></i>
            <input [(ngModel)]="search" (keyup.enter)="applyFilters()"
              placeholder="Search tenant, entity or details">
          </label>
          <select class="tc-select" [(ngModel)]="eventType" (ngModelChange)="applyFilters()">
            <option value="">All events</option>
            <option value="RELEASE_CREATED">Release created</option>
            <option value="RELEASE_EXECUTION_STARTED">Release execution started</option>
            <option value="RELEASE_EXECUTION_COMPLETED">Release execution completed</option>
            <option value="RELEASE_EXECUTION_FAILED">Release execution failed</option>
            <option value="TENANT_MIGRATION_STARTED">Migration started</option>
            <option value="TENANT_MIGRATION_COMPLETED">Migration completed</option>
            <option value="TENANT_MIGRATION_FAILED">Migration failed</option>
            <option value="TENANT_MAINTENANCE_ENABLED">Maintenance enabled</option>
            <option value="TENANT_MAINTENANCE_DISABLED">Maintenance disabled</option>
          </select>
        </div>
        <div class="mc-toolbar__group">
          <button type="button" class="tc-btn tc-btn--sm" (click)="load()" [disabled]="loading">
            <i class="pi pi-refresh" [class.pi-spin]="loading"></i> Refresh
          </button>
        </div>
      </div>

      <tc-page-skeleton *ngIf="loading && !events.length" layout="table-only" [rows]="8"></tc-page-skeleton>

      <tc-saas-panel title="Migration and release history"
        subtitle="Append-only operational audit events recorded by the platform">
        <div class="tc-table-wrap">
          <table class="saas-data-table mc-table mc-table--wide">
            <thead>
              <tr>
                <th>When</th><th>Event</th><th>Actor</th><th>Tenant</th><th>Entity</th>
                <th>Status</th><th>Target</th><th>Details</th><th>Error</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let event of events; trackBy: trackEvent">
                <td>{{ formatDateTime(event.createdAt) }}</td>
                <td><code>{{ event.eventType }}</code></td>
                <td>{{ event.actor || 'system' }}</td>
                <td>{{ event.tenantIdentifier || '—' }}</td>
                <td>{{ event.entityType || '—' }}{{ event.entityId ? ' #' + event.entityId : '' }}</td>
                <td><tc-saas-pill [label]="event.status" [tone]="statusTone(event.status)"></tc-saas-pill></td>
                <td>{{ event.targetVersion || '—' }}</td>
                <td>{{ event.details || '—' }}</td>
                <td class="mc-error-cell">{{ event.errorMessage || '—' }}</td>
              </tr>
              <tr *ngIf="!events.length">
                <td colspan="9" class="empty">No history events match the current filters.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-paginator [page]="page" [rows]="pageSize" [totalRecords]="total"
          [pageSizeOptions]="pageSizeOptions" noun="events"
          (pageChange)="onPageChange($event)"></app-paginator>
      </tc-saas-panel>

      <p class="mc-note">
        <i class="pi pi-info-circle"></i>
        Applied Flyway versioned migrations are never edited or removed. Failed attempts stay in history with
        their error message for audit and retry traceability.
      </p>
    </div>
  `
})
export class MigrationHistoryTabComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  events: MigrationAuditEvent[] = [];
  eventType = '';
  search = '';
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  total = 0;
  readonly pageSizeOptions = UI_PAGINATION.options;
  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getMigrationCenterHistory(this.page, this.pageSize, {
      eventType: this.eventType || undefined,
      search: this.search.trim() || undefined
    })
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: result => { this.events = result.content; this.total = result.totalElements; },
        error: () => { this.events = []; this.total = 0; }
      });
  }

  applyFilters(): void {
    this.page = 0;
    this.load();
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    this.pageSize = event.rows;
    this.load();
  }

  statusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (!status) return 'neutral';
    if (status === 'SUCCESS') return 'success';
    if (status === 'FAILED') return 'danger';
    if (status === 'RUNNING') return 'info';
    if (status === 'PENDING') return 'warning';
    return 'neutral';
  }

  trackEvent(_: number, event: MigrationAuditEvent): number { return event.id; }
}
