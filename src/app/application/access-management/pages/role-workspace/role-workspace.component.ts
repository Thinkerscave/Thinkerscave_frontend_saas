import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize, forkJoin } from 'rxjs';

import { AccessRole, PermissionMatrixRow } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { roleTypeLabel } from '../../utils/access-display.util';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { LoginService } from '../../../../core/services/login.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';

interface MenuAssignNode {
  row: PermissionMatrixRow;
  children: MenuAssignNode[];
}

type Privilege = 'canView' | 'canManage' | 'canApprove';

@Component({
  selector: 'app-role-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, 
    CommonModule, FormsModule,
    SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent
  ],
  providers: [MessageService],
  templateUrl: './role-workspace.component.html',
  styleUrl: './role-workspace.component.scss'
})
export class RoleWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly login = inject(LoginService);

  loading = true;
  saving = false;
  editingMenus = false;
  errorMessage = '';
  roleId = 0;
  role: AccessRole | null = null;
  rows: PermissionMatrixRow[] = [];
  modules: MenuAssignNode[] = [];
  search = '';
  private menuSnapshot: PermissionMatrixRow[] = [];
  private nodeById = new Map<number, MenuAssignNode>();

  readonly roleTypeLabel = roleTypeLabel;

  get canConfigure(): boolean {
    if (this.login.getLoginContext() === 'PLATFORM') {
      return true;
    }
    const roles = this.login.getUserRole() ?? [];
    return roles.some(role => this.normalizeRoleToken(role) === 'SUPER_ADMIN');
  }

  get assignedMenuCount(): number {
    return this.rows.filter(row => this.granted(row)).length;
  }

  get visibleModules(): MenuAssignNode[] {
    return this.filterTree(this.modules, this.search.trim().toLowerCase(), false);
  }

  get assignedModules(): MenuAssignNode[] {
    return this.filterTree(this.modules, this.search.trim().toLowerCase(), true);
  }

  ngOnInit(): void {
    this.roleId = Number(this.route.snapshot.paramMap.get('roleId'));
    this.load();
  }

  load(): void {
    if (!this.roleId) {
      this.errorMessage = 'Invalid role.';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.editingMenus = false;
    this.search = '';
    forkJoin({
      role: this.api.getRole(this.roleId),
      matrix: this.api.getPermissionMatrix(this.roleId)
    }).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ role, matrix }) => {
        this.role = role;
        this.rows = (matrix.rows ?? []).map(r => ({ ...r }));
        this.modules = this.buildTree(this.rows);
        this.pageHeader.setPageSubtitle(role?.roleCode || 'Role menu assignment');
      },
      error: () => {
        this.errorMessage = 'Unable to load role workspace.';
        this.role = null;
        this.rows = [];
        this.modules = [];
      }
    });
  }

  startEditMenus(): void {
    if (!this.canConfigure) return;
    this.menuSnapshot = this.rows.map(row => ({ ...row }));
    this.editingMenus = true;
    this.cdr.markForCheck();
  }

  cancelEditMenus(): void {
    this.rows = this.menuSnapshot.map(row => ({ ...row }));
    this.modules = this.buildTree(this.rows);
    this.editingMenus = false;
    this.cdr.markForCheck();
  }

  toggleLeaf(row: PermissionMatrixRow, field: Privilege): void {
    if (!this.canConfigure || !this.editingMenus) return;
    this.applyPrivilege(row, field, !row[field]);
    this.syncAncestors(row.parentMenuId);
    this.cdr.markForCheck();
  }

  toggleModule(node: MenuAssignNode, field: Privilege): void {
    if (!this.canConfigure || !this.editingMenus) return;
    if (!node.children.length) {
      this.toggleLeaf(node.row, field);
      return;
    }
    const enable = !this.allChildrenHave(node, field);
    for (const child of node.children) {
      this.applyBranchPrivilege(child, field, enable);
    }
    this.syncNodeFromChildren(node);
    this.syncAncestors(node.row.parentMenuId);
    this.cdr.markForCheck();
  }

  allChildrenHave(node: MenuAssignNode, field: Privilege): boolean {
    const leaves = this.collectLeaves(node);
    return leaves.length > 0 && leaves.every(row => !!row[field]);
  }

  someChildrenHave(node: MenuAssignNode, field: Privilege): boolean {
    const leaves = this.collectLeaves(node);
    return leaves.some(row => !!row[field]) && !this.allChildrenHave(node, field);
  }

  moduleAssigned(node: MenuAssignNode): boolean {
    return this.nodeGranted(node);
  }

  saveMenus(): void {
    if (!this.canConfigure || this.saving || !this.editingMenus) return;
    this.saving = true;
    this.api.updatePermissionMatrix(this.roleId, this.rows.map(r => ({
      menuId: r.menuId,
      canView: !!r.canView,
      canManage: !!r.canManage,
      canApprove: !!r.canApprove
    }))).pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.editingMenus = false;
        this.messages.add({
          severity: 'success',
          summary: 'Menus saved',
          detail: 'Role menu and submenu assignment updated.'
        });
        this.load();
      },
      error: () => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: 'Could not update role menu assignment.'
      })
    });
  }

  trackByMenuId(_: number, node: MenuAssignNode): number {
    return node.row.menuId;
  }

  private applyPrivilege(row: PermissionMatrixRow, field: Privilege, enable: boolean): void {
    row[field] = enable;
    if ((field === 'canManage' || field === 'canApprove') && enable) {
      row.canView = true;
    }
    if (field === 'canView' && !enable) {
      row.canManage = false;
      row.canApprove = false;
    }
  }

  private applyBranchPrivilege(node: MenuAssignNode, field: Privilege, enable: boolean): void {
    this.applyPrivilege(node.row, field, enable);
    for (const child of node.children) {
      this.applyBranchPrivilege(child, field, enable);
    }
    this.syncNodeFromChildren(node);
  }

  private syncAncestors(parentMenuId?: number): void {
    let current = parentMenuId;
    while (current && this.nodeById.has(current)) {
      const parent = this.nodeById.get(current)!;
      this.syncNodeFromChildren(parent);
      current = parent.row.parentMenuId;
    }
  }

  private syncNodeFromChildren(node: MenuAssignNode): void {
    if (!node.children.length) return;
    const leaves = this.collectLeaves(node);
    node.row.canView = leaves.some(row => this.granted(row));
    node.row.canManage = leaves.length > 0 && leaves.every(row => !!row.canManage);
    node.row.canApprove = leaves.length > 0 && leaves.every(row => !!row.canApprove);
  }

  private collectLeaves(node: MenuAssignNode): PermissionMatrixRow[] {
    if (!node.children.length) {
      return [node.row];
    }
    return node.children.flatMap(child => this.collectLeaves(child));
  }

  private filterTree(nodes: MenuAssignNode[], query: string, assignedOnly: boolean): MenuAssignNode[] {
    const filtered: MenuAssignNode[] = [];
    for (const node of nodes) {
      const matchedSelf = !query || this.matches(node.row, query);
      const filteredChildren = this.filterTree(node.children, query, assignedOnly);
      const hasAssigned = this.nodeGranted(node);

      if (assignedOnly && !hasAssigned) {
        continue;
      }

      if (!query) {
        filtered.push({ row: node.row, children: filteredChildren });
        continue;
      }

      if (matchedSelf) {
        filtered.push({
          row: node.row,
          children: assignedOnly ? this.filterTree(node.children, '', true) : node.children
        });
        continue;
      }

      if (filteredChildren.length) {
        filtered.push({ row: node.row, children: filteredChildren });
      }
    }
    return filtered;
  }

  private nodeGranted(node: MenuAssignNode): boolean {
    if (this.granted(node.row)) {
      return true;
    }
    return node.children.some(child => this.nodeGranted(child));
  }

  private granted(row: PermissionMatrixRow): boolean {
    return !!(row.canView || row.canManage || row.canApprove);
  }

  private matches(row: PermissionMatrixRow, query: string): boolean {
    const q = query.toLowerCase();
    return row.menuName.toLowerCase().includes(q) || row.menuCode.toLowerCase().includes(q);
  }

  private buildTree(rows: PermissionMatrixRow[]): MenuAssignNode[] {
    const byId = new Map<number, MenuAssignNode>();
    for (const row of rows) {
      byId.set(row.menuId, { row, children: [] });
    }
    const roots: MenuAssignNode[] = [];
    for (const node of byId.values()) {
      const parentId = node.row.parentMenuId;
      if (parentId && byId.has(parentId)) {
        byId.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    const sortNodes = (nodes: MenuAssignNode[]) => {
      nodes.sort((left, right) =>
        (left.row.displayOrder ?? 0) - (right.row.displayOrder ?? 0)
        || left.row.menuName.localeCompare(right.row.menuName)
      );
      nodes.forEach(child => sortNodes(child.children));
    };
    sortNodes(roots);
    this.nodeById = byId;
    return roots;
  }

  private normalizeRoleToken(raw: unknown): string {
    if (raw == null) return '';
    if (typeof raw === 'string') {
      return raw.toUpperCase().replace(/^ROLE_/, '');
    }
    if (typeof raw === 'object') {
      const item = raw as Record<string, unknown>;
      const candidates = [item['roleType'], item['roleCode'], item['roleName']];
      for (const value of candidates) {
        if (typeof value === 'string' && value.trim()) {
          return value.toUpperCase().replace(/^ROLE_/, '');
        }
      }
    }
    return '';
  }
}

