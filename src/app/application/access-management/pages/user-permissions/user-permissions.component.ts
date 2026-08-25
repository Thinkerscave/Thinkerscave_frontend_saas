import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { LoginService } from '../../../../core/services/login.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { finalize, forkJoin } from 'rxjs';

import { AccessUser, EffectivePermission } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import {
  formatDate,
  formatDateTime,
  userDisplayName,
  userEffectiveStatus,
  userStatusLabel,
  userStatusTone
} from '../../utils/access-display.util';
import { DEV_RESET_PASSWORD, resetPasswordConfirmMessage, resetPasswordTooltip } from '../../utils/access-dev.config';
import { ACCESS_RESOURCES, accessCanManage } from '../../utils/access-resources';
import { SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent } from '../../../../shared/ui/saas';
import { AppBackNavComponent } from '../../../../shared/ui/app-list';

interface MenuAccessNode {
  menuId: number;
  menuName: string;
  menuCode: string;
  canView: boolean;
  canManage: boolean;
  canApprove: boolean;
  children: MenuAccessNode[];
}

@Component({
  selector: 'app-user-permissions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent, ConfirmDialogModule, TooltipModule, CommonModule,
    SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent, AppBackNavComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-permissions.component.html',
  styleUrl: './user-permissions.component.scss'
})
export class UserPermissionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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
  modules: MenuAccessNode[] = [];
  resetBanner: string | null = null;

  readonly userDisplayName = userDisplayName;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;
  readonly resetTooltip = resetPasswordTooltip();

  get canManage(): boolean {
    return accessCanManage(this.permissionsApi, this.login, ACCESS_RESOURCES.users);
  }

  get pageCount(): number {
    return this.modules.reduce((sum, module) => sum + module.children.length, 0);
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
        this.modules = this.buildTree(permissions ?? []);
        this.pageHeader.setPageHeader({ title: user ? userDisplayName(user) : 'User access' });
        this.pageHeader.setPageSubtitle('Account, assigned menus and sign-in activity');
      },
      error: () => {
        this.errorMessage = 'Unable to load this user.';
        this.user = null;
        this.modules = [];
      }
    });
  }

  formatRoles(): string {
    const names = (this.user?.roles ?? []).map(r => r.roleName).filter(Boolean);
    return names.length ? names.join(', ') : '—';
  }

  statusLabel(): string {
    return userStatusLabel(userEffectiveStatus(this.user));
  }

  statusTone(): 'success' | 'warning' | 'danger' | 'neutral' {
    return userStatusTone(userEffectiveStatus(this.user));
  }

  isLocked(): boolean {
    return userEffectiveStatus(this.user) === 'LOCKED';
  }

  lockTooltip(): string {
    return this.isLocked()
      ? 'Allow this person to sign in again. Status will change to Active.'
      : 'Block this person from signing in. Status will change to Locked.';
  }

  toggleLock(): void {
    if (!this.user || !this.canManage) return;
    const locked = this.isLocked();
    const action = locked ? this.api.unlockUser(this.user.id) : this.api.lockUser(this.user.id);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: locked ? 'Account unlocked' : 'Account locked',
          detail: locked
            ? `${userDisplayName(this.user!)} can sign in again.`
            : `${userDisplayName(this.user!)} cannot sign in until you unlock them.`
        });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not update lock status.' })
    });
  }

  confirmResetPassword(): void {
    if (!this.user || !this.canManage) return;
    this.confirm.confirm({
      header: 'Reset password?',
      message: resetPasswordConfirmMessage(userDisplayName(this.user)),
      acceptLabel: 'Reset password',
      rejectLabel: 'Cancel',
      accept: () => {
        if (!this.user) return;
        this.api.resetUserPassword(this.user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.resetBanner = DEV_RESET_PASSWORD
              ? `Password is now ${DEV_RESET_PASSWORD}. They must use it at the next sign-in.`
              : 'A temporary password was sent to their email.';
            this.messages.add({ severity: 'success', summary: 'Password reset', detail: this.resetBanner });
            this.cdr.markForCheck();
          },
          error: () => this.messages.add({ severity: 'error', summary: 'Reset failed' })
        });
      }
    });
  }

  openLoginHistory(): void {
    if (!this.user) return;
    this.router.navigate(['/app/access-management/login-history'], {
      queryParams: { userId: this.user.id, user: userDisplayName(this.user) }
    });
  }

  trackByMenuId(_: number, node: MenuAccessNode): number { return node.menuId; }

  private buildTree(permissions: EffectivePermission[]): MenuAccessNode[] {
    const granted = permissions.filter(item => item.canView || item.canManage || item.canApprove);
    const byId = new Map<number, MenuAccessNode>();
    const toNode = (item: EffectivePermission): MenuAccessNode => ({
      menuId: item.menuId,
      menuName: item.menuName || item.menuCode || 'Untitled',
      menuCode: item.menuCode,
      canView: !!item.canView,
      canManage: !!item.canManage,
      canApprove: !!item.canApprove,
      children: []
    });

    for (const item of granted) {
      byId.set(item.menuId, toNode(item));
    }

    const roots: MenuAccessNode[] = [];
    const orphansByParent = new Map<string, MenuAccessNode[]>();

    for (const item of granted) {
      const node = byId.get(item.menuId)!;
      const parentId = item.parentMenuId;
      if (parentId && byId.has(parentId)) {
        byId.get(parentId)!.children.push(node);
        continue;
      }
      if (item.parentMenuName) {
        const key = item.parentMenuName;
        if (!orphansByParent.has(key)) orphansByParent.set(key, []);
        orphansByParent.get(key)!.push(node);
        continue;
      }
      roots.push(node);
    }

    for (const [name, children] of orphansByParent) {
      const existing = roots.find(r => r.menuName === name) ?? [...byId.values()].find(r => r.menuName === name);
      if (existing) {
        existing.children.push(...children);
      } else {
        roots.push({
          menuId: -roots.length - 1,
          menuName: name,
          menuCode: '',
          canView: true,
          canManage: false,
          canApprove: false,
          children
        });
      }
    }

    return roots
      .map(module => ({
        ...module,
        children: module.children.length ? module.children : []
      }))
      .sort((a, b) => a.menuName.localeCompare(b.menuName));
  }
}
