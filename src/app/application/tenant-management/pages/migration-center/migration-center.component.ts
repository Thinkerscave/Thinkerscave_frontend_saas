import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, Observable } from 'rxjs';
import { DialogModule } from 'primeng/dialog';

import {
  CatalogSyncExecution,
  CreateReleasePayload,
  MigrationExecution,
  OperationStatus,
  PlatformRelease,
  ProvisioningJob,
  ReleaseSummary,
  TenantReleaseDetail,
  TenantReleaseOperation
} from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import { formatDateTime } from '../../utils/platform-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent,
  SaasTab,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';

type CenterTab = 'tenants' | 'provisioning' | 'releaseHistory';
type DetailTab = 'overview' | 'migrations' | 'catalog';

@Component({
  selector: 'app-migration-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent,
    SaasPillComponent, SaasTabsComponent, DialogModule, AppPaginatorComponent, TcPageSkeletonComponent
  ],
  templateUrl: './migration-center.component.html',
  styleUrl: './migration-center.component.scss'
})
export class MigrationCenterComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(UiFeedbackService);

  loading = true;
  detailLoading = false;
  actionId: number | null = null;
  creatingRelease = false;
  executingRelease = false;
  releaseDrawerOpen = false;
  tenantDialogVisible = false;
  errorMessage = '';
  search = '';
  summary: ReleaseSummary = { totalTenants: 0, upToDate: 0, pendingMigration: 0, failedOrMaintenance: 0 };
  tenants: TenantReleaseOperation[] = [];
  jobs: ProvisioningJob[] = [];
  releases: PlatformRelease[] = [];
  tenantPage = 0;
  tenantPageSize = UI_PAGINATION.defaultSize;
  tenantTotal = 0;
  jobPage = 0;
  jobPageSize = UI_PAGINATION.defaultSize;
  jobTotal = 0;
  releasePage = 0;
  releasePageSize = UI_PAGINATION.defaultSize;
  releaseTotal = 0;
  readonly pageSizeOptions = UI_PAGINATION.options;
  selectedTenant: TenantReleaseDetail | null = null;
  activeTab: CenterTab = 'tenants';
  detailTab: DetailTab = 'overview';
  releaseForm: CreateReleasePayload = {
    releaseVersion: '',
    applicationVersion: '',
    targetDatabaseVersion: '',
    targetCatalogVersion: '',
    releaseNotes: ''
  };

  readonly formatDateTime = formatDateTime;
  readonly tabs: SaasTab[] = [
    { key: 'tenants', label: 'Tenants' },
    { key: 'provisioning', label: 'Provisioning Jobs' },
    { key: 'releaseHistory', label: 'Release History' }
  ];
  readonly detailTabs: SaasTab[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'migrations', label: 'Database Migrations' },
    { key: 'catalog', label: 'Catalog Sync' }
  ];

  ngOnInit(): void { this.load(); }

  get stats(): SaasStat[] {
    return [
      { key: 'total', label: 'Total Tenants', value: this.summary.totalTenants, helper: 'All registered organizations', icon: 'pi pi-users', tone: 'primary' },
      { key: 'current', label: 'Up to Date', value: this.summary.upToDate, helper: 'Database and catalog current', icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'pending', label: 'Pending Migration', value: this.summary.pendingMigration, helper: 'Awaiting database release', icon: 'pi pi-clock', tone: 'warning' },
      { key: 'failed', label: 'Failed / Maintenance', value: this.summary.failedOrMaintenance, helper: 'Requires operator attention', icon: 'pi pi-exclamation-triangle', tone: 'danger' }
    ];
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      summary: this.api.getReleaseSummary(),
      tenants: this.api.getTenantReleaseOperations(this.tenantPage, this.tenantPageSize, this.search.trim() || undefined),
      jobs: this.api.getProvisionJobs(this.jobPage, this.jobPageSize),
      releases: this.api.getReleaseHistory(this.releasePage, this.releasePageSize)
    }).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: result => {
        this.summary = result.summary;
        this.tenants = result.tenants.content ?? [];
        this.jobs = result.jobs.content ?? [];
        this.releases = result.releases.content ?? [];
        this.tenantTotal = result.tenants.totalElements ?? this.tenants.length;
        this.jobTotal = result.jobs.totalElements ?? this.jobs.length;
        this.releaseTotal = result.releases.totalElements ?? this.releases.length;
      },
      error: () => {
        this.errorMessage = 'Unable to load release operations. Verify the platform APIs and retry.';
      }
    });
  }

  openTenant(tenant: TenantReleaseOperation): void {
    this.detailLoading = true;
    this.detailTab = 'overview';
    this.tenantDialogVisible = true;
    this.selectedTenant = { ...tenant, migrationHistory: [], catalogSyncHistory: [] };
    forkJoin({
      detail: this.api.getTenantReleaseDetail(tenant.tenantId),
      migrations: this.api.getTenantMigrationHistory(tenant.tenantId),
      catalog: this.api.getCatalogSyncHistory(tenant.tenantId)
    }).pipe(
      finalize(() => { this.detailLoading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ detail, migrations, catalog }) => {
        this.selectedTenant = { ...detail, migrationHistory: migrations, catalogSyncHistory: catalog };
      },
      error: () => this.feedback.error('Details unavailable', 'Could not load this tenant operation history.')
    });
  }

  closeTenant(): void {
    this.tenantDialogVisible = false;
    this.selectedTenant = null;
  }

  openReleaseDrawer(): void {
    this.releaseForm = {
      releaseVersion: '',
      applicationVersion: this.summary.currentRelease?.applicationVersion ?? '',
      targetDatabaseVersion: this.summary.currentRelease?.targetDatabaseVersion ?? '',
      targetCatalogVersion: this.summary.currentRelease?.targetCatalogVersion ?? '',
      releaseNotes: ''
    };
    this.releaseDrawerOpen = true;
  }

  createRelease(): void {
    const payload = this.releaseForm;
    if (!payload.releaseVersion.trim() || !payload.applicationVersion.trim()
      || !payload.targetDatabaseVersion.trim() || !payload.targetCatalogVersion.trim()) {
      this.feedback.formError('Complete all release version fields.', 'Release is incomplete');
      return;
    }
    this.creatingRelease = true;
    this.api.createRelease({
      ...payload,
      releaseVersion: payload.releaseVersion.trim(),
      applicationVersion: payload.applicationVersion.trim(),
      targetDatabaseVersion: payload.targetDatabaseVersion.trim(),
      targetCatalogVersion: payload.targetCatalogVersion.trim(),
      releaseNotes: payload.releaseNotes?.trim() || undefined
    }).pipe(
      finalize(() => { this.creatingRelease = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: release => {
        this.releaseDrawerOpen = false;
        this.feedback.success('Release created', `${release.releaseVersion} is ready for backend validation.`);
        this.load();
      },
      error: () => this.feedback.error('Release not created', 'Verify version targets and try again.')
    });
  }

  executeCurrentRelease(): void {
    const release = this.summary.currentRelease;
    if (!release || release.status === 'RELEASED' || this.executingRelease) return;
    this.executingRelease = true;
    this.api.executeRelease(release.id).pipe(
      finalize(() => { this.executingRelease = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: executed => {
        this.feedback.success('Release execution finished', `${executed.releaseVersion} completed with status ${executed.status}.`);
        this.load();
      },
      error: () => this.feedback.error('Release execution failed', 'Review tenant migration and catalog histories for details.')
    });
  }

  retryMigration(): void {
    const tenant = this.selectedTenant;
    if (!tenant || tenant.migrationStatus !== 'FAILED') return;
    this.runAction(tenant, 'migration', this.api.retryTenantMigration(tenant.tenantId));
  }

  retryCatalog(): void {
    const tenant = this.selectedTenant;
    if (!tenant || tenant.catalogSyncStatus !== 'FAILED') return;
    this.runAction(tenant, 'catalog sync', this.api.retryCatalogSync(tenant.tenantId));
  }

  toggleMaintenance(): void {
    const tenant = this.selectedTenant;
    if (!tenant) return;
    this.actionId = tenant.tenantId;
    this.api.setMigrationMaintenance(
      tenant.tenantId,
      !tenant.maintenanceMode,
      tenant.maintenanceMode ? undefined : 'Enabled by platform operator'
    ).pipe(
      finalize(() => { this.actionId = null; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: updated => {
        this.feedback.success('Maintenance updated', `Maintenance is now ${updated.maintenanceMode ? 'enabled' : 'disabled'}.`);
        this.openTenant(updated);
        this.load();
      },
      error: () => this.feedback.error('Update failed', 'Could not change maintenance mode.')
    });
  }

  changeTab(key: string): void { this.activeTab = key as CenterTab; }
  searchTenants(): void {
    this.tenantPage = 0;
    this.load();
  }
  onTenantPageChange(event: AppPageChangeEvent): void {
    this.tenantPage = event.page;
    this.tenantPageSize = event.rows;
    this.load();
  }
  onJobPageChange(event: AppPageChangeEvent): void {
    this.jobPage = event.page;
    this.jobPageSize = event.rows;
    this.load();
  }
  onReleasePageChange(event: AppPageChangeEvent): void {
    this.releasePage = event.page;
    this.releasePageSize = event.rows;
    this.load();
  }
  changeDetailTab(key: string): void { this.detailTab = key as DetailTab; }
  statusTone(status: OperationStatus | string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (status === 'SUCCESS' || status === 'HEALTHY' || status === 'RELEASED') return 'success';
    if (status === 'FAILED' || status === 'CRITICAL') return 'danger';
    if (status === 'RUNNING') return 'info';
    if (status === 'PENDING' || status === 'WARNING' || status === 'MAINTENANCE') return 'warning';
    return 'neutral';
  }
  trackTenant(_: number, row: TenantReleaseOperation): number { return row.tenantId; }
  trackMigration(_: number, row: MigrationExecution): string { return row.executionId; }
  trackCatalog(_: number, row: CatalogSyncExecution): string { return row.executionId; }

  private runAction(
    tenant: TenantReleaseDetail,
    label: string,
    request: Observable<unknown>
  ): void {
    this.actionId = tenant.tenantId;
    request.pipe(
      finalize(() => { this.actionId = null; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.feedback.success('Retry queued', `${tenant.organizationName} ${label} was queued by the backend.`);
        this.openTenant(tenant);
        this.load();
      },
      error: () => this.feedback.error('Retry failed', `Could not retry ${label}.`)
    });
  }
}
