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
import { DropdownModule } from 'primeng/dropdown';

import { AppButtonComponent } from '../../../../shared/ui/app-form/app-button.component';
import {
  AppAvatarComponent,
  AppCustomerCardComponent,
  AppCustomerCardData,
  AppListToolbarComponent,
  AppListResultsComponent,
  AppListEmptyStateComponent,
  AppListViewMode,
  AppPaginatorComponent,
  AppSkeletonGroupComponent,
  AppSkeletonLoaderComponent,
  AppStatCardComponent,
  AppStatusBadgeComponent
} from '../../../../shared/ui/app-list';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { ListContextService } from '../../../../core/services/list-context.service';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { ListQuerySession } from '../../../../shared/utils/list-query.session';
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

@Component({
  selector: 'app-customers-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    MenuModule,
    SaasPageHeaderComponent,
    AppButtonComponent,
    AppStatCardComponent,
    AppListToolbarComponent,
    AppListResultsComponent,
    AppPaginatorComponent,
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
  private readonly listContext = inject(ListContextService);
  private readonly viewPrefs = inject(ViewPreferenceService);
  private readonly query = new ListQuerySession();

  @ViewChild('rowMenu') rowMenu?: Menu;

  loading = true;
  refreshing = false;
  hasLoaded = false;
  errorMessage = '';
  dashboard: CustomerDashboard | null = null;
  customers: CustomerListItem[] = [];
  menuItems: MenuItem[] = [];
  activeCustomer: CustomerListItem | null = null;

  search = '';
  statusFilter: StatusFilter = 'all';
  sortBy: CustomerSortOption = 'createdDesc';
  createdFilter: CustomerCreatedFilter = 'all';
  private appliedStatus: StatusFilter = 'all';
  private appliedSort: CustomerSortOption = 'createdDesc';
  private appliedCreated: CustomerCreatedFilter = 'all';
  viewMode: AppListViewMode = this.viewPrefs.globalDefault();
  isMobile = false;

  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  readonly pageSizeOptions = UI_PAGINATION.options;
  totalRecords = 0;

  readonly formatDate = formatDate;
  readonly formatCurrency = formatCurrency;

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

    const saved = this.listContext.consume(VIEW_KEY);
    if (saved) {
      this.page = saved.page ?? this.page;
      this.pageSize = saved.size ?? this.pageSize;
      this.search = saved.search ?? this.search;
      this.viewMode = this.viewPrefs.initialView(saved.view);
      if (saved.sort) {
        this.sortBy = saved.sort as CustomerSortOption;
        this.appliedSort = this.sortBy;
      }
      if (saved.filters?.['status']) {
        this.statusFilter = saved.filters['status'] as StatusFilter;
        this.appliedStatus = this.statusFilter;
      }
      if (saved.filters?.['created']) {
        this.createdFilter = saved.filters['created'] as CustomerCreatedFilter;
        this.appliedCreated = this.createdFilter;
      }
    }

    this.load();
  }

  get effectiveViewMode(): AppListViewMode {
    return this.isMobile ? 'grid' : this.viewMode;
  }

  load(): void {
    this.errorMessage = '';
    this.api.getCustomerDashboard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => {
        this.dashboard = d;
        this.cdr.markForCheck();
        this.loadCustomers();
      },
      error: () => {
        this.dashboard = null;
        this.loadCustomers();
      }
    });
  }

  loadCustomers(): void {
    const requestId = this.query.beginRequest();
    this.refreshing = true;
    if (!this.hasLoaded) {
      this.loading = true;
    }
    this.errorMessage = '';
    this.api.getCustomers({
      status: this.appliedStatus === 'all' ? undefined : this.appliedStatus,
      search: this.search.trim() || undefined,
      activeOnly: this.appliedStatus === 'ARCHIVED' ? false : true,
      created: this.appliedCreated,
      sort: this.appliedSort,
      page: this.page,
      size: this.pageSize
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        if (!this.query.isCurrent(requestId)) {
          return;
        }
        this.customers = page.content ?? [];
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
        this.errorMessage = "We couldn't load the customer list. Please try again.";
        this.customers = [];
        this.loading = false;
        this.refreshing = false;
        this.hasLoaded = true;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(value: string): void {
    this.search = value;
  }

  applyQuery(): void {
    this.page = 0;
    this.loadCustomers();
  }

  applyFilters(): void {
    this.appliedStatus = this.statusFilter;
    this.appliedSort = this.sortBy;
    this.appliedCreated = this.createdFilter;
    this.page = 0;
    this.loadCustomers();
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.viewMode = mode;
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'all';
    this.sortBy = 'createdDesc';
    this.createdFilter = 'all';
    this.appliedStatus = 'all';
    this.appliedSort = 'createdDesc';
    this.appliedCreated = 'all';
    this.page = 0;
    this.loadCustomers();
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
    this.persistListContext();
    void this.router.navigate(['/app/tenant-management/customers', customer.id]);
  }

  openOrganizations(customer: CustomerListItem, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/app/tenant-management/organizations'], {
      queryParams: { customerId: customer.id }
    });
  }

  editCustomer(customer: CustomerListItem): void {
    this.persistListContext();
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

  private persistListContext(): void {
    this.listContext.save(VIEW_KEY, {
      page: this.page,
      size: this.pageSize,
      search: this.search,
      sort: this.appliedSort,
      view: this.viewMode,
      filters: { status: this.appliedStatus, created: this.appliedCreated }
    });
  }
}
