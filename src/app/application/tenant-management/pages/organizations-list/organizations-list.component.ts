import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminControlCenter } from '../../../administration/models/admin-control.model';
import { AdminControlDataService } from '../../../administration/services/admin-control-data.service';
import { TenantOrgView, TenantStatus, mapOrganization, tenantKpis, PlanTier } from '../../data/tenant-view.model';

import {
  SaasPageHeaderComponent,
  SaasStatGridComponent,
  SaasPanelComponent,
  SaasFilterRowComponent,
  SaasPillComponent,
  SaasStat
} from '../../../../shared/ui/saas';

type StatusFilter = 'all' | TenantStatus;
type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

@Component({
  selector: 'app-organizations-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasFilterRowComponent, SaasPillComponent],
  templateUrl: './organizations-list.component.html',
  styleUrl: './organizations-list.component.scss'
})
export class OrganizationsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminData = inject(AdminControlDataService);

  loading = true;
  errorMessage = '';
  workspace: AdminControlCenter | null = null;
  organizations: TenantOrgView[] = [];
  search = '';
  statusFilter: StatusFilter = 'all';
  planFilter: 'all' | string = 'all';
  openMenuFor: number | null = null;

  readonly statusChips: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All Status' },
    { id: 'active', label: 'Active' },
    { id: 'trial', label: 'Trial' },
    { id: 'suspended', label: 'Suspended' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminData.loadWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ws => {
          this.workspace = ws;
          this.organizations = (ws?.organizations || []).map(mapOrganization);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Could not reach the tenant workspace. Showing an empty view — retry to refresh.';
          this.organizations = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  get kpis() { return tenantKpis(this.organizations); }

  get stats(): SaasStat[] {
    const k = this.kpis;
    return [
      { key: 'total', label: 'Total Organizations', value: k.total.toString(), helper: 'All tenants', icon: 'pi pi-building', tone: 'primary' },
      { key: 'active', label: 'Active Subscriptions', value: k.active.toString(), helper: 'Live tenants', icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'trial', label: 'Trial Period', value: k.trial.toString(), helper: 'Evaluating ThinkersCave', icon: 'pi pi-clock', tone: 'warning' },
      { key: 'suspended', label: 'Suspended', value: k.suspended.toString(), helper: 'Paused tenants', icon: 'pi pi-ban', tone: 'danger' }
    ];
  }

  get planOptions(): string[] { return Array.from(new Set(this.organizations.map(o => o.plan))).sort(); }

  get filtered(): TenantOrgView[] {
    const q = this.search.trim().toLowerCase();
    return this.organizations.filter(o => {
      if (this.statusFilter !== 'all' && o.status !== this.statusFilter) return false;
      if (this.planFilter !== 'all' && o.plan !== this.planFilter) return false;
      if (!q) return true;
      return (
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.ownerName.toLowerCase().includes(q) ||
        o.ownerEmail.toLowerCase().includes(q)
      );
    });
  }

  openWorkspace(org: TenantOrgView, event?: MouseEvent): void {
    if (event && (event.target as HTMLElement).closest('.organizations-list__menu, .saas-icon-btn')) { return; }
    this.router.navigate(['/app/tenant-management/organizations', org.id]);
  }

  toggleMenu(orgId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuFor = this.openMenuFor === orgId ? null : orgId;
  }

  @HostListener('document:click')
  closeMenus(): void {
    if (this.openMenuFor !== null) {
      this.openMenuFor = null;
      this.cdr.markForCheck();
    }
  }

  runQuickAction(org: TenantOrgView, action: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuFor = null;
    if (action === 'view-audit') {
      this.router.navigate(['/app/tenant-management/audit-center'], { queryParams: { tenant: org.code } });
      return;
    }
    if (action === 'upgrade') {
      this.router.navigate(['/app/tenant-management/subscription-plans']);
      return;
    }
    this.router.navigate(['/app/tenant-management/organizations', org.id], { queryParams: { action } });
  }

  statusTone(status: TenantStatus): PillTone {
    if (status === 'active') return 'success';
    if (status === 'trial') return 'warning';
    if (status === 'suspended') return 'danger';
    return 'neutral';
  }

  planTone(tier: PlanTier): PillTone {
    if (tier === 'enterprise') return 'primary';
    if (tier === 'professional') return 'info';
    if (tier === 'starter') return 'neutral';
    if (tier === 'custom') return 'warning';
    return 'neutral';
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'all';
    this.planFilter = 'all';
  }

  trackById(_: number, org: TenantOrgView): number { return org.id; }
}
