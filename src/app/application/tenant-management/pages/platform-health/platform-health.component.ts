import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { PlatformManagementService } from '../../services/platform-management.service';
import { TenantRegistry } from '../../models/platform.model';
import {
  formatDateTime,
  formatStorageMb,
  healthScore,
  healthTone,
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
  selector: 'tc-platform-health',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SaasPageHeaderComponent,
    SaasStatGridComponent,
    SaasPanelComponent,
    SaasPillComponent
  ],
  templateUrl: './platform-health.component.html',
  styleUrl: './platform-health.component.scss'
})
export class PlatformHealthComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  errorMessage = '';
  tenants = signal<TenantRegistry[]>([]);
  refreshedAt = new Date();

  readonly formatDateTime = formatDateTime;
  readonly formatStorageMb = formatStorageMb;
  readonly provisionStatusLabel = provisionStatusLabel;
  readonly healthScore = healthScore;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getTenantRegistry(0, 100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        this.tenants.set(page.content ?? []);
        this.refreshedAt = new Date();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load tenant health data.';
        this.tenants.set([]);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  readonly stats = computed<SaasStat[]>(() => {
    const list = this.tenants();
    const healthy = list.filter(t => healthScore(t) >= 85).length;
    const maintenance = list.filter(t => t.maintenanceMode).length;
    const failed = list.filter(t => t.provisionStatus === 'FAILED').length;
    return [
      { key: 'total', label: 'Total Tenants', value: list.length, helper: 'Registered workspaces', icon: 'pi pi-database', tone: 'primary' },
      { key: 'healthy', label: 'Healthy', value: healthy, helper: 'Score ≥ 85%', icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'maintenance', label: 'Maintenance', value: maintenance, helper: 'Paused tenants', icon: 'pi pi-wrench', tone: 'warning' },
      { key: 'failed', label: 'Failed', value: failed, helper: 'Provisioning issues', icon: 'pi pi-times-circle', tone: 'danger' }
    ];
  });

  tenantTone(tenant: TenantRegistry): 'success' | 'warning' | 'danger' {
    return healthTone(healthScore(tenant));
  }

  statusPillTone(status?: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    return provisionStatusTone(status);
  }
}
