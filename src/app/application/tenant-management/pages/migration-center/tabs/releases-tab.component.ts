import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { ReleaseOverview } from '../../../models/platform.model';
import { PlatformManagementService } from '../../../services/platform-management.service';
import { formatDateTime } from '../../../utils/platform-display.util';
import { SaasPanelComponent, SaasPillComponent } from '../../../../../shared/ui/saas';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { AppPaginatorComponent } from '../../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../../shared/config/ui-standards';
import { AppPageChangeEvent } from '../../../../../shared/utils/paged-result.util';

@Component({
  selector: 'app-migration-releases-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, SaasPanelComponent, SaasPillComponent, TcPageSkeletonComponent,
    AppPaginatorComponent
  ],
  styleUrl: '../migration-center.shared.scss',
  template: `
    <div class="mc-tab">
      <div class="mc-toolbar">
        <div class="mc-toolbar__group">
          <span class="mc-sub">{{ total }} release(s) recorded</span>
        </div>
        <div class="mc-toolbar__group">
          <button type="button" class="tc-btn tc-btn--sm" (click)="load()" [disabled]="loading">
            <i class="pi pi-refresh" [class.pi-spin]="loading"></i> Refresh
          </button>
        </div>
      </div>

      <tc-page-skeleton *ngIf="loading && !releases.length" layout="table-only" [rows]="6"></tc-page-skeleton>

      <tc-saas-panel title="Release history"
        subtitle="A release records intended targets. Execution is a separate, audited operator action.">
        <div class="tc-table-wrap">
          <table class="saas-data-table mc-table">
            <thead>
              <tr>
                <th>Release</th><th>Application</th><th>Database target</th><th>Catalog target</th>
                <th>Status</th><th>Rollout</th><th>Tenants</th><th>Created</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let release of releases; trackBy: trackRelease">
                <td>
                  <strong>{{ release.releaseVersion }}</strong>
                  <small class="mc-sub">{{ release.releaseId }}</small>
                </td>
                <td>{{ release.applicationVersion }}</td>
                <td>V{{ release.targetDatabaseVersion }}</td>
                <td>{{ release.targetCatalogVersion }}</td>
                <td><tc-saas-pill [label]="release.status" [tone]="statusTone(release.status)"></tc-saas-pill></td>
                <td>
                  <div class="mc-progress">
                    <div class="mc-progress__track">
                      <div class="mc-progress__bar" [style.width.%]="release.progressPercent"></div>
                    </div>
                    <small>{{ release.progressPercent }}%</small>
                  </div>
                </td>
                <td>
                  <strong>{{ release.succeeded }}/{{ release.totalTenants }}</strong>
                  <small class="mc-sub">{{ release.failed }} failed · {{ release.pending }} pending</small>
                </td>
                <td>
                  {{ formatDateTime(release.createdAt) }}
                  <small class="mc-sub">{{ release.createdBy || 'system' }}</small>
                </td>
                <td>
                  <a class="tc-btn tc-btn--sm"
                    [routerLink]="['/app/tenant-management/migration-center/releases', release.id]">Details</a>
                </td>
              </tr>
              <tr *ngIf="!releases.length">
                <td colspan="9" class="empty">No releases recorded yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-paginator [page]="page" [rows]="pageSize" [totalRecords]="total"
          [pageSizeOptions]="pageSizeOptions" noun="releases"
          (pageChange)="onPageChange($event)"></app-paginator>
      </tc-saas-panel>

      <p class="mc-note">
        <i class="pi pi-info-circle"></i>
        Progress counts come from persisted tenant migration executions. A release with no executions stays
        at 0% until an operator executes it from its details page.
      </p>
    </div>
  `
})
export class MigrationReleasesTabComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  releases: ReleaseOverview[] = [];
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
    this.api.getMigrationCenterReleases(this.page, this.pageSize)
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: result => {
          this.releases = result.content;
          this.total = result.totalElements;
        },
        error: () => { this.releases = []; this.total = 0; }
      });
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    this.pageSize = event.rows;
    this.load();
  }

  statusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (!status) return 'neutral';
    if (status === 'RELEASED') return 'success';
    if (status === 'FAILED') return 'danger';
    if (status === 'READY') return 'info';
    if (status === 'DRAFT') return 'warning';
    return 'neutral';
  }

  trackRelease(_: number, release: ReleaseOverview): number { return release.id; }
}
