import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menu, MenuModule } from 'primeng/menu';
import { PaginatorModule } from 'primeng/paginator';
import { DropdownModule } from 'primeng/dropdown';
import { debounceTime, Subject } from 'rxjs';

import { AppButtonComponent } from '../../../../shared/ui/app-form/app-button.component';
import {
  AppAvatarComponent,
  AppCustomerCardComponent,
  AppCustomerCardData,
  AppFilterToolbarComponent,
  AppGridTableToggleComponent,
  AppListEmptyStateComponent,
  AppListViewMode,
  AppSearchBarComponent,
  AppSkeletonGroupComponent,
  AppSkeletonLoaderComponent,
  AppStatCardComponent,
  AppStatusBadgeComponent
} from '../../../../shared/ui/app-list';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import {
  CustomerCreatedFilter,
  CustomerDashboard,
  CustomerListItem,
  CustomerSortOption,
  CustomerStatus
} from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import { formatCurrency, formatDate } from '../../utils/platform-display.util';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';

type StatusFilter = 'all' | CustomerStatus;

const VIEW_KEY = 'tc-customer-view-mode';
const PAGE_SIZES = [10, 25, 50, 100];

@Component({
  selector: 'app-customers-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    PaginatorModule,
    MenuModule,
    SaasPageHeaderComponent,
    AppButtonComponent,
    AppStatCardComponent,
    AppSearchBarComponent,
    AppFilterToolbarComponent,
    AppGridTableToggleComponent,
    AppAvatarComponent,
    AppStatusBadgeComponent,
    AppCustomerCardComponent,
    AppListEmptyStateComponent,
    AppSkeletonLoaderComponent,
    AppSkeletonGroupComponent
  ],
  templateUrl: './customers-list.component.html',
  styleUrl: './customers-list.component.scss'
})
export class CustomersListComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(UiFeedbackService);
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly search$ = new Subject<string>();

  @ViewChild('rowMenu') rowMenu?: Menu;

  loading = true;
  errorMessage = '';
  dashboard: CustomerDashboard | null = null;
  customers: CustomerListItem[] = [];
  menuItems: MenuItem[] = [];
  activeCustomer: CustomerListItem | null = null;

  search = '';
  statusFilter: StatusFilter = 'all';
  sortBy: CustomerSortOption = 'createdDesc';
  createdFilter: CustomerCreatedFilter = 'all';
  viewMode: AppListViewMode = 'grid';
  isMobile = false;

  page = 0;
  pageSize = 25;
  totalRecords = 0;

  readonly formatDate = formatDate;
  readonly formatCurrency = formatCurrency;
  readonly pageSizeOptions = PAGE_SIZES;
  readonly viewStorageKey = VIEW_KEY;

  readonly sortOptions: { value: CustomerSortOption; label: string }[] = [
    { value: 'nameAsc', label: 'Name (A–Z)' },
    { value: 'nameDesc', label: 'Name (Z–A)' },
    { value: 'email', label: 'Owner Email' },
    { value: 'createdDesc', label: 'Recently Created' },
    { value: 'orgCount', label: 'Organization Count' },
    { value: 'lastActivity', label: 'Last Activity' }
  ];

  readonly statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'TRIAL', label: 'Trial' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'ARCHIVED', label: 'Archived' }
  ];

  readonly createdOptions: { value: CustomerCreatedFilter; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'year', label: 'This year' }
  ];

  ngOnInit(): void {
    this.breakpoint
      .observe('(max-width: 768px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.isMobile = state.matches;
        this.cdr.markForCheck();
      });

    this.search$.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page = 0;
      this.loadCustomers();
    });

    this.load();
  }

  get effectiveViewMode(): AppListViewMode {
    return this.isMobile ? 'grid' : this.viewMode;
  }

  get rangeStart(): number {
    return this.totalRecords === 0 ? 0 : this.page * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min((this.page + 1) * this.pageSize, this.totalRecords);
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getCustomerDashboard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => {
        this.dashboard = d;
        this.loadCustomers();
      },
      error: () => {
        this.dashboard = null;
        this.loadCustomers();
      }
    });
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getCustomers({
      status: this.statusFilter === 'all' ? undefined : this.statusFilter,
      search: this.search.trim() || undefined,
      activeOnly: this.statusFilter === 'ARCHIVED' ? false : true,
      created: this.createdFilter,
      sort: this.sortBy,
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
        this.errorMessage = "We couldn't load the customer list. Please try again.";
        this.customers = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.search$.next(value);
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadCustomers();
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.viewMode = mode;
  }

  addCustomer(): void {
    void this.router.navigate(['/app/tenant-management/customers/new']);
  }

  onPageChange(event: { page?: number; first?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.loadCustomers();
  }

  exportCustomers(): void {
    this.feedback.info('Export', 'Customer export will be available soon.');
  }

  openCustomer(customer: CustomerListItem, event?: Event): void {
    event?.stopPropagation();
    void this.router.navigate(['/app/tenant-management/customers', customer.id]);
  }

  openOrganizations(customer: CustomerListItem, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/app/tenant-management/organizations'], {
      queryParams: { customerId: customer.id }
    });
  }

  editCustomer(customer: CustomerListItem): void {
    void this.router.navigate(['/app/tenant-management/customers', customer.id, 'edit']);
  }

  createOrganization(customer: CustomerListItem): void {
    void this.router.navigate(['/app/tenant-management/organizations/create'], {
      queryParams: { customerId: customer.id }
    });
  }

  manageSubscription(_customer: CustomerListItem): void {
    this.feedback.info('Manage Subscription', 'Subscription management will be available soon.');
  }

  suspendCustomer(customer: CustomerListItem): void {
    const isSuspended = customer.status === 'SUSPENDED';
    const action = isSuspended ? this.api.activateCustomer(customer.id) : this.api.suspendCustomer(customer.id);
    const actionLabel = isSuspended ? 'Activated' : 'Suspended';
    const actionVerb = isSuspended ? 'activate' : 'suspend';

    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.feedback.success(actionLabel, `${customer.customerName} has been ${actionLabel.toLowerCase()}.`);
        this.load();
      },
      error: () => {
        this.feedback.error(`${actionLabel} failed`, `Could not ${actionVerb} this customer. Please try again.`);
      }
    });
  }

  archiveCustomer(customer: CustomerListItem): void {
    this.api.archiveCustomer(customer.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.feedback.success('Archived', `${customer.customerName} has been archived.`);
        this.load();
      },
      error: () => {
        this.feedback.error('Archive failed', 'Could not archive this customer. Please try again.');
      }
    });
  }

  openRowMenu(customer: CustomerListItem, event: Event): void {
    event.stopPropagation();
    this.activeCustomer = customer;
    const isSuspended = customer.status === 'SUSPENDED';
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.editCustomer(customer)
      },
      {
        label: 'Create Organization',
        icon: 'pi pi-building',
        command: () => this.createOrganization(customer)
      },
      {
        label: 'Manage Subscription',
        icon: 'pi pi-credit-card',
        command: () => this.manageSubscription(customer)
      },
      { separator: true },
      {
        label: isSuspended ? 'Activate' : 'Suspend',
        icon: isSuspended ? 'pi pi-check-circle' : 'pi pi-ban',
        command: () => this.suspendCustomer(customer)
      },
      {
        label: 'Archive',
        icon: 'pi pi-inbox',
        command: () => this.archiveCustomer(customer)
      }
    ];
    this.rowMenu?.toggle(event);
    this.cdr.markForCheck();
  }

  toCardData(customer: CustomerListItem): AppCustomerCardData {
    return {
      id: customer.id,
      customerName: customer.customerName,
      customerCode: customer.customerCode,
      domain: customer.domain,
      logoUrl: customer.logoUrl,
      status: customer.status,
      ownerName: customer.ownerName,
      ownerEmail: customer.ownerEmail,
      organizationCount: customer.organizationCount,
      createdDate: formatDate(customer.createdDate),
      lastActivity: customer.lastActivity || formatDate(customer.lastActivityAt)
    };
  }

  trackById(_: number, item: CustomerListItem): number {
    return item.id;
  }
}
