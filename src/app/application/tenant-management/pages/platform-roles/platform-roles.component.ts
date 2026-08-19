import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { finalize, of, switchMap } from 'rxjs';

import { AccessRole, AccessUser, CreateRolePayload, RoleType, UpdateRolePayload } from '../../../access-management/models/access.model';
import { AccessManagementService } from '../../../access-management/services/access-management.service';
import { roleTypeLabel } from '../../../access-management/utils/access-display.util';
import {
  SaasPageHeaderComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';
import { AppListViewMode } from '../../../../shared/ui/app-list';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';

@Component({
  selector: 'app-platform-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink, DropdownModule, DialogModule,
    SaasPageHeaderComponent, SaasStatGridComponent
  ],
  templateUrl: './platform-roles.component.html',
  styleUrl: './platform-roles.component.scss'
})
export class PlatformRolesComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(UiFeedbackService);

  loading = true;
  saving = false;
  errorMessage = '';
  search = '';
  editorOpen = false;
  viewMode: AppListViewMode = 'grid';
  page = 1;
  pageSize = 8;
  roles: AccessRole[] = [];
  selectedRole: AccessRole | null = null;
  roleUsers: AccessUser[] = [];
  loadingUsers = false;
  draft: CreateRolePayload & { id?: number; active: boolean } = this.emptyDraft();

  readonly roleTypeLabel = roleTypeLabel;
  readonly roleTypes: RoleType[] = ['SUPER_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'STAFF', 'STUDENT', 'PARENT'];
  readonly roleTypeOptions = this.roleTypes.map(t => ({ label: roleTypeLabel(t), value: t }));

  ngOnInit(): void { this.load(); }

  get stats(): SaasStat[] {
    return [
      { key: 'total', label: 'Roles', value: this.roles.length, icon: 'pi pi-user-edit', tone: 'primary' },
      { key: 'active', label: 'Saved', value: this.roles.filter(r => r.active !== false).length, icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'system', label: 'System', value: this.roles.filter(r => r.systemRole).length, icon: 'pi pi-cog', tone: 'info' },
      { key: 'drafts', label: 'Drafts', value: this.roles.filter(r => r.active === false).length, icon: 'pi pi-pencil', tone: 'warning' }
    ];
  }

  get filtered(): AccessRole[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.roles;
    return this.roles.filter(r => r.roleName.toLowerCase().includes(q) || r.roleCode.toLowerCase().includes(q));
  }

  get paged(): AccessRole[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize) || 1);
  }

  get pageStart(): number {
    return this.filtered.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.filtered.length);
  }

  onListViewModeChange(mode: AppListViewMode): void {
    this.viewMode = mode;
    this.page = 1;
  }

  setPage(next: number): void {
    this.page = Math.min(Math.max(1, next), this.totalPages);
  }

  setPageSize(size: number | string): void {
    this.pageSize = Number(size);
    this.page = 1;
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.page = 1;
    this.ensureSelectedRole();
  }

  selectRole(role: AccessRole): void {
    if (this.selectedRole?.id === role.id) return;
    this.selectedRole = role;
    this.roleUsers = [];
    this.loadRoleUsers(role);
    this.revealExpandedCard();
  }

  userDisplay(user: AccessUser): string {
    return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getRoles(true).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: roles => {
        this.roles = roles ?? [];
        this.ensureSelectedRole();
      },
      error: () => {
        this.roles = [];
        this.errorMessage = 'Could not load roles.';
      }
    });
  }

  openCreate(): void {
    this.draft = this.emptyDraft();
    this.editorOpen = true;
  }

  openEdit(role: AccessRole): void {
    this.draft = {
      id: role.id,
      roleCode: role.roleCode,
      roleName: role.roleName,
      description: role.description ?? '',
      roleType: role.roleType ?? 'STAFF',
      dashboardCode: role.dashboardCode ?? 'STAFF',
      displayOrder: role.displayOrder ?? 1,
      active: role.active !== false
    };
    this.editorOpen = true;
  }

  closeEditor(): void { this.editorOpen = false; }

  save(): void {
    if (!this.draft.roleName.trim() || (!this.draft.id && !this.draft.roleCode.trim())) {
      this.feedback.warn('Missing fields', 'Role code and name are required.');
      return;
    }
    this.saving = true;
    const previous = this.draft.id ? this.roles.find(role => role.id === this.draft.id) : undefined;
    const request$ = this.draft.id
      ? this.api.updateRole(this.draft.id, this.toUpdatePayload())
      : this.api.createRole(this.toCreatePayload());
    request$.pipe(
      switchMap(saved => {
        if (this.draft.id && previous && previous.active !== this.draft.active) {
          return this.draft.active ? this.api.activateRole(this.draft.id) : this.api.deactivateRole(this.draft.id);
        }
        return of(saved);
      }),
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.feedback.success('Saved', this.draft.active ? 'Role saved.' : 'Role saved as inactive.');
        this.editorOpen = false;
        this.load();
      },
      error: () => this.feedback.warn('Save failed', 'Could not save the role. Use ROLE_XXX for the code.')
    });
  }

  trackById(_: number, item: AccessRole): number { return item.id; }

  private loadRoleUsers(role: AccessRole): void {
    this.loadingUsers = true;
    this.api.getRoleUsers(role.id).pipe(
      finalize(() => { this.loadingUsers = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: users => this.roleUsers = users ?? [],
      error: () => this.roleUsers = []
    });
  }

  private ensureSelectedRole(): void {
    const list = this.filtered;
    if (!list.length) {
      this.selectedRole = null;
      this.roleUsers = [];
      return;
    }
    const current = this.selectedRole && list.find(role => role.id === this.selectedRole?.id);
    if (current) {
      this.selectedRole = current;
      this.loadRoleUsers(current);
      return;
    }
    this.selectedRole = list[0];
    this.loadRoleUsers(list[0]);
    const index = list.findIndex(role => role.id === list[0].id);
    if (index >= 0) this.page = Math.floor(index / this.pageSize) + 1;
  }

  private revealExpandedCard(): void {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches) {
      queueMicrotask(() => document.querySelector('.cat-card.is-expanded')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    }
  }

  private emptyDraft(): CreateRolePayload & { id?: number; active: boolean } {
    return {
      roleCode: 'ROLE_',
      roleName: '',
      description: '',
      roleType: 'STAFF',
      dashboardCode: 'STAFF',
      displayOrder: 1,
      active: true
    };
  }

  private toCreatePayload(): CreateRolePayload {
    return {
      roleCode: this.draft.roleCode.trim().toUpperCase(),
      roleName: this.draft.roleName.trim(),
      description: this.draft.description?.trim(),
      roleType: this.draft.roleType,
      dashboardCode: this.draft.dashboardCode,
      displayOrder: this.draft.displayOrder,
      active: this.draft.active
    };
  }

  private toUpdatePayload(): UpdateRolePayload {
    return {
      roleName: this.draft.roleName.trim(),
      description: this.draft.description?.trim(),
      dashboardCode: this.draft.dashboardCode,
      displayOrder: this.draft.displayOrder
    };
  }
}
