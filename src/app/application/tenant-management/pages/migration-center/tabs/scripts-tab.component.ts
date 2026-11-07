import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import { LocalMigrationRun, LocalMigrationStatus, MigrationScript } from '../../../models/platform.model';
import { PlatformManagementService } from '../../../services/platform-management.service';
import { formatDateTime } from '../../../utils/platform-display.util';
import { SaasPanelComponent } from '../../../../../shared/ui/saas';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { UiFeedbackService } from '../../../../../core/feedback/ui-feedback.service';

@Component({
  selector: 'app-migration-scripts-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SaasPanelComponent, TcPageSkeletonComponent],
  styleUrl: '../migration-center.shared.scss',
  template: `
    <div class="mc-tab">
      <tc-page-skeleton *ngIf="loading && !scripts.length" layout="table-only" [rows]="6"></tc-page-skeleton>

      <tc-saas-panel title="Packaged tenant migration scripts"
        subtitle="Discovered from the packaged Flyway location. Applied counts are read from each tenant's isolated history table.">
        <div class="tc-table-wrap">
          <table class="saas-data-table mc-table">
            <thead>
              <tr>
                <th>Version</th><th>Description</th><th>Script</th><th>Location</th>
                <th>Applied tenants</th><th>Pending tenants</th><th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let script of scripts; trackBy: trackScript">
                <td><strong>V{{ script.version }}</strong></td>
                <td>{{ script.description || '—' }}</td>
                <td><code>{{ script.script }}</code></td>
                <td><code>{{ script.location }}</code></td>
                <td>{{ script.appliedTenantCount }} / {{ script.totalTenants }}</td>
                <td>{{ script.pendingTenantCount }}</td>
                <td>
                  <div class="mc-progress">
                    <div class="mc-progress__track">
                      <div class="mc-progress__bar" [style.width.%]="coverage(script)"></div>
                    </div>
                    <small>{{ coverage(script) }}%</small>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!scripts.length">
                <td colspan="7" class="empty">No tenant Flyway scripts were discovered.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </tc-saas-panel>

      <tc-saas-panel title="Local development migration workflow"
        subtitle="Default-disabled, loopback-only and never pointed at the shared platform database">
        <div class="mc-local" *ngIf="local as state">
          <div class="mc-kv">
            <div>
              <small>Workflow</small>
              <strong>{{ state.enabled ? 'Enabled' : 'Disabled' }}</strong>
              <span>APP_MIGRATION_LOCAL_ENABLED</span>
            </div>
            <div>
              <small>Datasource</small>
              <strong>{{ state.datasourceHost || 'unresolved' }}</strong>
              <span>{{ state.datasourceDatabase || '—' }}</span>
            </div>
            <div>
              <small>Loopback verified</small>
              <strong>{{ state.loopbackDatasource ? 'Yes' : 'No' }}</strong>
              <span>Non-loopback targets are refused</span>
            </div>
            <div>
              <small>Active profiles</small>
              <strong>{{ state.activeProfiles || 'default' }}</strong>
              <span>Effective Spring profile</span>
            </div>
            <div>
              <small>Current / latest version</small>
              <strong>{{ state.currentVersion || '—' }} → {{ state.latestAvailableVersion || '—' }}</strong>
              <span>{{ state.pendingCount }} pending script(s)</span>
            </div>
            <div>
              <small>Flyway validation</small>
              <strong>{{ state.validationSuccessful ? 'Passing' : 'Not passing' }}</strong>
              <span>{{ state.validationMessage }}</span>
            </div>
          </div>

          <div>
            <ul class="mc-blocker-list" *ngIf="state.blockers.length">
              <li *ngFor="let blocker of state.blockers">{{ blocker }}</li>
            </ul>
            <p class="mc-note" *ngIf="!state.blockers.length">
              <i class="pi pi-check-circle"></i>
              The local workflow is available for this datasource.
            </p>
            <div class="mc-actions" style="justify-content:flex-start;margin-top:12px">
              <button type="button" class="tc-btn tc-btn--sm" [disabled]="localBusy || !canRunLocal"
                (click)="validateLocal()">
                <i class="pi" [ngClass]="localBusy ? 'pi-spinner pi-spin' : 'pi-check-circle'"></i> Validate
              </button>
              <button type="button" class="tc-btn tc-btn--sm tc-btn--primary" [disabled]="localBusy || !canRunLocal"
                (click)="runLocal()">
                <i class="pi" [ngClass]="localBusy ? 'pi-spinner pi-spin' : 'pi-play'"></i> Run local migration
              </button>
            </div>
            <p class="mc-note mc-note--warning" style="margin-top:12px">
              <i class="pi pi-exclamation-triangle"></i>
              Local runs apply only to the verified loopback database. Tenant migrations for shared
              environments must be executed per tenant from the Tenants tab with explicit authorization.
            </p>
          </div>
        </div>

        <div *ngIf="!local" class="mc-inline-loading">
          <i class="pi pi-spinner pi-spin"></i> Local migration status unavailable.
        </div>
      </tc-saas-panel>
    </div>
  `
})
export class MigrationScriptsTabComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(UiFeedbackService);

  loading = true;
  localBusy = false;
  scripts: MigrationScript[] = [];
  local: LocalMigrationStatus | null = null;

  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.load();
  }

  get canRunLocal(): boolean {
    return !!this.local && this.local.enabled && this.local.loopbackDatasource && this.local.flywayAvailable;
  }

  load(): void {
    this.loading = true;
    forkJoin({
      scripts: this.api.getMigrationCenterScripts(),
      local: this.api.getLocalMigrationStatus()
    })
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ scripts, local }) => { this.scripts = scripts; this.local = local; },
        error: () => {
          this.scripts = [];
          this.feedback.error('Scripts unavailable', 'Could not load the packaged migration inventory.');
        }
      });
  }

  coverage(script: MigrationScript): number {
    if (!script.totalTenants) return 0;
    return Math.round((script.appliedTenantCount * 100) / script.totalTenants);
  }

  validateLocal(): void {
    if (!this.canRunLocal) return;
    this.localBusy = true;
    this.api.validateLocalMigration()
      .pipe(
        finalize(() => { this.localBusy = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: result => this.report(result),
        error: () => this.feedback.error('Validation failed', 'The local migration validation could not run.')
      });
  }

  runLocal(): void {
    if (!this.canRunLocal) return;
    this.localBusy = true;
    this.api.runLocalMigration()
      .pipe(
        finalize(() => { this.localBusy = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: result => {
          this.report(result);
          this.load();
        },
        error: () => this.feedback.error('Local migration refused',
          'The backend refused the local run. Review the blockers above.')
      });
  }

  trackScript(_: number, script: MigrationScript): string { return script.version; }

  private report(result: LocalMigrationRun): void {
    if (result.outcome === 'INVALID' || result.outcome === 'FAILED') {
      this.feedback.error(`Local migration ${result.outcome.toLowerCase()}`, result.message);
      return;
    }
    this.feedback.success(`Local migration ${result.outcome.toLowerCase()}`, result.message);
  }
}
