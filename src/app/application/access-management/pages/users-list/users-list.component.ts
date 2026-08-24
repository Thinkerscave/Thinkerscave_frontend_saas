import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { PermissionService } from '../../../../core/services/permission.service';
import { LoginService } from '../../../../core/services/login.service';
import { debounceTime, Subject } from 'rxjs';

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
import { AppGridTableToggleComponent, AppListViewMode } from '../../../../shared/ui/app-list';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-users-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent, ConfirmDialogModule, DialogModule, TooltipModule,
    CommonModule, FormsModule, DropdownModule, PaginatorModule, AppGridTableToggleComponent,
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
  private readonly search$ = new Subject<string>();

  loading = true;
  errorMessage = '';
  search = '';
  statusFilter: 'all' | UserStatus = 'all';
  roleFilter: 'all' | RoleType = 'all';
  users: AccessUser[] = [];
  totalRecords = 0;
  page = 0;
  pageSize = 12;
  view: AppListViewMode = 'table';
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
    this.search$.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.load();
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

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.searchUsers(this.api.organizationId(), {
      search: this.search.trim() || undefined,
      status: this.statusFilter === 'all' ? undefined : this.statusFilter,
      roleType: this.roleFilter === 'all' ? undefined : this.roleFilter,
      sort: 'createdOn,desc'
    }, this.page, this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        this.users = page.content ?? [];
        this.totalRecords = page.totalElements ?? 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.users = [];
        this.errorMessage = 'Could not load users.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(): void { this.search$.next(this.search); }
  onFilterChange(): void { this.page = 0; this.load(); }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    this.load();
  }

  openDetails(user: AccessUser): void {
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
        this.load();
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
}
