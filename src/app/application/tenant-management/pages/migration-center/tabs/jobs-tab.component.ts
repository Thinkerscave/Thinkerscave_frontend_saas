import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { ExecutionJob } from '../../../models/platform.model';
import { PlatformManagementService } from '../../../services/platform-management.service';
import { formatDateTime } from '../../../utils/platform-display.util';
import { SaasPanelComponent, SaasPillComponent } from '../../../../../shared/ui/saas';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { AppPaginatorComponent } from '../../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../../shared/config/ui-standards';
import { AppPageChangeEvent } from '../../../../../shared/utils/paged-result.util';

@Component({
  selector: 'app-migration-jobs-tab',
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
            <input [(ngModel)]="search" (keyup.enter)="applyFilters()"
              placeholder="Search tenant or organization">
          </label>
          <select class="tc-select" [(ngModel)]="jobType" (ngModelChange)="applyFilters()">
            <option value="">All job types</option>
            <option value="MIGRATION">Database migration</option>
            <option value="CATALOG_SYNC">Catalog sync</option>
            <option value="PROVISIONING">Provisioning</option>
          </select>
          <select class="tc-select" [(ngModel)]="status" (ngModelChange)="applyFilters()">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div class="mc-toolbar__group">
          <button type="button" class="tc-btn tc-btn--sm" (click)="load()" [disabled]="loading">
            <i class="pi pi-refresh" [class.pi-spin]="loading"></i> Refresh
          </button>
        </div>
      </div>

      <tc-page-skeleton *ngIf="loading && !jobs.length" layout="table-only" [rows]="8"></tc-page-skeleton>

      <tc-saas-panel title="Execution jobs"
        subtitle="Every database migration, catalog synchronization and provisioning execution, newest first">
        <div class="tc-table-wrap">
          <table class="saas-data-table mc-table mc-table--wide">
            <thead>
              <tr>
                <th>Job</th><th>Type</th><th>Tenant</th><th>Organization</th><th>Release</th>
                <th>Status</th><th>Attempt</th><th>Target</th><th>Started</th><th>Completed</th><th>Error</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let job of jobs; trackBy: trackJob">
                <td><code>{{ job.jobId }}</code></td>
                <td>{{ jobTypeLabel(job.jobType) }}</td>
                <td>
                  <code>{{ job.tenantIdentifier || '—' }}</code>
                </td>
                <td>{{ job.organizationName || '—' }}</td>
                <td>{{ job.releaseId || '—' }}</td>
                <td><tc-saas-pill [label]="job.status" [tone]="statusTone(job.status)"></tc-saas-pill></td>
                <td>{{ job.attempt }}</td>
                <td>{{ job.targetVersion || '—' }}</td>
                <td>{{ formatDateTime(job.startedAt) }}</td>
                <td>{{ formatDateTime(job.completedAt) }}</td>
                <td class="mc-error-cell">{{ job.errorMessage || '—' }}</td>
              </tr>
              <tr *ngIf="!jobs.length">
                <td colspan="11" class="empty">No execution jobs match the current filters.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-paginator [page]="page" [rows]="pageSize" [totalRecords]="total"
          [pageSizeOptions]="pageSizeOptions" noun="jobs"
          (pageChange)="onPageChange($event)"></app-paginator>
      </tc-saas-panel>

      <p class="mc-note">
        <i class="pi pi-info-circle"></i>
        Failed migrations and catalog syncs can be retried from the tenant details page. Retries create a new
        attempt and preserve the original failure for audit.
      </p>
    </div>
  `
})
export class MigrationJobsTabComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  jobs: ExecutionJob[] = [];
  jobType = '';
  status = '';
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
    this.api.getMigrationCenterJobs(this.page, this.pageSize, {
      jobType: this.jobType || undefined,
      status: this.status || undefined,
      search: this.search.trim() || undefined
    })
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: result => { this.jobs = result.content; this.total = result.totalElements; },
        error: () => { this.jobs = []; this.total = 0; }
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

  jobTypeLabel(type: string): string {
    switch (type) {
      case 'MIGRATION': return 'Database migration';
      case 'CATALOG_SYNC': return 'Catalog sync';
      case 'PROVISIONING': return 'Provisioning';
      default: return type;
    }
  }

  statusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (!status) return 'neutral';
    if (['SUCCESS', 'COMPLETED'].includes(status)) return 'success';
    if (status === 'FAILED') return 'danger';
    if (['RUNNING', 'IN_PROGRESS'].includes(status)) return 'info';
    if (['PENDING', 'QUEUED'].includes(status)) return 'warning';
    return 'neutral';
  }

  trackJob(_: number, job: ExecutionJob): string { return job.jobId; }
}
