import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { LoginService } from '../../../../core/services/login.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { finalize, forkJoin } from 'rxjs';

import { AccessUser, EffectivePermission } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { formatDate, formatDateTime, userDisplayName, userStatusLabel, userStatusTone } from '../../utils/access-display.util';
import { ACCESS_RESOURCES, accessCanManage } from '../../utils/access-resources';
import { SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent } from '../../../../shared/ui/saas';
import { AppBackNavComponent } from '../../../../shared/ui/app-list';

interface MenuGroup {
  module: string;
  items: EffectivePermission[];
}

@Component({
  selector: 'app-user-permissions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, ConfirmDialogModule, CommonModule, SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent, AppBackNavComponent],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-permissions.component.html',
  styleUrl: './user-permissions.component.scss'
})
export class UserPermissionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly login = inject(LoginService);
  private readonly messages = inject(MessageService);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly permissionsApi = inject(PermissionService);

  loading = true;
  errorMessage = '';
  userId = 0;
  user: AccessUser | null = null;
  groups: MenuGroup[] = [];

  readonly userDisplayName = userDisplayName;
  readonly userStatusLabel = userStatusLabel;
  readonly userStatusTone = userStatusTone;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;

  get canManage(): boolean {
    return accessCanManage(this.permissionsApi, this.login, ACCESS_RESOURCES.users);
  }

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('userId'));
    this.load();
  }

  load(): void {
    const orgId = this.api.organizationId();
    this.loading = true;
    forkJoin({
      user: this.api.getUser(orgId, this.userId),
      permissions: this.api.getUserEffectivePermissions(this.userId, orgId)
    }).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ user, permissions }) => {
        this.user = user;
        this.groups = this.groupMenus(permissions ?? []);
        this.pageHeader.setPageHeader({ title: user ? userDisplayName(user) : 'User access' });
        this.pageHeader.setPageSubtitle('Menus and submenus assigned to this person');
      },
      error: () => {
        this.errorMessage = 'Unable to load this user.';
        this.user = null;
        this.groups = [];
      }
    });
  }

  formatRoles(): string {
    const names = (this.user?.roles ?? []).map(r => r.roleName).filter(Boolean);
    return names.length ? names.join(', ') : '—';
  }

  isLocked(): boolean {
    return !!this.user?.accountLocked || this.user?.status === 'LOCKED';
  }

  toggleLock(): void {
    if (!this.user || !this.canManage) return;
    const locked = this.isLocked();
    const action = locked ? this.api.unlockUser(this.user.id) : this.api.lockUser(this.user.id);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.messages.add({ severity: 'success', summary: locked ? 'Unlocked' : 'Locked' }); this.load(); },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not update lock status.' })
    });
  }

  confirmResetPassword(): void {
    if (!this.user || !this.canManage) return;
    this.confirm.confirm({
      header: 'Reset password?',
      message: `Issue a new temporary password for ${userDisplayName(this.user)}?`,
      acceptLabel: 'Reset password',
      rejectLabel: 'Cancel',
      accept: () => {
        if (!this.user) return;
        this.api.resetUserPassword(this.user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: result => this.messages.add({
            severity: 'success',
            summary: 'Password reset',
            detail: result.temporaryPassword ? `Temporary password: ${result.temporaryPassword}` : 'Password reset.'
          }),
          error: () => this.messages.add({ severity: 'error', summary: 'Reset failed' })
        });
      }
    });
  }

  trackByMenuId(_: number, p: EffectivePermission): number { return p.menuId; }

  private groupMenus(permissions: EffectivePermission[]): MenuGroup[] {
    const map = new Map<string, EffectivePermission[]>();
    for (const item of permissions) {
      const module = item.menuName?.includes('/') ? item.menuName.split('/')[0] : (item.menuCode?.split('_')[0] || 'Menus');
      const key = module || 'Menus';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return [...map.entries()].map(([module, items]) => ({ module, items }));
  }
}
