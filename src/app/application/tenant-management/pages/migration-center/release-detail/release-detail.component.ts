import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { finalize } from 'rxjs';

import { ExecutionJob, ReleaseDetail } from '../../../models/platform.model';
import { PlatformManagementService } from '../../../services/platform-management.service';
import { formatDateTime } from '../../../utils/platform-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStep,
  SaasStepperComponent
} from '../../../../../shared/ui/saas';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { UiFeedbackService } from '../../../../../core/feedback/ui-feedback.service';

@Component({
  selector: 'app-migration-release-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, DialogModule, SaasPageHeaderComponent, SaasPanelComponent,
    SaasPillComponent, SaasStepperComponent, TcPageSkeletonComponent
  ],
  styleUrl: '../migration-center.shared.scss',
  template: `
    <div class="tc-page mc-tab">
      <tc-saas-page-header>
        <button type="button" class="tc-btn" (click)="validate()" [disabled]="validating">
          <i class="pi" [ngClass]="validating ? 'pi-spinner pi-spin' : 'pi-check-circle'"></i> Validate
        </button>
        <button type="button" class="tc-btn tc-btn--primary" [disabled]="executing"
          (click)="confirmOpen = true">
          <i class="pi" [ngClass]="executing ? 'pi-spinner pi-spin' : 'pi-play'"></i> Execute release
        </button>
      </tc-saas-page-header>

      <div *ngIf="errorMessage" class="tc-empty-state" role="alert">
        <i class="pi pi-exclamation-triangle"></i><strong>{{ errorMessage }}</strong>
      </div>

      <tc-page-skeleton *ngIf="loading && !detail" layout="detail"></tc-page-skeleton>

      <ng-container *ngIf="detail as data">
        <div class="mc-detail-head">
          <div class="mc-detail-title">
            <h2>{{ data.release.releaseVersion }}</h2>
            <span>{{ data.release.releaseId }} · created {{ formatDateTime(data.release.createdAt) }}
              by {{ data.release.createdBy || 'system' }}</span>
          </div>
          <div class="mc-actions">
            <tc-saas-pill [label]="data.release.status" [tone]="statusTone(data.release.status)"></tc-saas-pill>
            <tc-saas-pill [label]="data.validation.valid ? 'VALID' : 'ATTENTION'"
              [tone]="data.validation.valid ? 'success' : 'warning'"></tc-saas-pill>
          </div>
        </div>

        <tc-saas-panel title="Release pipeline"
          subtitle="Recorded targets progress through validation, database migration, catalog sync and verification">
          <tc-saas-stepper [steps]="steps" [activeIndex]="stageIndex"></tc-saas-stepper>
          <div class="mc-summary-strip" style="margin-top:16px">
            <div><small>Application</small><strong>{{ data.release.applicationVersion }}</strong></div>
            <div><small>Database target</small><strong>V{{ data.release.targetDatabaseVersion }}</strong></div>
            <div><small>Catalog target</small><strong>{{ data.release.targetCatalogVersion }}</strong></div>
            <div><small>Tenants succeeded</small><strong>{{ data.release.succeeded }}</strong></div>
            <div><small>Failed</small><strong>{{ data.release.failed }}</strong></div>
            <div><small>Pending</small><strong>{{ data.release.pending }}</strong></div>
          </div>
        </tc-saas-panel>

        <tc-saas-panel title="Readiness validation"
          subtitle="Read-only checks against packaged scripts, the published catalog and eligible tenants">
          <div class="mc-checks">
            <article *ngFor="let check of data.validation.checks; trackBy: trackCheck">
              <strong>{{ check.label }}</strong>
              <p>{{ check.message }}</p>
              <tc-saas-pill [label]="check.status" [tone]="checkTone(check.status)"></tc-saas-pill>
            </article>
          </div>
          <p class="mc-note" style="margin-top:12px">
            <i class="pi pi-info-circle"></i>
            Validation never executes a migration and never deploys an application build.
          </p>
        </tc-saas-panel>

        <tc-saas-panel title="Tenant executions" subtitle="Per-tenant database migration results for this release">
          <div class="tc-table-wrap">
            <table class="saas-data-table mc-table">
              <thead>
                <tr>
                  <th>Organization</th><th>Tenant</th><th>Status</th><th>Attempt</th>
                  <th>Target</th><th>Started</th><th>Completed</th><th>Error</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let job of data.tenantExecutions; trackBy: trackJob">
                  <td><strong>{{ job.organizationName || '—' }}</strong></td>
                  <td><code>{{ job.tenantIdentifier || '—' }}</code></td>
                  <td><tc-saas-pill [label]="job.status" [tone]="statusTone(job.status)"></tc-saas-pill></td>
                  <td>{{ job.attempt }}</td>
                  <td>V{{ job.targetVersion || '—' }}</td>
                  <td>{{ formatDateTime(job.startedAt) }}</td>
                  <td>{{ formatDateTime(job.completedAt) }}</td>
                  <td class="mc-error-cell">{{ job.errorMessage || '—' }}</td>
                  <td>
                    <a *ngIf="job.tenantId" class="tc-btn tc-btn--sm"
                      [routerLink]="['/app/tenant-management/migration-center/tenants', job.tenantId]">
                      Open tenant
                    </a>
                  </td>
                </tr>
                <tr *ngIf="!data.tenantExecutions.length">
                  <td colspan="9" class="empty">This release has not been executed for any tenant.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </tc-saas-panel>

        <tc-saas-panel title="Release audit timeline" subtitle="Append-only operational events">
          <div class="mc-history">
            <article *ngFor="let event of data.timeline; trackBy: trackEvent">
              <div>
                <strong>{{ event.eventType }}</strong>
                <span>{{ formatDateTime(event.createdAt) }} · {{ event.actor || 'system' }}
                  {{ event.tenantIdentifier ? '· ' + event.tenantIdentifier : '' }}</span>
                <p *ngIf="event.errorMessage">{{ event.errorMessage }}</p>
              </div>
              <tc-saas-pill [label]="event.status" [tone]="statusTone(event.status)"></tc-saas-pill>
            </article>
            <div *ngIf="!data.timeline.length" class="empty">No audit events recorded for this release.</div>
          </div>
        </tc-saas-panel>
      </ng-container>
    </div>

    <p-dialog [(visible)]="confirmOpen" [modal]="true" [draggable]="false" header="Execute release"
      [style]="{ width: 'min(560px, 94vw)' }">
      <p class="mc-note mc-note--warning">
        <i class="pi pi-exclamation-triangle"></i>
        Execution migrates every eligible tenant sequentially. Each tenant is placed in maintenance mode and
        its Flyway history is updated. This action cannot be undone and must be authorized.
      </p>
      <div class="mc-dialog-actions">
        <button type="button" class="tc-btn" [disabled]="executing" (click)="confirmOpen = false">Cancel</button>
        <button type="button" class="tc-btn tc-btn--primary" [disabled]="executing" (click)="execute()">
          <i class="pi" [ngClass]="executing ? 'pi-spinner pi-spin' : 'pi-play'"></i> Execute for all tenants
        </button>
      </div>
    </p-dialog>
  `
})
export class MigrationReleaseDetailComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(UiFeedbackService);

  loading = true;
  validating = false;
  executing = false;
  confirmOpen = false;
  errorMessage = '';
  detail: ReleaseDetail | null = null;

  readonly formatDateTime = formatDateTime;
  readonly steps: SaasStep[] = [
    { key: 'recorded', label: 'Recorded' },
    { key: 'validated', label: 'Validated' },
    { key: 'database', label: 'Database' },
    { key: 'catalog', label: 'Catalog' },
    { key: 'released', label: 'Released' },
    { key: 'verified', label: 'Verified' }
  ];

  ngOnInit(): void {
    this.load();
  }

  get releaseId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  get stageIndex(): number {
    const detail = this.detail;
    if (!detail) return 0;
    if (!detail.validation.valid) return 1;
    if (detail.release.totalTenants === 0 || detail.release.pending > 0) return 2;
    if (detail.release.failed > 0) return 2;
    if (detail.release.status !== 'RELEASED') return 4;
    return 5;
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getMigrationCenterRelease(this.releaseId)
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: detail => { this.detail = detail; },
        error: () => { this.errorMessage = 'Unable to load this release.'; }
      });
  }

  validate(): void {
    if (this.validating) return;
    this.validating = true;
    this.api.validateMigrationCenterRelease(this.releaseId)
      .pipe(
        finalize(() => { this.validating = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: validation => {
          if (this.detail) {
            this.detail = { ...this.detail, validation };
          }
          this.feedback.success('Validation completed',
            validation.valid ? 'Every readiness check passed.' : 'Some readiness checks need attention.');
        },
        error: () => this.feedback.error('Validation failed', 'The release validation could not run.')
      });
  }

  execute(): void {
    if (this.executing) return;
    this.executing = true;
    this.api.executeMigrationCenterRelease(this.releaseId)
      .pipe(
        finalize(() => { this.executing = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: release => {
          this.confirmOpen = false;
          this.feedback.success('Release execution finished',
            `${release.releaseVersion} is ${release.status}. Review tenant executions for details.`);
          this.load();
        },
        error: () => this.feedback.error('Release execution failed',
          'Review tenant executions and the audit timeline.')
      });
  }

  back(): void {
    void this.router.navigate(['/app/tenant-management/migration-center/releases']);
  }

  checkTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'PASS') return 'success';
    if (status === 'WARN') return 'warning';
    if (status === 'FAIL') return 'danger';
    return 'neutral';
  }

  statusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (!status) return 'neutral';
    if (['SUCCESS', 'RELEASED'].includes(status)) return 'success';
    if (status === 'FAILED') return 'danger';
    if (['READY', 'RUNNING'].includes(status)) return 'info';
    if (['DRAFT', 'PENDING'].includes(status)) return 'warning';
    return 'neutral';
  }

  trackCheck(_: number, check: { key: string }): string { return check.key; }
  trackJob(_: number, job: ExecutionJob): string { return job.jobId; }
  trackEvent(_: number, event: { id: number }): number { return event.id; }
}
