import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { TenantReleaseOperation } from '../../../models/platform.model';
import { PlatformManagementService } from '../../../services/platform-management.service';
import { formatDateTime } from '../../../utils/platform-display.util';
import { SaasPanelComponent, SaasPillComponent } from '../../../../../shared/ui/saas';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { AppPaginatorComponent } from '../../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../../shared/config/ui-standards';
import { AppPageChangeEvent } from '../../../../../shared/utils/paged-result.util';

type TenantFilter = 'all' | 'current' | 'pending' | 'failed' | 'maintenance';

@Component({
  selector: 'app-migration-tenants-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule, SaasPanelComponent, SaasPillComponent,
    TcPageSkeletonComponent, AppPaginatorComponent
  ],
  styleUrl: '../migration-center.shared.scss',
  template: `
    <div class="mc-tab">
      <div class="mc-toolbar">
        <div class="mc-toolbar__group">
          <label class="mc-search">
            <i class="pi pi-search"></i>
            <input [(ngModel)]="search" (keyup.enter)="applySearch()"
              placeholder="Search organization, tenant identifier or schema">
          </label>
          <button type="button" class="tc-btn tc-btn--sm" (click)="applySearch()">Search</button>
        </div>
        <div class="mc-toolbar__group">
          <div class="mc-filters">
            <button type="button" *ngFor="let option of filterOptions"
              [class.is-active]="filter === option.key" (click)="setFilter(option.key)">
              {{ option.label }}
            </button>
          </div>
          <button type="button" class="tc-btn tc-btn--sm" (click)="load()" [disabled]="loading">
            <i class="pi pi-refresh" [class.pi-spin]="loading"></i> Refresh
          </button>
        </div>
      </div>

      <tc-page-skeleton *ngIf="loading && !tenants.length" layout="directory-table" [kpis]="0"
        [showKpis]="false" [rows]="8"></tc-page-skeleton>

      <tc-saas-panel title="Tenant database and catalog state"
        subtitle="Consolidated tenant health, Flyway database version, catalog version and maintenance state">
        <div class="tc-table-wrap">
          <table class="saas-data-table mc-table mc-table--wide">
            <thead>
              <tr>
                <th>Organization</th><th>Tenant</th><th>Schema</th><th>Application</th>
                <th>Database / target</th><th>Catalog / target</th><th>Migration</th>
                <th>Catalog sync</th><th>Health</th><th>Maintenance</th><th>Last migration</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tenant of visibleTenants; trackBy: trackTenant">
                <td><strong>{{ tenant.organizationName }}</strong></td>
                <td><code>{{ tenant.tenantIdentifier }}</code></td>
                <td><code>{{ tenant.schemaName }}</code></td>
                <td>{{ tenant.applicationVersion || '—' }}</td>
                <td>V{{ tenant.databaseVersion || '—' }} / V{{ tenant.targetDatabaseVersion || '—' }}</td>
                <td>{{ tenant.catalogVersion || '—' }} / {{ tenant.targetCatalogVersion || '—' }}</td>
                <td><tc-saas-pill [label]="tenant.migrationStatus"
                  [tone]="statusTone(tenant.migrationStatus)"></tc-saas-pill></td>
                <td><tc-saas-pill [label]="tenant.catalogSyncStatus"
                  [tone]="statusTone(tenant.catalogSyncStatus)"></tc-saas-pill></td>
                <td><tc-saas-pill [label]="tenant.healthStatus"
                  [tone]="statusTone(tenant.healthStatus)"></tc-saas-pill></td>
                <td><tc-saas-pill [label]="tenant.maintenanceMode ? 'ON' : 'OFF'"
                  [tone]="tenant.maintenanceMode ? 'warning' : 'neutral'"></tc-saas-pill></td>
                <td>{{ formatDateTime(tenant.lastMigrationAt) }}</td>
                <td>
                  <a class="tc-btn tc-btn--sm"
                    [routerLink]="['/app/tenant-management/migration-center/tenants', tenant.tenantId]">
                    Details &amp; health
                  </a>
                </td>
              </tr>
              <tr *ngIf="!visibleTenants.length">
                <td colspan="12" class="empty">
                  {{ tenants.length ? 'No tenants on this page match the selected filter.' : 'No tenant operations found.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-paginator [page]="page" [rows]="pageSize" [totalRecords]="total"
          [pageSizeOptions]="pageSizeOptions" noun="tenants"
          (pageChange)="onPageChange($event)"></app-paginator>
      </tc-saas-panel>

      <p class="mc-note">
        <i class="pi pi-info-circle"></i>
        This tab replaces the former standalone Tenant Health page. Health, storage and version checks are
        returned by the same backend tenant health service, alongside the migration and catalog state.
      </p>
    </div>
  `
})
export class MigrationTenantsTabComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  loading = true;
  search = '';
  filter: TenantFilter = 'all';
  tenants: TenantReleaseOperation[] = [];
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  total = 0;
  readonly pageSizeOptions = UI_PAGINATION.options;
  readonly formatDateTime = formatDateTime;
  readonly filterOptions: { key: TenantFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'current', label: 'Database current' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
    { key: 'maintenance', label: 'Maintenance' }
  ];

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const requested = params.get('filter');
      this.filter = this.filterOptions.some(option => option.key === requested)
        ? requested as TenantFilter : 'all';
      this.load();
    });
  }

  get visibleTenants(): TenantReleaseOperation[] {
    switch (this.filter) {
      case 'current': return this.tenants.filter(tenant =>
        !!tenant.databaseVersion && tenant.databaseVersion === tenant.targetDatabaseVersion);
      case 'pending': return this.tenants.filter(tenant =>
        tenant.migrationStatus === 'PENDING' || tenant.migrationStatus === 'RUNNING');
      case 'failed': return this.tenants.filter(tenant => tenant.migrationStatus === 'FAILED');
      case 'maintenance': return this.tenants.filter(tenant => tenant.maintenanceMode);
      default: return this.tenants;
    }
  }

  load(): void {
    this.loading = true;
    this.api.getMigrationCenterTenants(this.page, this.pageSize, this.search.trim() || undefined)
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: result => {
          this.tenants = result.content;
          this.total = result.totalElements;
        },
        error: () => { this.tenants = []; this.total = 0; }
      });
  }

  applySearch(): void {
    this.page = 0;
    this.load();
  }

  setFilter(filter: TenantFilter): void {
    this.filter = filter;
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    this.pageSize = event.rows;
    this.load();
  }

  statusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (!status) return 'neutral';
    if (['SUCCESS', 'HEALTHY'].includes(status)) return 'success';
    if (['FAILED', 'CRITICAL'].includes(status)) return 'danger';
    if (status === 'RUNNING') return 'info';
    if (['PENDING', 'WARNING', 'MAINTENANCE'].includes(status)) return 'warning';
    return 'neutral';
  }

  trackTenant(_: number, tenant: TenantReleaseOperation): number { return tenant.tenantId; }
}
