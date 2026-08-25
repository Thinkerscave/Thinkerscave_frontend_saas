import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';

import { LoginHistoryEntry, LoginStatus } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { formatDateTime, loginStatusLabel, loginStatusTone } from '../../utils/access-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { defaultPageSizeForView, pageSizeOptionsForView } from '../../../../shared/config/ui-standards';

@Component({
  selector: 'app-login-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, DropdownModule,
    SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasPillComponent,
    AppPaginatorComponent
  ],
  templateUrl: './login-history.component.html',
  styleUrl: './login-history.component.scss'
})
export class LoginHistoryComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = true;
  errorMessage = '';
  statusFilter: 'all' | LoginStatus = 'all';
  rangeDays: 7 | 30 = 7;
  entries: LoginHistoryEntry[] = [];
  totalRecords = 0;
  page = 0;
  pageSize = defaultPageSizeForView('table');
  userIdFilter: number | null = null;
  userNameFilter = '';

  readonly rangeOptions: { label: string; value: 7 | 30 }[] = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 }
  ];

  readonly statusOptions: { label: string; value: 'all' | LoginStatus }[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'Success', value: 'SUCCESS' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Locked', value: 'LOCKED' },
    { label: 'Logged out', value: 'LOGGED_OUT' }
  ];

  readonly loginStatusLabel = loginStatusLabel;
  readonly loginStatusTone = loginStatusTone;
  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const userId = Number(params.get('userId'));
      this.userIdFilter = userId || null;
      this.userNameFilter = params.get('user') || '';
      this.page = 0;
      this.load();
    });
  }

  get pageSizeOptions(): number[] {
    return pageSizeOptionsForView('table');
  }

  get stats(): SaasStat[] {
    const success = this.entries.filter(e => e.status === 'SUCCESS').length;
    const failed = this.entries.filter(e => e.status === 'FAILED').length;
    return [
      { key: 'window', label: `Last ${this.rangeDays} days`, value: this.totalRecords, icon: 'pi pi-history', tone: 'primary' },
      { key: 'success', label: 'Successful (this page)', value: success, icon: 'pi pi-check', tone: 'success' },
      { key: 'failed', label: 'Failed (this page)', value: failed, icon: 'pi pi-times', tone: 'danger' }
    ];
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getOrgLoginHistory(
      this.api.organizationId(),
      {
        status: this.statusFilter === 'all' ? undefined : this.statusFilter,
        from: this.windowStart(),
        to: this.windowEnd(),
        userId: this.userIdFilter ?? undefined
      },
      this.page,
      this.pageSize
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        const cutoff = new Date(this.windowStart()).getTime();
        const rows = (page.content ?? []).filter(entry => {
          if (!entry.loginTime) return true;
          const time = new Date(entry.loginTime).getTime();
          return Number.isNaN(time) || time >= cutoff;
        });
        this.entries = rows;
        this.totalRecords = page.totalElements ?? rows.length;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.entries = [];
        this.totalRecords = 0;
        this.errorMessage = 'Could not load login history.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  clearUserFilter(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  onFilterChange(): void {
    this.page = 0;
    this.load();
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.load();
  }

  trackById(_: number, entry: LoginHistoryEntry): number { return entry.id; }

  private windowStart(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (this.rangeDays - 1));
    return date.toISOString();
  }

  private windowEnd(): string {
    return new Date().toISOString();
  }
}
