import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Select } from 'primeng/select';

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
import { AppListResultsComponent, AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { ListContextService } from '../../../../core/services/list-context.service';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { ListQuerySession } from '../../../../shared/utils/list-query.session';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';

type StatusFilter = 'all' | OrganizationStatus;
type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

const LIST_KEY = 'tc.organizations.viewMode';

@Component({
  selector: 'app-organizations-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink,
    Select, SaasStatGridComponent, SaasPillComponent, AppListToolbarComponent, AppListResultsComponent, AppPaginatorComponent
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
  private readonly listContext = inject(ListContextService);
  private readonly viewPrefs = inject(ViewPreferenceService);
  private readonly query = new ListQuerySession();

  loading = true;
  refreshing = false;
  hasLoaded = false;
  errorMessage = '';
  dashboard: PlatformDashboard | null = null;
  organizations: OrganizationSummary[] = [];
  search = '';
  statusFilter: StatusFilter = 'all';
  typeFilter: 'all' | InstitutionType = 'all';
  customerFilter = 'all';
  private appliedStatus: StatusFilter = 'all';
  private appliedType: 'all' | InstitutionType = 'all';
  private appliedCustomer = 'all';
  viewMode: AppListViewMode = this.viewPrefs.globalDefault();
  openMenuFor: number | null = null;
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  readonly pageSizeOptions = UI_PAGINATION.options;
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
    const saved = this.listContext.consume(LIST_KEY);
    if (saved) {
      this.page = saved.page ?? this.page;
      this.pageSize = saved.size ?? this.pageSize;
      this.search = saved.search ?? this.search;
      this.viewMode = this.viewPrefs.initialView(saved.view);
      if (saved.filters?.['status']) {
        this.statusFilter = saved.filters['status'] as StatusFilter;
        this.appliedStatus = this.statusFilter;
      }
      if (saved.filters?.['type']) {
        this.typeFilter = saved.filters['type'] as 'all' | InstitutionType;
        this.appliedType = this.typeFilter;
      }
      if (typeof saved.filters?.['customer'] === 'string') {
        this.customerFilter = saved.filters['customer'];
        this.appliedCustomer = this.customerFilter;
      }
    }
    this.load();
  }

  load(): void {
    this.errorMessage = '';
    this.api.getDashboard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => { this.dashboard = d; this.cdr.markForCheck(); this.loadOrganizations(); },
      error: () => { this.dashboard = null; this.loadOrganizations(); }
    });
  }

  loadOrganizations(): void {
    const requestId = this.query.beginRequest();
    this.refreshing = true;
    if (!this.hasLoaded) {
      this.loading = true;
    }
    this.api.getOrganizations({
      status: this.appliedStatus === 'all' ? undefined : this.appliedStatus,
      institutionType: this.appliedType === 'all' ? undefined : this.appliedType,
      search: this.search.trim() || undefined,
      page: this.page,
      size: this.pageSize
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        if (!this.query.isCurrent(requestId)) {
          return;
        }
        this.organizations = page.content ?? [];
        this.totalRecords = page.totalElements ?? 0;
        this.loading = false;
        this.refreshing = false;
        this.hasLoaded = true;
        this.cdr.markForCheck();
      },
      error: () => {
        if (!this.query.isCurrent(requestId)) {
          return;
        }
        this.errorMessage = 'Could not load organizations. Verify platform APIs and Super Admin access.';
        this.organizations = [];
        this.loading = false;
        this.refreshing = false;
        this.hasLoaded = true;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchTermChange(value: string): void {
    this.search = value;
  }

  applyQuery(): void {
    this.page = 0;
    this.loadOrganizations();
  }

  applyFilters(): void {
    this.appliedStatus = this.statusFilter;
    this.appliedType = this.typeFilter;
    this.appliedCustomer = this.customerFilter;
    this.page = 0;
    this.loadOrganizations();
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.loadOrganizations();
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.viewMode = mode;
    this.cdr.markForCheck();
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
    if (this.appliedCustomer === 'all') return this.organizations;
    return this.organizations.filter(o => (o.customerName ?? '') === this.appliedCustomer);
  }

  openWorkspace(org: OrganizationSummary, event?: MouseEvent): void {
    if (event && (event.target as HTMLElement).closest('.org-menu-wrap, .org-more-btn')) return;
    this.persistListContext();
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
      this.persistListContext();
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
    this.appliedStatus = 'all';
    this.appliedType = 'all';
    this.appliedCustomer = 'all';
    this.page = 0;
    this.loadOrganizations();
  }

  trackById(_: number, org: OrganizationSummary): number { return org.id; }

  private persistListContext(): void {
    this.listContext.save(LIST_KEY, {
      page: this.page,
      size: this.pageSize,
      search: this.search,
      view: this.viewMode,
      filters: { status: this.appliedStatus, type: this.appliedType, customer: this.appliedCustomer }
    });
  }
}
