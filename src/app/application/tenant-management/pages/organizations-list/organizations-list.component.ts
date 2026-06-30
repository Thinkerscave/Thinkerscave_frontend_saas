import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { debounceTime, Subject } from 'rxjs';

import { InstitutionType, OrganizationStatus, OrganizationSummary, PlatformDashboard } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  formatDate,
  institutionLabel,
  orgInitials,
  organizationStatusLabel,
  statusTone
} from '../../utils/platform-display.util';

import {
  SaasPageHeaderComponent,
  SaasStatGridComponent,
  SaasPanelComponent,
  SaasFilterRowComponent,
  SaasPillComponent,
  SaasStat
} from '../../../../shared/ui/saas';

type StatusFilter = 'all' | OrganizationStatus;
type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

@Component({
  selector: 'app-organizations-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink, PaginatorModule, ToastModule,
    SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent,
    SaasFilterRowComponent, SaasPillComponent
  ],
  providers: [MessageService],
  templateUrl: './organizations-list.component.html',
  styleUrl: './organizations-list.component.scss'
})
export class OrganizationsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(PlatformManagementService);
  private readonly messages = inject(MessageService);
  private readonly search$ = new Subject<string>();

  loading = true;
  errorMessage = '';
  dashboard: PlatformDashboard | null = null;
  organizations: OrganizationSummary[] = [];
  search = '';
  statusFilter: StatusFilter = 'all';
  typeFilter: 'all' | InstitutionType = 'all';
  openMenuFor: number | null = null;
  page = 0;
  pageSize = 20;
  totalRecords = 0;

  readonly statusChips: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All Status' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'SUSPENDED', label: 'Suspended' },
    { id: 'INACTIVE', label: 'Inactive' }
  ];

  readonly typeOptions: { id: 'all' | InstitutionType; label: string }[] = [
    { id: 'all', label: 'All Types' },
    { id: 'SCHOOL', label: 'School' },
    { id: 'COLLEGE', label: 'College' },
    { id: 'UNIVERSITY', label: 'University' },
    { id: 'COACHING', label: 'Coaching' },
    { id: 'OTHER', label: 'Other' }
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

  openWorkspace(org: OrganizationSummary, event?: MouseEvent): void {
    if (event && (event.target as HTMLElement).closest('.organizations-list__menu, .saas-icon-btn')) return;
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
        next: () => { this.messages.add({ severity: 'success', summary: 'Suspended', detail: `${org.organizationName} suspended.` }); this.load(); },
        error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not suspend organization.' })
      });
      return;
    }
    if (action === 'activate') {
      this.api.activateOrganization(org.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => { this.messages.add({ severity: 'success', summary: 'Activated', detail: `${org.organizationName} activated.` }); this.load(); },
        error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not activate organization.' })
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
    this.page = 0;
    this.loadOrganizations();
  }

  trackById(_: number, org: OrganizationSummary): number { return org.id; }
}
