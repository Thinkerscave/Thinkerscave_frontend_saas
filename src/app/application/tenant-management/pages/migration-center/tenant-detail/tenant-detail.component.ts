import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { finalize } from 'rxjs';

import {
  MigrationExecution,
  MigrationPreview,
  ScriptState,
  TenantMigrationDetail
} from '../../../models/platform.model';
import { PlatformManagementService } from '../../../services/platform-management.service';
import { formatDateTime } from '../../../utils/platform-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent
} from '../../../../../shared/ui/saas';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { UiFeedbackService } from '../../../../../core/feedback/ui-feedback.service';

/**
 * Consolidated Tenant Details & Health page. Replaces the standalone Tenant Health page:
 * health score and issues come from the same backend tenant health service, alongside the
 * Flyway database state and the independent catalog synchronization state.
 */
@Component({
  selector: 'app-migration-tenant-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule, DialogModule, SaasPageHeaderComponent,
    SaasPanelComponent, SaasPillComponent, TcPageSkeletonComponent
  ],
  styleUrl: '../migration-center.shared.scss',
  template: `
    <div class="tc-page mc-tab">
      <tc-saas-page-header>
        <button type="button" class="tc-btn" (click)="runPreview()" [disabled]="previewing || !detail">
          <i class="pi" [ngClass]="previewing ? 'pi-spinner pi-spin' : 'pi-search'"></i> Preview &amp; validate
        </button>
        <button type="button" class="tc-btn tc-btn--primary" [disabled]="!detail" (click)="openMigrate()">
          <i class="pi pi-database"></i> Migrate database
        </button>
      </tc-saas-page-header>

      <div *ngIf="errorMessage" class="tc-empty-state" role="alert">
        <i class="pi pi-exclamation-triangle"></i><strong>{{ errorMessage }}</strong>
        <button type="button" class="tc-btn tc-btn--primary" (click)="load()">Retry</button>
      </div>

      <tc-page-skeleton *ngIf="loading && !detail" layout="detail"></tc-page-skeleton>

      <ng-container *ngIf="detail as data">
        <div class="mc-detail-head">
          <div class="mc-detail-title">
            <h2>{{ data.organizationName }}</h2>
            <span><code>{{ data.tenantIdentifier }}</code> · schema <code>{{ data.schemaName }}</code>
              · {{ data.active ? 'active' : 'inactive' }}</span>
          </div>
          <div class="mc-actions">
            <tc-saas-pill [label]="data.healthStatus" [tone]="statusTone(data.healthStatus)"></tc-saas-pill>
            <tc-saas-pill [label]="'Migration ' + data.migrationStatus"
              [tone]="statusTone(data.migrationStatus)"></tc-saas-pill>
            <tc-saas-pill [label]="'Catalog ' + data.catalogSyncStatus"
              [tone]="statusTone(data.catalogSyncStatus)"></tc-saas-pill>
            <tc-saas-pill [label]="data.maintenanceMode ? 'MAINTENANCE ON' : 'SERVING TRAFFIC'"
              [tone]="data.maintenanceMode ? 'warning' : 'success'"></tc-saas-pill>
          </div>
        </div>

        <tc-saas-panel title="Health and versions"
          subtitle="Health is measured by the backend tenant health service; versions are read from each isolated Flyway history">
          <div class="mc-kv">
            <div>
              <small>Health score</small>
              <strong>{{ data.healthScore ?? '—' }} / 100</strong>
              <span>{{ data.healthStatus }}</span>
            </div>
            <div>
              <small>Application version</small>
              <strong>{{ data.applicationVersion || '—' }}</strong>
              <span>Recorded by the last release</span>
            </div>
            <div>
              <small>Database version</small>
              <strong>V{{ data.currentFlywayVersion || data.databaseVersion || '—' }}</strong>
              <span>Target V{{ data.targetDatabaseVersion || '—' }} · {{ data.appliedScriptCount }} applied</span>
            </div>
            <div>
              <small>Catalog version</small>
              <strong>{{ data.catalogVersion || '—' }}</strong>
              <span>Target {{ data.targetCatalogVersion || '—' }}</span>
            </div>
            <div>
              <small>Last migration</small>
              <strong>{{ formatDateTime(data.lastMigrationAt) }}</strong>
              <span>Last health check {{ formatDateTime(data.lastHealthCheckAt) }}</span>
            </div>
            <div>
              <small>Maintenance reason</small>
              <strong>{{ data.maintenanceReason || 'Not in maintenance' }}</strong>
              <span>Started {{ formatDateTime(data.maintenanceStartedAt) }}</span>
            </div>
          </div>

          <div class="mc-checks" style="margin-top:16px">
            <article *ngFor="let issue of data.healthIssues; trackBy: trackIssue">
              <strong>Health issue</strong>
              <p>{{ issue }}</p>
              <tc-saas-pill label="WARN" tone="warning"></tc-saas-pill>
            </article>
            <article *ngIf="!data.healthIssues.length">
              <strong>No health issues</strong>
              <p>Every backend tenant health check passed for this tenant.</p>
              <tc-saas-pill label="PASS" tone="success"></tc-saas-pill>
            </article>
          </div>
        </tc-saas-panel>

        <tc-saas-panel title="Pending Flyway scripts"
          subtitle="Discovered from the packaged tenant migration location and compared with this tenant's isolated history">
          <div class="tc-table-wrap">
            <table class="saas-data-table mc-table">
              <thead>
                <tr><th>Version</th><th>Description</th><th>Script</th><th>State</th><th>Checksum</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let script of data.pendingScripts; trackBy: trackScript">
                  <td><strong>V{{ script.version }}</strong></td>
                  <td>{{ script.description || '—' }}</td>
                  <td><code>{{ script.script || '—' }}</code></td>
                  <td><tc-saas-pill [label]="script.state || 'PENDING'" tone="warning"></tc-saas-pill></td>
                  <td>{{ script.checksum ?? '—' }}</td>
                </tr>
                <tr *ngIf="!data.pendingScripts.length">
                  <td colspan="5" class="empty">
                    No pending scripts. This tenant database is at the latest packaged version.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </tc-saas-panel>

        <tc-saas-panel title="Database migration history"
          subtitle="Every recorded Flyway execution for this tenant, newest first">
          <div class="tc-table-wrap">
            <table class="saas-data-table mc-table">
              <thead>
                <tr>
                  <th>Execution</th><th>Release</th><th>From</th><th>Target</th><th>Observed</th>
                  <th>Status</th><th>Attempt</th><th>Started</th><th>Completed</th><th>Error</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let execution of data.migrationHistory; trackBy: trackExecution">
                  <td><code>{{ execution.executionId }}</code></td>
                  <td>{{ execution.releaseId || '—' }}</td>
                  <td>V{{ execution.currentDatabaseVersion || '—' }}</td>
                  <td>V{{ execution.targetDatabaseVersion || '—' }}</td>
                  <td>V{{ execution.migrationVersion || '—' }}</td>
                  <td><tc-saas-pill [label]="execution.status" [tone]="statusTone(execution.status)"></tc-saas-pill></td>
                  <td>{{ execution.retryCount + 1 }}</td>
                  <td>{{ formatDateTime(execution.startedAt) }}</td>
                  <td>{{ formatDateTime(execution.completedAt) }}</td>
                  <td class="mc-error-cell">{{ execution.errorMessage || '—' }}</td>
                </tr>
                <tr *ngIf="!data.migrationHistory.length">
                  <td colspan="10" class="empty">No database migration has been recorded for this tenant.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mc-actions" style="margin-top:12px">
            <button type="button" class="tc-btn tc-btn--sm" [disabled]="busy"
              (click)="retryMigration()">
              <i class="pi pi-replay"></i> Retry latest migration
            </button>
          </div>
        </tc-saas-panel>

        <tc-saas-panel title="Catalog synchronization history"
          subtitle="Catalog sync is independent of releases and database migrations">
          <div class="tc-table-wrap">
            <table class="saas-data-table mc-table">
              <thead>
                <tr>
                  <th>Execution</th><th>Catalog version</th><th>Target</th><th>Status</th>
                  <th>Attempt</th><th>Started</th><th>Completed</th><th>Error</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let execution of data.catalogSyncHistory; trackBy: trackCatalog">
                  <td><code>{{ execution.executionId }}</code></td>
                  <td>{{ execution.catalogVersion || '—' }}</td>
                  <td>{{ execution.targetCatalogVersion || '—' }}</td>
                  <td><tc-saas-pill [label]="execution.status" [tone]="statusTone(execution.status)"></tc-saas-pill></td>
                  <td>{{ execution.retryCount + 1 }}</td>
                  <td>{{ formatDateTime(execution.startedAt) }}</td>
                  <td>{{ formatDateTime(execution.completedAt) }}</td>
                  <td class="mc-error-cell">{{ execution.errorMessage || '—' }}</td>
                </tr>
                <tr *ngIf="!data.catalogSyncHistory.length">
                  <td colspan="8" class="empty">No catalog synchronization has been recorded for this tenant.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mc-actions" style="margin-top:12px">
            <button type="button" class="tc-btn tc-btn--sm" [disabled]="busy" (click)="retryCatalog()">
              <i class="pi pi-replay"></i> Retry latest catalog sync
            </button>
            <button type="button" class="tc-btn tc-btn--sm" [disabled]="busy" (click)="toggleMaintenance()">
              <i class="pi" [ngClass]="data.maintenanceMode ? 'pi-play' : 'pi-pause'"></i>
              {{ data.maintenanceMode ? 'Resume tenant traffic' : 'Enable maintenance mode' }}
            </button>
          </div>
        </tc-saas-panel>

        <p class="mc-note">
          <i class="pi pi-info-circle"></i>
          Migrations are forward-only and run through Flyway against this tenant's own schema. Applied
          versioned migrations are never edited and Flyway history is never manipulated. Catalog sync copies
          definitions only; tenant roles, assignments and overrides are preserved.
        </p>
      </ng-container>
    </div>

    <p-dialog [(visible)]="migrateOpen" [modal]="true" [draggable]="false" [resizable]="false"
      header="Migrate tenant database" [style]="{ width: 'min(720px, 96vw)' }">
      <div class="mc-stage-body">
        <div class="mc-summary-strip">
          <div><small>Current</small><strong>V{{ detail?.currentFlywayVersion || detail?.databaseVersion || '—' }}</strong></div>
          <div><small>Pending scripts</small><strong>{{ detail?.pendingScripts?.length ?? 0 }}</strong></div>
          <div><small>Target</small><strong>V{{ targetVersion || '—' }}</strong></div>
        </div>

        <label>Target database version
          <input [(ngModel)]="targetVersion" placeholder="Latest packaged version" autocomplete="off">
        </label>

        <p class="mc-note mc-note--warning">
          <i class="pi pi-exclamation-triangle"></i>
          The tenant is placed in maintenance mode while the migration runs. Downgrades are refused and
          concurrent tenant operations are blocked by the platform lock.
        </p>

        <div *ngIf="preview as check">
          <div class="mc-checks">
            <article *ngFor="let item of check.checks; trackBy: trackCheck">
              <strong>{{ item.label }}</strong>
              <p>{{ item.message }}</p>
              <tc-saas-pill [label]="item.status" [tone]="checkTone(item.status)"></tc-saas-pill>
            </article>
          </div>
          <p class="mc-note" style="margin-top:12px">
            <i class="pi pi-info-circle"></i>
            {{ check.validationMessage }}
          </p>
        </div>
        <div *ngIf="!preview" class="mc-inline-loading">
          <i class="pi pi-info-circle"></i> Preview this target to see readiness checks before executing.
        </div>
      </div>

      <div class="mc-dialog-actions">
        <button type="button" class="tc-btn" [disabled]="busy" (click)="migrateOpen = false">Cancel</button>
        <button type="button" class="tc-btn" [disabled]="busy" (click)="runPreview()">
          <i class="pi" [ngClass]="previewing ? 'pi-spinner pi-spin' : 'pi-search'"></i> Preview
        </button>
        <button type="button" class="tc-btn tc-btn--primary" [disabled]="busy" (click)="migrate()">
          <i class="pi" [ngClass]="busy ? 'pi-spinner pi-spin' : 'pi-play'"></i> Execute migration
        </button>
      </div>
    </p-dialog>
  `
})
export class MigrationTenantDetailComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(UiFeedbackService);

  loading = true;
  busy = false;
  previewing = false;
  migrateOpen = false;
  errorMessage = '';
  detail: TenantMigrationDetail | null = null;
  preview: MigrationPreview | null = null;
  targetVersion = '';

  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.load();
  }

  get tenantId(): number {
    return Number(this.route.snapshot.paramMap.get('id') ?? 0);
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getMigrationCenterTenant(this.tenantId)
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: detail => {
          this.detail = detail;
          this.targetVersion = this.defaultTarget(detail);
        },
        error: () => { this.errorMessage = 'Unable to load this tenant migration and health state.'; }
      });
  }

  openMigrate(): void {
    this.preview = null;
    this.targetVersion = this.defaultTarget(this.detail);
    this.migrateOpen = true;
  }

  private defaultTarget(detail: TenantMigrationDetail | null): string {
    const pending = detail?.pendingScripts ?? [];
    return detail?.targetDatabaseVersion
      || (pending.length ? pending[pending.length - 1].version : '')
      || detail?.currentFlywayVersion
      || '';
  }

  runPreview(): void {
    if (this.previewing) return;
    this.migrateOpen = true;
    this.previewing = true;
    this.api.previewMigrationCenterTenant(this.tenantId, this.targetVersion || undefined)
      .pipe(
        finalize(() => { this.previewing = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: result => {
          this.preview = result;
          this.feedback.success('Preview ready',
            result.validationSuccessful
              ? 'Every readiness check passed for this target.'
              : 'Some readiness checks need attention before executing.');
        },
        error: () => this.feedback.error('Preview failed', 'The tenant migration preview could not be generated.')
      });
  }

  migrate(): void {
    if (this.busy) return;
    this.busy = true;
    this.api.migrateMigrationCenterTenant(this.tenantId, this.targetVersion || undefined)
      .pipe(
        finalize(() => { this.busy = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: result => {
          this.migrateOpen = false;
          this.feedback.success('Migration finished',
            `${result.tenantIdentifier} is ${result.status} at V${result.observedVersion || result.targetVersion}.`);
          this.load();
        },
        error: () => this.feedback.error('Migration failed',
          'Review the migration history and error message for this tenant.')
      });
  }

  retryMigration(): void {
    if (this.busy) return;
    this.busy = true;
    this.api.retryMigrationCenterTenantMigration(this.tenantId)
      .pipe(
        finalize(() => { this.busy = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: execution => {
          this.feedback.success('Migration retry finished',
            `${execution.executionId} is ${execution.status}.`);
          this.load();
        },
        error: () => this.feedback.error('Retry failed', 'The migration retry could not be executed.')
      });
  }

  retryCatalog(): void {
    if (this.busy) return;
    this.busy = true;
    this.api.retryMigrationCenterTenantCatalog(this.tenantId)
      .pipe(
        finalize(() => { this.busy = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: execution => {
          this.feedback.success('Catalog retry finished',
            `${execution.executionId} is ${execution.status}.`);
          this.load();
        },
        error: () => this.feedback.error('Retry failed', 'The catalog synchronization retry could not be executed.')
      });
  }

  toggleMaintenance(): void {
    if (this.busy || !this.detail) return;
    const enable = !this.detail.maintenanceMode;
    this.busy = true;
    this.api.setMigrationCenterMaintenance(
      this.tenantId, enable, enable ? 'Manual maintenance from Migration Center' : undefined
    )
      .pipe(
        finalize(() => { this.busy = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: tenant => {
          this.feedback.success(enable ? 'Maintenance enabled' : 'Maintenance disabled',
            enable ? 'Tenant traffic is paused.' : `${tenant.organizationName} is serving traffic again.`);
          this.load();
        },
        error: () => this.feedback.error('Maintenance change failed',
          'The maintenance state could not be updated.')
      });
  }

  back(): void {
    void this.router.navigate(['/app/tenant-management/migration-center/tenants']);
  }

  checkTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'PASS') return 'success';
    if (status === 'WARN') return 'warning';
    if (status === 'FAIL') return 'danger';
    return 'neutral';
  }

  statusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (!status) return 'neutral';
    if (['SUCCESS', 'HEALTHY'].includes(status)) return 'success';
    if (['FAILED', 'CRITICAL'].includes(status)) return 'danger';
    if (status === 'RUNNING') return 'info';
    if (['PENDING', 'WARNING', 'MAINTENANCE'].includes(status)) return 'warning';
    return 'neutral';
  }

  trackIssue(index: number, issue: string): string { return index + issue; }
  trackScript(_: number, script: ScriptState): string { return script.version; }
  trackExecution(_: number, execution: MigrationExecution): string { return execution.executionId; }
  trackCatalog(_: number, execution: { executionId: string }): string { return execution.executionId; }
  trackCheck(_: number, check: { key: string }): string { return check.key; }
}
