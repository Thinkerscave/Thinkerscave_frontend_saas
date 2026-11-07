import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { MigrationCenterOverview } from '../../../models/platform.model';
import { PlatformManagementService } from '../../../services/platform-management.service';
import { formatDateTime } from '../../../utils/platform-display.util';
import {
  SaasPanelComponent,
  SaasPillComponent
} from '../../../../../shared/ui/saas';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-migration-overview-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, SaasPanelComponent, SaasPillComponent, TcPageSkeletonComponent],
  styleUrl: '../migration-center.shared.scss',
  template: `
    <div class="mc-tab">
      <tc-page-skeleton *ngIf="loading" layout="dashboard" [kpis]="3"></tc-page-skeleton>

      <div *ngIf="errorMessage" class="tc-empty-state" role="alert">
        <i class="pi pi-exclamation-triangle"></i><strong>{{ errorMessage }}</strong>
      </div>

      <ng-container *ngIf="!loading && overview as data">
        <tc-saas-panel title="Lifecycle status"
          subtitle="Application releases, Flyway database migrations and catalog synchronization progress independently">
          <div class="mc-lifecycles">
            <article class="mc-lifecycle">
              <header>
                <h3>Application Release</h3>
                <tc-saas-pill [label]="data.currentReleaseStatus || 'NONE'"
                  [tone]="statusTone(data.currentReleaseStatus)"></tc-saas-pill>
              </header>
              <div class="mc-lifecycle__value">{{ data.currentReleaseVersion || 'No release recorded' }}</div>
              <span class="mc-sub">Application {{ data.currentApplicationVersion || '—' }}</span>
              <footer>
                <span>{{ data.totalReleases }} release(s) recorded</span>
                <a routerLink="../releases">Open releases</a>
              </footer>
            </article>

            <article class="mc-lifecycle">
              <header>
                <h3>Database Migration</h3>
                <tc-saas-pill [label]="data.latestAvailableDatabaseVersion ? 'V' + data.latestAvailableDatabaseVersion : 'NO SCRIPTS'"
                  [tone]="data.latestAvailableDatabaseVersion ? 'info' : 'warning'"></tc-saas-pill>
              </header>
              <div class="mc-lifecycle__value">{{ data.databaseCurrent }} / {{ data.totalTenants }}</div>
              <span class="mc-sub">Tenants at release target {{ data.targetDatabaseVersion || '—' }}</span>
              <footer>
                <span>{{ data.databasePending }} pending · {{ data.databaseFailed }} failed</span>
                <a routerLink="../tenants">Open tenants</a>
              </footer>
            </article>

            <article class="mc-lifecycle">
              <header>
                <h3>Catalog Synchronization</h3>
                <tc-saas-pill [label]="'v' + (data.latestAvailableCatalogVersion || '0')"
                  tone="info"></tc-saas-pill>
              </header>
              <div class="mc-lifecycle__value">{{ data.catalogSynced }} / {{ data.totalTenants }}</div>
              <span class="mc-sub">Tenants at release catalog {{ data.targetCatalogVersion || '—' }}</span>
              <footer>
                <span>{{ data.catalogPending }} pending · {{ data.catalogFailed }} failed</span>
                <a routerLink="../catalog">Open catalog sync</a>
              </footer>
            </article>
          </div>
        </tc-saas-panel>

        <tc-saas-panel title="Operational readiness"
          subtitle="Derived from packaged scripts, published catalog versions and recorded executions">
          <div class="mc-kv">
            <div>
              <small>Latest packaged database script</small>
              <strong>{{ data.latestAvailableDatabaseVersion ? 'V' + data.latestAvailableDatabaseVersion : 'None discovered' }}</strong>
              <span>{{ data.migrationScripts }} script(s) discovered</span>
            </div>
            <div>
              <small>Published catalog version</small>
              <strong>v{{ data.latestAvailableCatalogVersion || '0' }}</strong>
              <span>Append-only catalog history</span>
            </div>
            <div>
              <small>Active execution jobs</small>
              <strong>{{ data.activeJobs }}</strong>
              <span>Running or queued migrations and catalog syncs</span>
            </div>
            <div>
              <small>Failed execution jobs</small>
              <strong>{{ data.failedJobs }}</strong>
              <span>Retry from Tenants or Execution Jobs</span>
            </div>
            <div>
              <small>Maintenance tenants</small>
              <strong>{{ data.maintenanceTenants }}</strong>
              <span>Traffic paused while operations run</span>
            </div>
            <div>
              <small>Last refreshed</small>
              <strong>{{ formatDateTime(data.checkedAt) }}</strong>
              <span>Backend-derived snapshot</span>
            </div>
          </div>
        </tc-saas-panel>

        <p class="mc-note">
          <i class="pi pi-info-circle"></i>
          Creating a release never deploys or migrates. Database migrations run per tenant through Flyway
          with an isolated history table, and catalog synchronization never grants feature access —
          entitlements and effective permissions remain separate.
        </p>
      </ng-container>
    </div>
  `
})
export class MigrationOverviewTabComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  errorMessage = '';
  overview: MigrationCenterOverview | null = null;

  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.api.getMigrationCenterOverview()
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: overview => { this.overview = overview; },
        error: () => { this.errorMessage = 'Unable to load the Migration Center overview.'; }
      });
  }

  statusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (!status) return 'neutral';
    if (['SUCCESS', 'HEALTHY', 'RELEASED'].includes(status)) return 'success';
    if (['FAILED', 'CRITICAL'].includes(status)) return 'danger';
    if (['RUNNING', 'READY'].includes(status)) return 'info';
    if (['PENDING', 'WARNING', 'MAINTENANCE', 'DRAFT'].includes(status)) return 'warning';
    return 'neutral';
  }
}
