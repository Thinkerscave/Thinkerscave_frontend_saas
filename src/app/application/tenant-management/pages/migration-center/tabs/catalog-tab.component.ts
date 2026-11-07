import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { CatalogOverview, TenantCatalogRow } from '../../../models/platform.model';
import { PlatformManagementService } from '../../../services/platform-management.service';
import { formatDateTime } from '../../../utils/platform-display.util';
import { SaasPanelComponent, SaasPillComponent } from '../../../../../shared/ui/saas';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-migration-catalog-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, SaasPanelComponent, SaasPillComponent, TcPageSkeletonComponent],
  styleUrl: '../migration-center.shared.scss',
  template: `
    <div class="mc-tab">
      <tc-page-skeleton *ngIf="loading && !catalog" layout="dashboard" [kpis]="4"></tc-page-skeleton>

      <ng-container *ngIf="catalog as data">
        <tc-saas-panel title="Catalog synchronization"
          subtitle="Independent from releases and database migrations. Catalog sync copies definitions; it never grants access.">
          <div class="mc-summary-strip">
            <div><small>Published version</small><strong>v{{ data.latestCatalogVersion || '0' }}</strong></div>
            <div><small>Release target</small><strong>{{ data.status.targetCatalogVersion || '—' }}</strong></div>
            <div><small>Synchronized</small><strong>{{ data.status.synchronizedTenants }} / {{ data.status.totalTenants }}</strong></div>
            <div><small>Pending</small><strong>{{ data.status.pendingTenants }}</strong></div>
            <div><small>Failed</small><strong>{{ data.status.failedTenants }}</strong></div>
            <div><small>Checked</small><strong>{{ formatDateTime(data.checkedAt) }}</strong></div>
          </div>
        </tc-saas-panel>

        <tc-saas-panel title="Tenant catalog state" subtitle="Applied version compared with the release catalog target">
          <div class="tc-table-wrap">
            <table class="saas-data-table mc-table">
              <thead>
                <tr>
                  <th>Organization</th><th>Tenant</th><th>Schema</th><th>Catalog</th>
                  <th>Target</th><th>Sync status</th><th>Last error</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tenant of data.tenants; trackBy: trackTenant">
                  <td><strong>{{ tenant.organizationName || '—' }}</strong></td>
                  <td><code>{{ tenant.tenantIdentifier }}</code></td>
                  <td><code>{{ tenant.schemaName }}</code></td>
                  <td>{{ tenant.catalogVersion || '—' }}</td>
                  <td>{{ tenant.targetCatalogVersion || '—' }}</td>
                  <td><tc-saas-pill [label]="tenant.syncStatus" [tone]="statusTone(tenant.syncStatus)"></tc-saas-pill></td>
                  <td class="mc-error-cell">{{ tenant.errorMessage || '—' }}</td>
                  <td>
                    <a class="tc-btn tc-btn--sm"
                      [routerLink]="['/app/tenant-management/migration-center/tenants', tenant.tenantId]">
                      Open tenant
                    </a>
                  </td>
                </tr>
                <tr *ngIf="!data.tenants.length">
                  <td colspan="8" class="empty">No provisioned tenants were returned.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </tc-saas-panel>

        <tc-saas-panel title="Catalog version history" subtitle="Append-only, publisher-attributed catalog changes">
          <div class="tc-table-wrap">
            <table class="saas-data-table mc-table">
              <thead>
                <tr><th>Version</th><th>Change</th><th>Entity type</th><th>Entity key</th><th>Publisher</th><th>Published</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let version of data.versions; trackBy: trackVersion">
                  <td><strong>v{{ version.versionNumber }}</strong></td>
                  <td>{{ version.changeType }}</td>
                  <td>{{ version.entityType }}</td>
                  <td><code>{{ version.entityKey }}</code></td>
                  <td>{{ version.createdBy || 'system' }}</td>
                  <td>{{ formatDateTime(version.createdOn) }}</td>
                </tr>
                <tr *ngIf="!data.versions.length">
                  <td colspan="6" class="empty">No catalog versions recorded.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </tc-saas-panel>

        <p class="mc-note">
          <i class="pi pi-info-circle"></i>
          Catalog synchronization preserves tenant-specific roles, assignments and overrides. Retry a failed
          tenant sync from its tenant details page.
        </p>
      </ng-container>
    </div>
  `
})
export class MigrationCatalogTabComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  catalog: CatalogOverview | null = null;
  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getMigrationCenterCatalog()
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: catalog => { this.catalog = catalog; },
        error: () => { this.catalog = null; }
      });
  }

  statusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (!status) return 'neutral';
    if (status === 'SUCCESS') return 'success';
    if (status === 'FAILED') return 'danger';
    if (status === 'RUNNING') return 'info';
    if (status === 'PENDING') return 'warning';
    return 'neutral';
  }

  trackTenant(_: number, tenant: TenantCatalogRow): number { return tenant.tenantId; }
  trackVersion(_: number, version: { versionNumber: number }): number { return version.versionNumber; }
}
