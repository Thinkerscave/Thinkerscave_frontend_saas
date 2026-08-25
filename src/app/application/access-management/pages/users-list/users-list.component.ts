import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { PermissionService } from '../../../../core/services/permission.service';
import { LoginService } from '../../../../core/services/login.service';
import { ListContextService } from '../../../../core/services/list-context.service';
import { AccessUser, PasswordResetResult, RoleType, UserStatus } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import {
  formatDate,
  formatDateTime,
  roleTypeLabel,
  userDisplayName,
  userInitials,
  userStatusLabel,
  userStatusTone
} from '../../utils/access-display.util';
import { ACCESS_RESOURCES, accessCanManage } from '../../utils/access-resources';
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
    AppToastComponent, ConfirmDialogModule, DialogModule, TooltipModule,
    CommonModule, FormsModule, DropdownModule, AppListToolbarComponent, AppListResultsComponent, AppPaginatorComponent,
    SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasPillComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly login = inject(LoginService);
  private readonly messages = inject(MessageService);
  private readonly permissions = inject(PermissionService);
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
  resetResult: { user: string; password?: string } | null = null;
  infoUser: AccessUser | null = null;

  readonly statusOptions: { label: string; value: 'all' | UserStatus }[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Locked', value: 'LOCKED' },
    { label: 'Suspended', value: 'SUSPENDED' }
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
  readonly userStatusLabel = userStatusLabel;
  readonly userStatusTone = userStatusTone;
  readonly roleTypeLabel = roleTypeLabel;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;

  get canManage(): boolean {
    return accessCanManage(this.permissions, this.login, ACCESS_RESOURCES.users);
  }

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
    const active = this.users.filter(u => u.status === 'ACTIVE').length;
    const locked = this.users.filter(u => u.accountLocked || u.status === 'LOCKED').length;
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

  onSearchTermChange(value: string): void {
    this.search = value;
  }

  applyQuery(): void {
    this.page = 0;
    this.reload();
  }

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

  openInfo(user: AccessUser, event?: Event): void {
    event?.stopPropagation();
    this.infoUser = user;
  }

  closeInfo(): void { this.infoUser = null; }

  onInfoVisible(visible: boolean): void {
    if (!visible) this.infoUser = null;
  }

  toggleLock(user: AccessUser, event?: Event): void {
    event?.stopPropagation();
    if (!this.canManage) return;
    const locked = this.isLocked(user);
    const action = locked ? this.api.unlockUser(user.id) : this.api.lockUser(user.id);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: locked ? 'Account unlocked' : 'Account locked',
          detail: locked
            ? `${userDisplayName(user)} can sign in again.`
            : `${userDisplayName(user)} cannot sign in until you unlock them.`
        });
        this.reload();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Update failed', detail: 'Could not change lock status.' })
    });
  }

  isLocked(user: AccessUser): boolean {
    return !!user.accountLocked || user.status === 'LOCKED';
  }

  confirmResetPassword(user: AccessUser, event?: Event): void {
    event?.stopPropagation();
    if (!this.canManage) return;
    this.confirm.confirm({
      header: 'Reset password?',
      message: `Issue a new temporary password for ${userDisplayName(user)}? They must use it at the next sign-in.`,
      icon: 'pi pi-key',
      acceptLabel: 'Reset password',
      rejectLabel: 'Cancel',
      accept: () => this.resetPassword(user)
    });
  }

  private resetPassword(user: AccessUser): void {
    this.api.resetUserPassword(user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result: PasswordResetResult) => {
        this.resetResult = { user: userDisplayName(user), password: result.temporaryPassword };
        this.messages.add({
          severity: 'success',
          summary: 'Password reset',
          detail: result.temporaryPassword
            ? `Temporary password issued for ${userDisplayName(user)}.`
            : `Password reset for ${userDisplayName(user)}.`
        });
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({
        severity: 'error',
        summary: 'Reset failed',
        detail: 'Could not reset this password.'
      })
    });
  }

  dismissResetResult(): void { this.resetResult = null; }

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
