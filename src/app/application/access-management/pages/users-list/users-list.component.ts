import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { ListContextService } from '../../../../core/services/list-context.service';
import { AccessUser, RoleType, UserStatus } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import {
  formatDate,
  formatDateTime,
  roleTypeLabel,
  userDisplayName,
  userEffectiveStatus,
  userInitials,
  userStatusLabel,
  userStatusTone
} from '../../utils/access-display.util';
import { AppListResultsComponent, AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { ListQuerySession } from '../../../../shared/utils/list-query.session';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

const LIST_KEY = 'access.users.view';

@Component({
  selector: 'app-users-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, DropdownModule, RouterLink,
    AppListToolbarComponent, AppListResultsComponent, AppPaginatorComponent,
    SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasPillComponent
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly listContext = inject(ListContextService);
  private readonly viewPrefs = inject(ViewPreferenceService);
  private readonly query = new ListQuerySession();

  loading = true;
  refreshing = false;
  hasLoaded = false;
  errorMessage = '';
  search = '';
  statusFilter: 'all' | UserStatus = 'all';
  roleFilter: 'all' | RoleType = 'all';
  private appliedStatus: 'all' | UserStatus = 'all';
  private appliedRole: 'all' | RoleType = 'all';
  users: AccessUser[] = [];
  totalRecords = 0;
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  readonly pageSizeOptions = UI_PAGINATION.options;
  view: AppListViewMode = this.viewPrefs.globalDefault();

  readonly statusOptions: { label: string; value: 'all' | UserStatus }[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Locked', value: 'LOCKED' }
  ];

  readonly roleOptions: { label: string; value: 'all' | RoleType }[] = [
    { label: 'All roles', value: 'all' },
    { label: 'Organization admin', value: 'ORGANIZATION_ADMIN' },
    { label: 'Staff', value: 'STAFF' },
    { label: 'Student', value: 'STUDENT' },
    { label: 'Parent', value: 'PARENT' }
  ];

  readonly userDisplayName = userDisplayName;
  readonly userInitials = userInitials;
  readonly roleTypeLabel = roleTypeLabel;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    const saved = this.listContext.consume(LIST_KEY);
    if (saved) {
      this.page = saved.page ?? this.page;
      this.pageSize = saved.size ?? this.pageSize;
      this.search = saved.search ?? this.search;
      this.view = this.viewPrefs.initialView(saved.view);
      if (saved.filters?.['status']) {
        this.statusFilter = saved.filters['status'] as 'all' | UserStatus;
        this.appliedStatus = this.statusFilter;
      }
      if (saved.filters?.['role']) {
        this.roleFilter = saved.filters['role'] as 'all' | RoleType;
        this.appliedRole = this.roleFilter;
      }
    }
    this.reload();
  }

  get stats(): SaasStat[] {
    const active = this.users.filter(u => userEffectiveStatus(u) === 'ACTIVE').length;
    const locked = this.users.filter(u => userEffectiveStatus(u) === 'LOCKED').length;
    return [
      { key: 'total', label: 'Users', value: this.totalRecords, icon: 'pi pi-users', tone: 'primary' },
      { key: 'active', label: 'Active (this page)', value: active, icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'locked', label: 'Locked (this page)', value: locked, icon: 'pi pi-lock', tone: 'warning' }
    ];
  }

  reload(): void {
    const requestId = this.query.beginRequest();
    this.refreshing = true;
    if (!this.hasLoaded) {
      this.loading = true;
    }
    this.errorMessage = '';
    this.api.searchUsers(this.api.organizationId(), {
      search: this.search.trim() || undefined,
      status: this.appliedStatus === 'all' ? undefined : this.appliedStatus,
      roleType: this.appliedRole === 'all' ? undefined : this.appliedRole,
      sort: 'createdOn,desc'
    }, this.page, this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        if (!this.query.isCurrent(requestId)) {
          return;
        }
        this.users = page.content ?? [];
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
        this.users = [];
        this.errorMessage = 'Could not load users.';
        this.loading = false;
        this.refreshing = false;
        this.hasLoaded = true;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchTermChange(value: string): void { this.search = value; }
  applyQuery(): void { this.page = 0; this.reload(); }

  applyFilters(): void {
    this.appliedRole = this.roleFilter;
    this.appliedStatus = this.statusFilter;
    this.page = 0;
    this.reload();
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'all';
    this.roleFilter = 'all';
    this.appliedStatus = 'all';
    this.appliedRole = 'all';
    this.page = 0;
    this.reload();
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.reload();
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.view = mode;
    this.cdr.markForCheck();
  }

  openDetails(user: AccessUser): void {
    this.persistListContext();
    this.router.navigate(['/app/access-management/users', user.id]);
  }

  rememberListContext(event: Event): void {
    event.stopPropagation();
    this.persistListContext();
  }

  statusLabel(user: AccessUser): string {
    return userStatusLabel(userEffectiveStatus(user));
  }

  statusTone(user: AccessUser): 'success' | 'warning' | 'danger' | 'neutral' {
    return userStatusTone(userEffectiveStatus(user));
  }

  secondaryIdentity(user: AccessUser): string {
    const username = (user.username || '').trim();
    const email = (user.email || '').trim();
    if (!username || username.toLowerCase() === email.toLowerCase()) return '';
    return username;
  }

  trackById(_: number, u: AccessUser): number { return u.id; }

  formatRoles(user: AccessUser): string {
    const names = (user.roles ?? []).map(r => r.roleName).filter(Boolean);
    return names.length ? names.join(', ') : '—';
  }

  private persistListContext(): void {
    this.listContext.save(LIST_KEY, {
      page: this.page,
      size: this.pageSize,
      search: this.search,
      view: this.view,
      filters: { status: this.appliedStatus, role: this.appliedRole }
    });
  }
}
