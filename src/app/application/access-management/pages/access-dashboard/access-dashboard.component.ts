import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AccessDashboardSummary, AccessRole, AccessUser } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { LoginService } from '../../../../core/services/login.service';
import { roleTokensFromUser } from '../../../../core/utils/workspace-home';
import { userDisplayName } from '../../utils/access-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-access-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent],
  templateUrl: './access-dashboard.component.html',
  styleUrl: './access-dashboard.component.scss'
})
export class AccessDashboardComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly login = inject(LoginService);

  loading = true;
  errorMessage = '';
  summary: AccessDashboardSummary | null = null;
  selectedRole: AccessRole | null = null;
  roleUsers: AccessUser[] = [];
  loadingUsers = false;
  readonly userDisplayName = userDisplayName;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getDashboardSummary().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: summary => {
        this.summary = summary;
        this.loading = false;
        if (this.selectedRole) {
          this.selectedRole = this.roles.find(role => role.id === this.selectedRole?.id) ?? null;
          if (this.selectedRole) this.loadRoleUsers(this.selectedRole);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load access dashboard. Verify organization context and admin permissions.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get roles(): AccessRole[] {
    const tokens = roleTokensFromUser(this.login.getUser());
    const isSuperAdmin = tokens.includes('SUPER_ADMIN') || tokens.includes('PLATFORM_ADMIN');
    return (this.summary?.roles ?? []).filter(role => isSuperAdmin || role.roleType !== 'SUPER_ADMIN');
  }

  get stats(): SaasStat[] {
    const s = this.summary;
    if (!s) return [];
    return [
      { key: 'users', label: 'Users', value: s.totalUsers, helper: `${s.activeUsers} active`, icon: 'pi pi-users', tone: 'success' },
      { key: 'roles', label: 'Roles', value: this.roles.length, helper: `${s.activeRoles} saved`, icon: 'pi pi-user-edit', tone: 'info' },
      { key: 'locked', label: 'Locked Accounts', value: s.lockedUsers, helper: 'Needs review', icon: 'pi pi-lock', tone: s.lockedUsers ? 'warning' : 'neutral' }
    ];
  }

  selectRole(role: AccessRole): void {
    this.selectedRole = this.selectedRole?.id === role.id ? null : role;
    this.roleUsers = [];
    if (this.selectedRole) this.loadRoleUsers(this.selectedRole);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  private loadRoleUsers(role: AccessRole): void {
    this.loadingUsers = true;
    this.api.getRoleUsers(role.id, this.api.organizationId()).pipe(
      finalize(() => { this.loadingUsers = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: users => this.roleUsers = users ?? [],
      error: () => this.roleUsers = []
    });
  }
}
