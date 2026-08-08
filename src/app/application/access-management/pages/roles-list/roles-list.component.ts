import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';

import { AccessRole, CreateRolePayload, RoleType } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { roleTypeLabel } from '../../utils/access-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ToastModule, DropdownModule,
    SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasPillComponent
  ],
  providers: [MessageService],
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.scss'
})
export class RolesListComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = true;
  saving = false;
  errorMessage = '';
  search = '';
  roles: AccessRole[] = [];
  createOpen = false;
  draft: CreateRolePayload = this.emptyDraft();

  readonly roleTypeLabel = roleTypeLabel;
  readonly roleTypes: RoleType[] = ['ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'STAFF', 'STUDENT', 'PARENT'];
  readonly roleTypeOptions: { label: string; value: RoleType }[] = this.roleTypes.map(t => ({
    label: roleTypeLabel(t),
    value: t
  }));

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('create') === 'true') {
      this.createOpen = true;
    }
    this.load();
  }

  get stats(): SaasStat[] {
    const active = this.roles.filter(r => r.active !== false).length;
    const system = this.roles.filter(r => r.systemRole).length;
    const users = this.roles.reduce((sum, r) => sum + (r.activeUserCount ?? 0), 0);
    return [
      { key: 'total', label: 'Total Roles', value: this.roles.length, icon: 'pi pi-user-edit', tone: 'primary' },
      { key: 'active', label: 'Active', value: active, icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'system', label: 'System Roles', value: system, icon: 'pi pi-cog', tone: 'info' },
      { key: 'users', label: 'Assigned Users', value: users, icon: 'pi pi-users', tone: 'neutral' }
    ];
  }

  get filtered(): AccessRole[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.roles;
    return this.roles.filter(r =>
      r.roleName.toLowerCase().includes(q) || r.roleCode.toLowerCase().includes(q)
    );
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getRoles().pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: roles => this.roles = roles ?? [],
      error: () => {
        this.roles = [];
        this.errorMessage = 'Could not load roles. Verify access permissions.';
      }
    });
  }

  openCreate(): void { this.draft = this.emptyDraft(); this.createOpen = true; }
  closeCreate(): void { this.createOpen = false; }

  submitCreate(): void {
    if (!this.draft.roleCode.trim() || !this.draft.roleName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Missing fields', detail: 'Role code and name are required.' });
      return;
    }
    this.saving = true;
    this.api.createRole({
      ...this.draft,
      roleCode: this.draft.roleCode.trim().toUpperCase(),
      roleName: this.draft.roleName.trim()
    }).pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: role => {
        this.messages.add({ severity: 'success', summary: 'Role created', detail: `${role.roleName} is ready for permission assignment.` });
        this.createOpen = false;
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Create failed', detail: 'Could not create role. Check code format (ROLE_XXX).' })
    });
  }

  toggleActive(role: AccessRole): void {
    if (role.systemRole) return;
    const action = role.active === false
      ? this.api.activateRole(role.id)
      : this.api.deactivateRole(role.id);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated', detail: `${role.roleName} status changed.` });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not update role status.' })
    });
  }

  openWorkspace(role: AccessRole): void {
    this.router.navigate(['/app/access-management/roles', role.id]);
  }

  trackById(_: number, item: AccessRole): number { return item.id; }

  private emptyDraft(): CreateRolePayload {
    return {
      roleCode: 'ROLE_',
      roleName: '',
      description: '',
      roleType: 'STAFF',
      dashboardCode: 'STAFF',
      displayOrder: 1
    };
  }
}
