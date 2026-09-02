import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { AccessUser, LoginHistoryEntry, LoginStatus, RetentionPurgeResult, RetentionTaskStatus } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import {
  formatDateTime,
  loginStatusLabel,
  loginStatusTone,
  userDisplayName,
  userInitials
} from '../../utils/access-display.util';
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
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule, FormsModule, DropdownModule, AutoCompleteModule,
    ConfirmDialogModule, ToastModule,
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
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  loading = true;
  errorMessage = '';
  statusFilter: 'all' | LoginStatus = 'all';
  rangeDays = 7;
  entries: LoginHistoryEntry[] = [];
  totalRecords = 0;
  page = 0;
  pageSize = defaultPageSizeForView('table');
  userIdFilter: number | null = null;
  userNameFilter = '';

  userSearchTerm = '';
  userSuggestions: AccessUser[] = [];
  private readonly userSearch$ = new Subject<string>();
  private userSearchRequested = 0;

  retention: RetentionTaskStatus | null = null;
  retentionLoading = false;
  retentionError = '';

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
  readonly userDisplayName = userDisplayName;
  readonly userInitials = userInitials;

  ngOnInit(): void {
    this.setupUserSearch();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const userId = Number(params.get('userId'));
      this.userIdFilter = userId || null;
      this.userNameFilter = params.get('user') || '';
      this.userSearchTerm = this.userNameFilter;
      this.page = 0;
      this.load();
    });
    this.loadRetention();
  }

  get pageSizeOptions(): number[] {
    return pageSizeOptionsForView('table');
  }

  get rangeOptions(): { label: string; value: number }[] {
    const options: { label: string; value: number }[] = [
      { label: 'Last 7 days', value: 7 },
      { label: 'Last 30 days', value: 30 }
    ];
    const retained = this.retention?.retentionDays ?? 30;
    if (retained > 30) {
      options.push({ label: `Last ${retained} days`, value: retained });
    }
    return options;
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
    this.userIdFilter = null;
    this.userNameFilter = '';
    this.userSearchTerm = '';
    this.userSuggestions = [];
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

  // ─── User autocomplete ────────────────────────────────────────────────

  private setupUserSearch(): void {
    this.userSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => this.searchUsers(term));
  }

  onUserSearch(event: { query: string }): void {
    this.userSearch$.next((event.query || '').trim());
  }

  private searchUsers(term: string): void {
    if (term.length < 2) {
      this.userSuggestions = [];
      this.cdr.markForCheck();
      return;
    }
    const requestId = ++this.userSearchRequested;
    this.api.searchUsers(this.api.organizationId(), { search: term, sort: 'displayName,asc' }, 0, 8)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          if (requestId !== this.userSearchRequested) {
            return;
          }
          this.userSuggestions = (page.content ?? []).slice(0, 8);
          this.cdr.markForCheck();
        },
        error: () => {
          if (requestId === this.userSearchRequested) {
            this.userSuggestions = [];
            this.cdr.markForCheck();
          }
        }
      });
  }

  onUserSelected(user: AccessUser): void {
    this.userIdFilter = user.id;
    this.userNameFilter = userDisplayName(user);
    this.userSearchTerm = this.userNameFilter;
    this.page = 0;
    this.load();
  }

  onUserSearchCleared(): void {
    this.userSuggestions = [];
    if (this.userIdFilter) {
      this.clearUserFilter();
    }
  }

  // ─── Archival / retention status ──────────────────────────────────────

  loadRetention(): void {
    this.retentionLoading = true;
    this.retentionError = '';
    this.api.getLoginHistoryRetention(this.api.organizationId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: status => {
          this.retention = status;
          this.retentionLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.retention = null;
          this.retentionLoading = false;
          this.retentionError = 'Could not load archival status.';
          this.cdr.markForCheck();
        }
      });
  }

  get lastRunLabel(): string {
    const last = this.retention?.lastRun;
    if (!last) {
      return 'Never run';
    }
    const deleted = last.deletedCount ?? 0;
    return `${formatDateTime(last.ranAt)} · ${deleted} record(s) deleted`;
  }

  get nextRunLabel(): string {
    if (!this.retention) {
      return '—';
    }
    if (this.retention.enabled === false) {
      return 'Archival disabled';
    }
    return this.retention.nextScheduledHint ? formatDateTime(this.retention.nextScheduledHint) : '—';
  }

  get totalDeletedRecent(): number {
    return (this.retention?.recentRuns ?? []).reduce((sum, run) => sum + (run.deletedCount ?? 0), 0);
  }

  triggerLabel(trigger?: RetentionPurgeResult['triggerType']): string {
    return trigger === 'SCHEDULED' ? 'Automatic' : 'Manual';
  }

  allOrgRunLabel(run: RetentionPurgeResult): string {
    return run.organizationId ? `Organization #${run.organizationId}` : 'All organizations';
  }

  purgeNow(): void {
    const days = this.retention?.retentionDays ?? 30;
    this.confirm.confirm({
      key: 'retentionPurge',
      message: `Delete login history older than ${days} days for this organization? This cannot be undone.`,
      header: 'Run archival now?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Purge old records',
      rejectLabel: 'Cancel',
      accept: () => {
        this.api.purgeLoginHistory(this.api.organizationId())
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              const deleted = result.deletedCount ?? 0;
              this.toast.add({
                severity: 'success',
                summary: 'Archival complete',
                detail: `${deleted} record(s) deleted. Keeping the last ${result.retentionDays ?? days} days for this organization.`
              });
              this.page = 0;
              this.load();
              this.loadRetention();
            },
            error: () => {
              this.toast.add({ severity: 'error', summary: 'Archival failed', detail: 'Could not run the archival job. Try again later.' });
            }
          });
      }
    });
  }

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