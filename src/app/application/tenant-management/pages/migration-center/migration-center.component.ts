import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { finalize, forkJoin } from 'rxjs';

import { ProvisioningJob, TenantRegistry } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  formatDateTime,
  formatStorageMb,
  provisionJobStatusLabel,
  provisionJobTone,
  provisionStatusLabel,
  provisionStatusTone
} from '../../utils/platform-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-migration-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ToastModule,
    SaasPageHeaderComponent,
    SaasStatGridComponent,
    SaasPanelComponent,
    SaasPillComponent,
    ProgressBarModule
  ],
  providers: [MessageService],
  templateUrl: './migration-center.component.html',
  styleUrl: './migration-center.component.scss'
})
export class MigrationCenterComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);

  loading = true;
  errorMessage = '';
  jobs: ProvisioningJob[] = [];
  tenants: TenantRegistry[] = [];
  retryingId: number | null = null;
  migratingId: number | null = null;

  readonly formatDateTime = formatDateTime;
  readonly provisionJobStatusLabel = provisionJobStatusLabel;
  readonly provisionJobTone = provisionJobTone;
  readonly provisionStatusLabel = provisionStatusLabel;
  readonly provisionStatusTone = provisionStatusTone;
  readonly formatStorageMb = formatStorageMb;

  ngOnInit(): void {
    this.load();
  }

  get stats(): SaasStat[] {
    const jobs = this.jobs;
    const tenants = this.tenants;
    const inProgress = jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'QUEUED').length;
    const failedJobs = jobs.filter(j => j.status === 'FAILED').length;
    const maintenance = tenants.filter(t => t.maintenanceMode).length;
    const pendingMigration = tenants.filter(t => t.provisionStatus !== 'COMPLETED').length;

    return [
      { key: 'tenants', label: 'Registered Tenants', value: tenants.length, helper: 'Tenant registry entries', icon: 'pi pi-database', tone: 'primary' },
      { key: 'jobs', label: 'Provision Jobs', value: jobs.length, helper: 'Recent provisioning runs', icon: 'pi pi-cog', tone: 'info' },
      { key: 'progress', label: 'In Progress', value: inProgress, helper: 'Queued or running jobs', icon: 'pi pi-sync', tone: 'warning' },
      { key: 'failed', label: 'Failed / Maintenance', value: failedJobs + maintenance, helper: `${failedJobs} failed · ${pendingMigration} not completed`, icon: 'pi pi-exclamation-triangle', tone: failedJobs ? 'danger' : 'neutral' }
    ];
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      jobs: this.api.getProvisionJobs(0, 50),
      registry: this.api.getTenantRegistry(0, 50)
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ jobs, registry }) => {
          this.jobs = jobs.content ?? [];
          this.tenants = registry.content ?? [];
        },
        error: () => {
          this.jobs = [];
          this.tenants = [];
          this.errorMessage = 'Unable to load migration data. Verify backend access and try again.';
        }
      });
  }

  retryJob(job: ProvisioningJob): void {
    if (job.status !== 'FAILED') return;

    this.retryingId = job.id;
    this.api.retryProvisionJob(job.id)
      .pipe(
        finalize(() => {
          this.retryingId = null;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Job retried', detail: `${job.jobCode} has been re-queued.` });
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Retry failed', detail: 'Could not retry this provisioning job.' })
      });
  }

  triggerMigration(tenant: TenantRegistry): void {
    this.migratingId = tenant.id;
    this.api.triggerTenantMigration(tenant.id)
      .pipe(
        finalize(() => {
          this.migratingId = null;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Migration triggered',
            detail: `Schema migration started for ${tenant.organizationName || tenant.tenantIdentifier}.`
          });
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Migration failed', detail: 'Could not trigger tenant migration.' })
      });
  }

  get outdatedTenants(): TenantRegistry[] {
    return this.tenants.filter(t => t.databaseVersion && t.migrationVersion && t.databaseVersion !== t.migrationVersion);
  }

  migrateAllOutdated(): void {
    const outdated = this.outdatedTenants;
    if (!outdated.length) return;

    this.messages.add({ severity: 'info', summary: 'Batch Migration', detail: `Triggering migration for ${outdated.length} tenants...` });
    // In a real app, this would call a batch API or queue them. For now, we simulate looping them.
    for (const t of outdated) {
      this.triggerMigration(t);
    }
  }

  progressLabel(job: ProvisioningJob): string {
    if (job.progressPercentage != null) return `${job.progressPercentage}%`;
    return '—';
  }

  trackByJobId(_: number, item: ProvisioningJob): number {
    return item.id;
  }

  trackByTenantId(_: number, item: TenantRegistry): number {
    return item.id;
  }
}
