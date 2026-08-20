import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PaginatorModule } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { debounceTime, Subject } from 'rxjs';

import { InstitutionType, OrganizationStatus, OrganizationSummary, PlatformDashboard } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  formatDate,
  institutionLabel,
  institutionTypeOptions,
  orgInitials,
  organizationStatusLabel,
  statusTone
} from '../../utils/platform-display.util';

import {
  SaasStatGridComponent,
  SaasPillComponent,
  SaasStat
} from '../../../../shared/ui/saas';
import { AppGridTableToggleComponent, AppListViewMode } from '../../../../shared/ui/app-list';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';

type StatusFilter = 'all' | OrganizationStatus;
type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

@Component({
  selector: 'app-organizations-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink, PaginatorModule,
    Select, SaasStatGridComponent, SaasPillComponent, AppGridTableToggleComponent
  ],
  templateUrl: './organizations-list.component.html',
  styleUrl: './organizations-list.component.scss'
})
export class OrganizationsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(PlatformManagementService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly search$ = new Subject<string>();

  loading = true;
  errorMessage = '';
  dashboard: PlatformDashboard | null = null;
  organizations: OrganizationSummary[] = [];
  search = '';
  statusFilter: StatusFilter = 'all';
  typeFilter: 'all' | InstitutionType = 'all';
  customerFilter = 'all';
  viewMode: AppListViewMode = 'grid';
  openMenuFor: number | null = null;
  page = 0;
  pageSize = 24;
  totalRecords = 0;

  readonly statusChips: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All Status' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'SUSPENDED', label: 'Suspended' },
    { id: 'INACTIVE', label: 'Inactive' }
  ];

  readonly typeOptions: { value: 'all' | InstitutionType; label: string }[] = [
    { value: 'all', label: 'All Types' },
    ...institutionTypeOptions()
  ];

  readonly institutionLabel = institutionLabel;
  readonly organizationStatusLabel = organizationStatusLabel;
  readonly formatDate = formatDate;
  readonly orgInitials = orgInitials;

  ngOnInit(): void {
    this.search$.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page = 0;
      this.loadOrganizations();
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getDashboard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => { this.dashboard = d; this.loadOrganizations(); },
      error: () => { this.dashboard = null; this.loadOrganizations(); }
    });
  }

  loadOrganizations(): void {
    this.api.getOrganizations({
      status: this.statusFilter === 'all' ? undefined : this.statusFilter,
      institutionType: this.typeFilter === 'all' ? undefined : this.typeFilter,
      search: this.search.trim() || undefined,
      page: this.page,
      size: this.pageSize
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        this.organizations = page.content ?? [];
        this.totalRecords = page.totalElements ?? 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Could not load organizations. Verify platform APIs and Super Admin access.';
        this.organizations = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(): void { this.search$.next(this.search); }
  onFilterChange(): void { this.page = 0; this.loadOrganizations(); }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    if (event.rows) this.pageSize = event.rows;
    this.loadOrganizations();
  }

  onViewModeChange(mode: AppListViewMode): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.pageSize = mode === 'table' ? 20 : 24;
    this.page = 0;
    this.loadOrganizations();
  }

  get stats(): SaasStat[] {
    const d = this.dashboard;
    if (!d) {
      return [
        { key: 'total', label: 'Total Organizations', value: this.totalRecords, icon: 'pi pi-building', tone: 'primary' },
        { key: 'active', label: 'Active', value: '—', icon: 'pi pi-check-circle', tone: 'success' },
        { key: 'trial', label: 'Trial', value: '—', icon: 'pi pi-clock', tone: 'warning' },
        { key: 'suspended', label: 'Suspended', value: '—', icon: 'pi pi-ban', tone: 'danger' }
      ];
    }
    return [
      { key: 'total', label: 'Total Organizations', value: d.totalOrganizations, helper: 'All tenants', icon: 'pi pi-building', tone: 'primary' },
      { key: 'active', label: 'Active Subscriptions', value: d.activeOrganizations, helper: 'Live tenants', icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'trial', label: 'Trial Period', value: d.trialOrganizations, helper: 'Evaluating', icon: 'pi pi-clock', tone: 'warning' },
      { key: 'suspended', label: 'Suspended', value: d.suspendedOrganizations, helper: 'Paused', icon: 'pi pi-ban', tone: 'danger' }
    ];
  }

  /** Deterministic avatar colour based on org name's first character. */
  orgColor(name: string): string {
    const palette = ['indigo', 'violet', 'emerald', 'teal', 'amber', 'rose', 'sky', 'orange'];
    return palette[(name?.charCodeAt(0) ?? 0) % palette.length];
  }

  /** Unique customer list for the customer filter dropdown (client-side from loaded page). */
  get customerOptions(): { id: string; label: string }[] {
    const seen = new Set<string>();
    const opts: { id: string; label: string }[] = [{ id: 'all', label: 'All Customers' }];
    for (const org of this.organizations) {
      const name = org.customerName ?? '';
      if (name && !seen.has(name)) { seen.add(name); opts.push({ id: name, label: name }); }
    }
    return opts;
  }

  /** Applies the client-side customer filter on top of the server-paged results. */
  get filteredOrganizations(): OrganizationSummary[] {
    if (this.customerFilter === 'all') return this.organizations;
    return this.organizations.filter(o => (o.customerName ?? '') === this.customerFilter);
  }

  openWorkspace(org: OrganizationSummary, event?: MouseEvent): void {
    if (event && (event.target as HTMLElement).closest('.org-menu-wrap, .org-more-btn')) return;
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

  runQuickAction(org: OrganizationSummary, action: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuFor = null;
    if (action === 'view') {
      this.router.navigate(['/app/tenant-management/organizations', org.id]);
      return;
    }
    if (action === 'suspend') {
      this.api.suspendOrganization(org.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => { this.feedback.success('Suspended', `${org.organizationName} suspended.`); this.load(); },
        error: () => this.feedback.error('Failed', 'Could not suspend organization.')
      });
      return;
    }
    if (action === 'activate') {
      this.api.activateOrganization(org.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => { this.feedback.success('Activated', `${org.organizationName} activated.`); this.load(); },
        error: () => this.feedback.error('Failed', 'Could not activate organization.')
      });
    }
  }

  pillTone(status?: OrganizationStatus): PillTone {
    return statusTone(status) as PillTone;
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'all';
    this.typeFilter = 'all';
    this.customerFilter = 'all';
    this.page = 0;
    this.loadOrganizations();
  }

  trackById(_: number, org: OrganizationSummary): number { return org.id; }
}
