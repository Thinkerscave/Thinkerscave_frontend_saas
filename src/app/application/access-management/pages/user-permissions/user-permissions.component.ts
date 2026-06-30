import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { finalize, forkJoin } from 'rxjs';

import { AccessUser, EffectivePermission } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { userDisplayName } from '../../utils/access-display.util';
import { SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent } from '../../../../shared/ui/saas';

@Component({
  selector: 'app-user-permissions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ToastModule, SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent],
  providers: [MessageService],
  templateUrl: './user-permissions.component.html',
  styleUrl: './user-permissions.component.scss'
})
export class UserPermissionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);

  loading = true;
  saving = false;
  errorMessage = '';
  userId = 0;
  user: AccessUser | null = null;
  permissions: EffectivePermission[] = [];
  overrideMenuIds = new Set<number>();

  readonly userDisplayName = userDisplayName;

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
        this.permissions = (permissions ?? []).map(p => ({ ...p }));
        this.overrideMenuIds = new Set(permissions.filter(p => p.isOverride).map(p => p.menuId));
      },
      error: () => {
        this.errorMessage = 'Unable to load user permissions.';
        this.user = null;
        this.permissions = [];
      }
    });
  }

  toggle(perm: EffectivePermission, field: 'canView' | 'canManage' | 'canApprove'): void {
    perm[field] = !perm[field];
    this.overrideMenuIds.add(perm.menuId);
    perm.isOverride = true;
    if (field === 'canManage' || field === 'canApprove') perm.canView = perm.canView || perm.canManage || perm.canApprove;
    if (field === 'canView' && !perm.canView) { perm.canManage = false; perm.canApprove = false; }
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.saving) return;
    this.saving = true;
    const overrides = this.permissions
      .filter(p => this.overrideMenuIds.has(p.menuId))
      .map(p => ({
        menuId: p.menuId,
        canView: !!p.canView,
        canManage: !!p.canManage,
        canApprove: !!p.canApprove,
        active: true
      }));
    this.api.updateUserPermissions(this.userId, overrides).pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.messages.add({ severity: 'success', summary: 'Saved', detail: 'User permission overrides updated.' }),
      error: () => this.messages.add({ severity: 'error', summary: 'Save failed', detail: 'Could not save overrides.' })
    });
  }

  trackByMenuId(_: number, p: EffectivePermission): number { return p.menuId; }
}
