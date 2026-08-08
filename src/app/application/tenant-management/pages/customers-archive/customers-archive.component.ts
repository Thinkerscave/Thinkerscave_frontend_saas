import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { debounceTime, Subject } from 'rxjs';

import { CustomerListItem } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  customerInitials,
  customerStatusLabel,
  customerStatusTone,
  formatDate
} from '../../utils/platform-display.util';
import {
  SaasFilterRowComponent,
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-customers-archive',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DropdownModule,
    PaginatorModule,
    ToastModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasFilterRowComponent,
    SaasPillComponent
  ],
  providers: [MessageService],
  templateUrl: './customers-archive.component.html',
  styleUrl: './customers-archive.component.scss'
})
export class CustomersArchiveComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly search$ = new Subject<string>();

  loading = true;
  actionLoadingId: number | null = null;
  errorMessage = '';
  customers: CustomerListItem[] = [];
  search = '';
  archivedOnly = true;
  page = 0;
  pageSize = 20;
  totalRecords = 0;

  readonly archivedOptions: { label: string; value: boolean }[] = [
    { label: 'Archived only', value: true },
    { label: 'All inactive', value: false }
  ];

  readonly customerInitials = customerInitials;
  readonly customerStatusLabel = customerStatusLabel;
  readonly customerStatusTone = customerStatusTone;
  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.search$.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page = 0;
      this.loadCustomers();
    });
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getCustomers({
      status: this.archivedOnly ? 'ARCHIVED' : undefined,
      search: this.search.trim() || undefined,
      activeOnly: false,
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
        this.errorMessage = 'Could not load archived customers. Verify platform APIs and Super Admin access.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(): void {
    this.search$.next(this.search);
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadCustomers();
  }

  resetFilters(): void {
    this.search = '';
    this.archivedOnly = true;
    this.page = 0;
    this.loadCustomers();
  }

  onPageChange(event: { page?: number; first?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    if (event.rows) this.pageSize = event.rows;
    this.loadCustomers();
  }

  openCustomer(customer: CustomerListItem): void {
    void this.router.navigate(['/app/tenant-management/customers', customer.id]);
  }

  restore(customer: CustomerListItem, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Restore "${customer.customerName}" to active customers?`)) return;
    this.runAction(customer.id, () => this.api.restoreCustomer(customer.id), 'Restored', 'Customer restored successfully.');
  }

  permanentDelete(customer: CustomerListItem, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Permanently delete "${customer.customerName}"? This cannot be undone.`)) return;
    this.runAction(
      customer.id,
      () => this.api.permanentlyDeleteCustomer(customer.id),
      'Deleted',
      'Customer permanently deleted.',
      true
    );
  }

  trackById(_: number, item: CustomerListItem): number {
    return item.id;
  }

  private runAction(
    id: number,
    fn: () => ReturnType<PlatformManagementService['restoreCustomer']>,
    summary: string,
    detail: string,
    removeFromList = false
  ): void {
    this.actionLoadingId = id;
    this.cdr.markForCheck();
    fn().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.messages.add({ severity: 'success', summary, detail, life: 4000 });
        if (removeFromList) {
          this.customers = this.customers.filter(c => c.id !== id);
          this.totalRecords = Math.max(0, this.totalRecords - 1);
        } else {
          this.loadCustomers();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.actionLoadingId = null;
        this.messages.add({
          severity: 'error',
          summary: 'Failed',
          detail: `Could not complete: ${summary.toLowerCase()}.`,
          life: 4000
        });
        this.cdr.markForCheck();
      }
    });
  }
}
