import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';

import { CustomerDetail, OrganizationSummary, PlatformAuditLog } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  customerInitials,
  customerStatusLabel,
  customerStatusTone,
  formatDate,
  formatDateTime,
  institutionLabel,
  organizationStatusLabel,
  statusTone
} from '../../utils/platform-display.util';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { AppGridTableToggleComponent, AppListViewMode } from '../../../../shared/ui/app-list';

type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

@Component({
  selector: 'app-customer-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ToastModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasTabsComponent,
    SaasPillComponent,
    SaasStatGridComponent,
    AppGridTableToggleComponent
  ],
  templateUrl: './customer-workspace.component.html',
  styleUrl: './customer-workspace.component.scss'
})
export class CustomerWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(PlatformManagementService);
  private readonly pageHeader = inject(BreadCrumbService);

  loading = true;
  auditLoading = false;
  errorMessage = '';
  customer: CustomerDetail | null = null;
  customerId = 0;
  activeTab = 'overview';
  orgViewMode: AppListViewMode = 'grid';
  auditLogs: PlatformAuditLog[] = [];

  readonly tabs = [
    { key: 'overview', label: 'Overview', icon: 'pi pi-id-card' },
    { key: 'organizations', label: 'Organizations', icon: 'pi pi-building' },
    { key: 'users', label: 'Users', icon: 'pi pi-users' },
    { key: 'subscriptions', label: 'Subscriptions', icon: 'pi pi-credit-card' },
    { key: 'audit', label: 'Audit Logs', icon: 'pi pi-history' },
    { key: 'settings', label: 'Settings', icon: 'pi pi-cog' }
  ];

  readonly customerInitials = customerInitials;
  readonly orgInitials = customerInitials;
  readonly customerStatusLabel = customerStatusLabel;
  readonly organizationStatusLabel = organizationStatusLabel;
  readonly institutionLabel = institutionLabel;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.customerId = Number(this.route.snapshot.paramMap.get('id'));
    this.load(this.customerId);
  }

  load(customerId: number): void {
    if (!customerId || Number.isNaN(customerId)) {
      this.errorMessage = 'Invalid customer identifier.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.api.getCustomer(customerId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: customer => {
        if (!customer?.id) {
          this.errorMessage = 'Customer not found. It may have been archived or removed.';
          this.customer = null;
        } else {
          this.customer = customer;
          this.pageHeader.setPageHeader({
            title: customer.customerName || 'Customer Details'
          });
          this.pageHeader.setPageSubtitle(this.subtitle);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load this customer. Check your connection and retry.';
        this.customer = null;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'audit' && !this.auditLogs.length && !this.auditLoading) {
      this.loadAuditLogs();
    }
    this.cdr.markForCheck();
  }

  loadAuditLogs(): void {
    if (!this.customerId) return;
    this.auditLoading = true;
    this.api.getAuditLogs(0, 200).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        const idStr = String(this.customerId);
        this.auditLogs = (page.content ?? []).filter(log =>
          this.matchesCustomerAudit(log, idStr)
        );
        this.auditLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.auditLogs = [];
        this.auditLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get subtitle(): string {
    if (!this.customer) return 'Loading…';
    return [this.customer.customerCode, this.customer.primaryContact?.fullName].filter(Boolean).join(' · ');
  }

  get organizations(): OrganizationSummary[] {
    return this.customer?.organizations ?? [];
  }

  get stats(): SaasStat[] {
    if (!this.customer) return [];
    return [
      {
        key: 'orgs',
        label: 'Organizations',
        value: this.organizations.length || (this.customer.organizationCount ?? 0),
        icon: 'pi pi-building',
        tone: 'primary'
      },
      {
        key: 'status',
        label: 'Account Status',
        value: customerStatusLabel(this.customer.status),
        helper: this.customer.active === false ? 'Inactive record' : 'Active record',
        icon: 'pi pi-check-circle',
        tone: customerStatusTone(this.customer.status) as SaasStat['tone']
      },
      {
        key: 'created',
        label: 'Created',
        value: formatDate(this.customer.createdOn),
        helper: this.customer.createdBy ? `By ${this.customer.createdBy}` : undefined,
        icon: 'pi pi-calendar',
        tone: 'info'
      }
    ];
  }

  statusTone(): PillTone {
    return customerStatusTone(this.customer?.status) as PillTone;
  }

  orgStatusTone(status?: string | null): PillTone {
    return statusTone(status) as PillTone;
  }

  back(): void {
    void this.router.navigate(['/app/tenant-management/customers']);
  }

  edit(): void {
    if (!this.customerId) return;
    void this.router.navigate(['/app/tenant-management/customers', this.customerId, 'edit']);
  }

  addOrganization(): void {
    if (!this.customerId) return;
    void this.router.navigate(['/app/tenant-management/organizations/create'], {
      queryParams: { customerId: this.customerId }
    });
  }

  openOrganization(org: OrganizationSummary): void {
    void this.router.navigate(['/app/tenant-management/organizations', org.id]);
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  private matchesCustomerAudit(log: PlatformAuditLog, customerId: string): boolean {
    const entityType = (log.entityType ?? '').toUpperCase();
    const entityId = log.entityId ?? '';
    if (entityType.includes('CUSTOMER') && entityId === customerId) return true;
    const haystack = `${log.action} ${log.summary ?? ''} ${log.changes ?? ''}`.toLowerCase();
    return haystack.includes('customer') && entityId === customerId;
  }
}
