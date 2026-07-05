import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { debounceTime, Subject } from 'rxjs';

import {
  SaasFilterRowComponent,
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';
import { Customer, CustomerDashboard, CustomerStatus, CustomerType } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  customerInitials,
  customerStatusLabel,
  customerStatusTone,
  customerTypeLabel,
  formatCurrency,
  formatDate
} from '../../utils/platform-display.util';

type ViewMode = 'cards' | 'table';
type StatusFilter = 'all' | CustomerStatus;
type TypeFilter = 'all' | CustomerType;

const VIEW_KEY = 'tc-customer-view-mode';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink, PaginatorModule, ToastModule,
    SaasPageHeaderComponent, SaasPanelComponent,
    SaasFilterRowComponent, SaasPillComponent, SaasStatGridComponent
  ],
  providers: [MessageService],
  templateUrl: './customers-list.component.html',
  styleUrl: './customers-list.component.scss'
})
export class CustomersListComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly search$ = new Subject<string>();

  loading = true;
  errorMessage = '';
  dashboard: CustomerDashboard | null = null;
  customers: Customer[] = [];
  search = '';
  statusFilter: StatusFilter = 'all';
  typeFilter: TypeFilter = 'all';
  viewMode: ViewMode = 'cards';
  page = 0;
  pageSize = 12;
  totalRecords = 0;

  readonly customerInitials = customerInitials;
  readonly customerStatusLabel = customerStatusLabel;
  readonly customerTypeLabel = customerTypeLabel;
  readonly customerStatusTone = customerStatusTone;
  readonly formatDate = formatDate;
  readonly formatCurrency = formatCurrency;

  readonly statusOptions: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All Status' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'TRIAL', label: 'Trial' },
    { id: 'LEAD', label: 'Lead' },
    { id: 'SUSPENDED', label: 'Suspended' }
  ];

  readonly typeOptions: { id: TypeFilter; label: string }[] = [
    { id: 'all', label: 'All Types' },
    { id: 'EDUCATION_GROUP', label: 'Education Group' },
    { id: 'SCHOOL', label: 'School' },
    { id: 'COLLEGE', label: 'College' },
    { id: 'UNIVERSITY', label: 'University' },
    { id: 'TRUST', label: 'Trust' },
    { id: 'COMPANY', label: 'Company' }
  ];

  ngOnInit(): void {
    const saved = localStorage.getItem(VIEW_KEY) as ViewMode | null;
    if (saved === 'cards' || saved === 'table') {
      this.viewMode = saved;
    }
    this.search$.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page = 0;
      this.loadCustomers();
    });
    this.load();
  }

  get stats(): SaasStat[] {
    const d = this.dashboard;
    return [
      { key: 'total', label: 'Total Customers', value: d?.totalCustomers ?? 0, icon: 'pi pi-users', tone: 'primary' },
      { key: 'active', label: 'Active Customers', value: d?.activeCustomers ?? 0, icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'orgs', label: 'Total Organizations', value: d?.totalOrganizations ?? 0, icon: 'pi pi-building', tone: 'info' },
      { key: 'revenue', label: 'Annual Revenue', value: formatCurrency(d?.annualRevenue), icon: 'pi pi-wallet', tone: 'primary' },
      { key: 'renewals', label: 'Renewals (30 Days)', value: d?.renewals30Days ?? 0, icon: 'pi pi-calendar', tone: 'warning' },
      { key: 'trial', label: 'Trial Customers', value: d?.trialCustomers ?? 0, icon: 'pi pi-clock', tone: 'info' }
    ];
  }

  onStatClick(key: string): void {
    if (key === 'active') this.applyStatFilter('ACTIVE');
    else if (key === 'trial') this.applyStatFilter('TRIAL');
    else if (key === 'total') this.applyStatFilter('all');
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getCustomerDashboard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => { this.dashboard = d; this.loadCustomers(); },
      error: () => { this.dashboard = null; this.loadCustomers(); }
    });
  }

  loadCustomers(): void {
    this.api.getCustomers({
      status: this.statusFilter === 'all' ? undefined : this.statusFilter,
      customerType: this.typeFilter === 'all' ? undefined : this.typeFilter,
      search: this.search.trim() || undefined,
      activeOnly: true,
      page: this.page,
      size: this.pageSize
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        this.customers = page.content ?? [];
        this.totalRecords = page.totalElements ?? 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Could not load customers. Verify platform APIs and Super Admin access.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(): void { this.search$.next(this.search); }
  onFilterChange(): void { this.page = 0; this.loadCustomers(); }
  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'all';
    this.typeFilter = 'all';
    this.page = 0;
    this.loadCustomers();
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    localStorage.setItem(VIEW_KEY, mode);
    this.pageSize = mode === 'table' ? 20 : 12;
    this.page = 0;
    this.loadCustomers();
  }

  applyStatFilter(status: StatusFilter): void {
    this.statusFilter = status;
    this.onFilterChange();
  }

  onPageChange(event: { page?: number; first?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    if (event.rows) this.pageSize = event.rows;
    this.loadCustomers();
  }

  openCustomer(customer: Customer, event?: Event): void {
    event?.stopPropagation();
    void this.router.navigate(['/app/tenant-management/customers', customer.id]);
  }

  addOrganization(customer: Customer, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/app/tenant-management/organizations/create'], {
      queryParams: { customerId: customer.id }
    });
  }

  trackById(_: number, item: Customer): number { return item.id; }
}
