import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartModule } from 'primeng/chart';
import { FormsModule } from '@angular/forms';

import { TenantHealthRecord, TenantHealthSummary } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import { formatDateTime, formatStorageMb } from '../../utils/platform-display.util';
import {
  SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent, SaasStat, SaasStatGridComponent
} from '../../../../shared/ui/saas';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';

@Component({
  selector: 'tc-platform-health',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent,
    SaasPillComponent, ChartModule, AppPaginatorComponent, TcPageSkeletonComponent
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
  tenants: TenantHealthRecord[] = [];
  search = '';
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  totalRecords = 0;
  readonly pageSizeOptions = UI_PAGINATION.options;
  summary: TenantHealthSummary = {
    totalTenants: 0, healthy: 0, warning: 0, maintenance: 0, critical: 0, checkedAt: ''
  };
  readonly formatDateTime = formatDateTime;
  readonly formatStorageMb = formatStorageMb;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getTenantHealth(this.page, this.pageSize, this.search.trim() || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        this.summary = response.summary;
        this.tenants = response.tenants.content ?? [];
        this.totalRecords = response.tenants.totalElements ?? this.tenants.length;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load backend tenant health checks.';
        this.tenants = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  searchTenants(): void {
    this.page = 0;
    this.load();
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    this.pageSize = event.rows;
    this.load();
  }

  get stats(): SaasStat[] {
    return [
      { key: 'total', label: 'Total Tenants', value: this.summary.totalTenants, helper: 'Backend health records', icon: 'pi pi-database', tone: 'primary' },
      { key: 'healthy', label: 'Healthy', value: this.summary.healthy, helper: 'Checks passing', icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'maintenance', label: 'Maintenance', value: this.summary.maintenance, helper: 'Operationally paused', icon: 'pi pi-wrench', tone: 'warning' },
      { key: 'critical', label: 'Failed', value: this.summary.critical, helper: `${this.summary.warning} additional warnings`, icon: 'pi pi-times-circle', tone: 'danger' }
    ];
  }

  get chartData(): object {
    return {
      labels: ['Healthy', 'Warning', 'Maintenance', 'Critical'],
      datasets: [{ data: [this.summary.healthy, this.summary.warning, this.summary.maintenance, this.summary.critical],
        backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'] }]
    };
  }
  readonly chartOptions = { plugins: { legend: { position: 'bottom' } }, cutout: '60%' };

  tone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (status === 'HEALTHY' || status === 'SUCCESS' || status === 'COMPLETED') return 'success';
    if (status === 'CRITICAL' || status === 'FAILED') return 'danger';
    if (status === 'MAINTENANCE' || status === 'WARNING' || status === 'PENDING') return 'warning';
    if (status === 'RUNNING' || status === 'IN_PROGRESS') return 'info';
    return 'neutral';
  }
}
