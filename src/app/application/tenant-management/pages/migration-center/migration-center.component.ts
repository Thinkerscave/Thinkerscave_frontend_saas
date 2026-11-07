import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { filter, finalize } from 'rxjs';

import {
  CreateReleasePayload,
  MigrationCenterOverview,
  MigrationScript
} from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  SaasPageHeaderComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent,
  SaasStep,
  SaasStepperComponent,
  SaasTab,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';

type CenterTab = 'overview' | 'releases' | 'tenants' | 'scripts' | 'catalog' | 'jobs' | 'history';

@Component({
  selector: 'app-migration-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule, DialogModule, SaasPageHeaderComponent, SaasStatGridComponent,
    SaasPillComponent, SaasTabsComponent, SaasStepperComponent
  ],
  templateUrl: './migration-center.component.html',
  styleUrl: './migration-center.component.scss'
})
export class MigrationCenterComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(UiFeedbackService);
  private readonly router = inject(Router);

  loading = true;
  errorMessage = '';
  overview: MigrationCenterOverview | null = null;
  activeTab: CenterTab = 'overview';
  isDetailRoute = false;

  /* Guided release pipeline (six stages, creation only — never deploys). */
  releaseDrawerOpen = false;
  releaseStage = 0;
  creatingRelease = false;
  scripts: MigrationScript[] = [];
  releaseForm: CreateReleasePayload = this.emptyReleaseForm();

  readonly tabs: SaasTab[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'releases', label: 'Releases' },
    { key: 'tenants', label: 'Tenants' },
    { key: 'scripts', label: 'Migration Scripts' },
    { key: 'catalog', label: 'Catalog Sync' },
    { key: 'jobs', label: 'Execution Jobs' },
    { key: 'history', label: 'History' }
  ];
  readonly releaseSteps: SaasStep[] = [
    { key: 'release', label: 'Release' },
    { key: 'application', label: 'Application' },
    { key: 'database', label: 'Database' },
    { key: 'catalog', label: 'Catalog' },
    { key: 'review', label: 'Review' },
    { key: 'confirm', label: 'Confirm' }
  ];

  ngOnInit(): void {
    this.syncTab(this.router.url);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncTab(this.router.url));
    this.load();
  }

  get stats(): SaasStat[] {
    const overview = this.overview;
    return [
      {
        key: 'tenants', label: 'Tenants', value: overview?.totalTenants ?? 0,
        helper: 'Active, provisioned tenants', icon: 'pi pi-users', tone: 'primary'
      },
      {
        key: 'database', label: 'Database Current', value: overview?.databaseCurrent ?? 0,
        helper: 'At the release database target', icon: 'pi pi-database', tone: 'success'
      },
      {
        key: 'pending', label: 'Pending Migrations', value: overview?.databasePending ?? 0,
        helper: 'Waiting for a Flyway version', icon: 'pi pi-clock', tone: 'warning'
      },
      {
        key: 'failed', label: 'Failed Migrations', value: overview?.databaseFailed ?? 0,
        helper: 'Operator action required', icon: 'pi pi-exclamation-triangle', tone: 'danger'
      },
      {
        key: 'catalog', label: 'Catalog Synced', value: overview?.catalogSynced ?? 0,
        helper: 'At the published catalog version', icon: 'pi pi-sitemap', tone: 'info'
      },
      {
        key: 'jobs', label: 'Active Jobs', value: overview?.activeJobs ?? 0,
        helper: 'Running or queued operations', icon: 'pi pi-spin pi-spinner', tone: 'neutral'
      }
    ];
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getMigrationCenterOverview()
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: overview => { this.overview = overview; },
        error: () => {
          this.errorMessage = 'Unable to load Migration Center state. Verify the platform APIs and retry.';
        }
      });
  }

  navigate(tab: string, queryParams?: Record<string, string>): void {
    void this.router.navigate(
      ['/app/tenant-management/migration-center', tab],
      queryParams ? { queryParams } : {}
    );
  }

  onStatSelect(stat: SaasStat): void {
    switch (stat.key) {
      case 'database': this.navigate('tenants', { filter: 'current' }); break;
      case 'pending': this.navigate('tenants', { filter: 'pending' }); break;
      case 'failed': this.navigate('tenants', { filter: 'failed' }); break;
      case 'catalog': this.navigate('catalog'); break;
      case 'jobs': this.navigate('jobs'); break;
      default: this.navigate('tenants');
    }
  }

  /* ------------------------------------------------------------------ release pipeline */

  openReleaseDrawer(): void {
    this.releaseForm = this.emptyReleaseForm();
    this.releaseStage = 0;
    this.releaseDrawerOpen = true;
    this.api.getMigrationCenterScripts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: scripts => { this.scripts = scripts; }, error: () => { this.scripts = []; } });
  }

  closeReleaseDrawer(): void {
    if (this.creatingRelease) return;
    this.releaseDrawerOpen = false;
  }

  get databaseTargets(): string[] {
    return this.scripts.map(script => script.version);
  }

  get catalogTargets(): string[] {
    const latest = this.overview?.latestAvailableCatalogVersion;
    return latest ? [latest] : [];
  }

  get releaseStageValid(): boolean {
    const form = this.releaseForm;
    switch (this.releaseStage) {
      case 0: return !!form.releaseVersion.trim();
      case 1: return !!form.applicationVersion.trim();
      case 2: return !!form.targetDatabaseVersion.trim();
      case 3: return !!form.targetCatalogVersion.trim();
      default: return true;
    }
  }

  get releaseReadiness(): { label: string; ok: boolean }[] {
    const form = this.releaseForm;
    return [
      {
        label: 'Database target script is packaged',
        ok: this.databaseTargets.includes(form.targetDatabaseVersion)
      },
      {
        label: 'Catalog target equals the published catalog',
        ok: !!this.overview?.latestAvailableCatalogVersion
          && form.targetCatalogVersion === this.overview?.latestAvailableCatalogVersion
      },
      {
        label: 'Provisioned tenants are available',
        ok: (this.overview?.totalTenants ?? 0) > 0
      }
    ];
  }

  nextStage(): void {
    if (!this.releaseStageValid || this.releaseStage >= this.releaseSteps.length - 1) return;
    this.releaseStage += 1;
  }

  previousStage(): void {
    if (this.releaseStage === 0) return;
    this.releaseStage -= 1;
  }

  selectDatabaseTarget(version: string): void { this.releaseForm.targetDatabaseVersion = version; }
  selectCatalogTarget(version: string): void { this.releaseForm.targetCatalogVersion = version; }

  createRelease(): void {
    if (this.creatingRelease) return;
    const payload: CreateReleasePayload = {
      releaseVersion: this.releaseForm.releaseVersion.trim(),
      applicationVersion: this.releaseForm.applicationVersion.trim(),
      targetDatabaseVersion: this.releaseForm.targetDatabaseVersion.trim(),
      targetCatalogVersion: this.releaseForm.targetCatalogVersion.trim(),
      releaseNotes: this.releaseForm.releaseNotes?.trim() || undefined
    };
    if (!payload.releaseVersion || !payload.applicationVersion
      || !payload.targetDatabaseVersion || !payload.targetCatalogVersion) {
      this.feedback.formError('Complete every release version field.', 'Release is incomplete');
      return;
    }
    this.creatingRelease = true;
    this.api.createMigrationCenterRelease(payload)
      .pipe(
        finalize(() => { this.creatingRelease = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: release => {
          this.releaseDrawerOpen = false;
          this.feedback.success('Release created',
            `${release.releaseVersion} is recorded as ${release.status}. Nothing was deployed or migrated.`);
          this.load();
          this.navigate('releases');
        },
        error: () => this.feedback.error('Release not created', 'Verify the targets and try again.')
      });
  }

  statusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (!status) return 'neutral';
    if (['SUCCESS', 'HEALTHY', 'RELEASED', 'COMPLETED', 'PASS'].includes(status)) return 'success';
    if (['FAILED', 'CRITICAL', 'FAIL'].includes(status)) return 'danger';
    if (['RUNNING', 'READY', 'IN_PROGRESS'].includes(status)) return 'info';
    if (['PENDING', 'WARNING', 'MAINTENANCE', 'WARN', 'QUEUED', 'DRAFT'].includes(status)) return 'warning';
    return 'neutral';
  }

  private syncTab(url: string): void {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const index = segments.indexOf('migration-center');
    const candidate = index >= 0 ? segments[index + 1] : undefined;
    const known: CenterTab[] = ['overview', 'releases', 'tenants', 'scripts', 'catalog', 'jobs', 'history'];
    this.activeTab = candidate && (known as string[]).includes(candidate)
      ? candidate as CenterTab
      : 'overview';
    this.isDetailRoute = (this.activeTab === 'releases' || this.activeTab === 'tenants')
      && segments.length > index + 2;
    this.cdr.markForCheck();
  }

  private emptyReleaseForm(): CreateReleasePayload {
    return {
      releaseVersion: '',
      applicationVersion: this.overview?.currentApplicationVersion ?? '',
      targetDatabaseVersion: this.overview?.latestAvailableDatabaseVersion ?? '',
      targetCatalogVersion: this.overview?.latestAvailableCatalogVersion ?? '',
      releaseNotes: ''
    };
  }
}
