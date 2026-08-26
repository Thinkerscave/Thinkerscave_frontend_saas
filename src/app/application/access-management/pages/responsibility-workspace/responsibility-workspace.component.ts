import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { LoginService } from '../../../../core/services/login.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { catchError, finalize, forkJoin } from 'rxjs';

import {
  AccessResponsibility,
  AccessResponsibilityRequest,
  PermissionMatrixRow,
  ResponsibilityStaffAssignment
} from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { formatDate } from '../../utils/access-display.util';
import { ACCESS_RESOURCES, accessCanManage } from '../../utils/access-resources';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { StaffService } from '../../../staff/services/staff.service';
import { StaffSummary } from '../../../staff/models/staff.model';
import { AppBackNavComponent } from '../../../../shared/ui/app-list';
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
  selector: 'app-responsibility-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent,
    CommonModule,
    ConfirmDialogModule,
    DialogModule,
    FormsModule,
    MultiSelectModule,
    TooltipModule,
    AppBackNavComponent,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasPillComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './responsibility-workspace.component.html',
  styleUrl: './responsibility-workspace.component.scss'
})
export class ResponsibilityWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AccessManagementService);
  private readonly staffApi = inject(StaffService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly login = inject(LoginService);
  private readonly permissions = inject(PermissionService);

  loading = true;
  saving = false;
  assigning = false;
  loadingStaff = false;
  editingMenus = false;
  errorMessage = '';
  responsibilityId = 0;
  responsibility: AccessResponsibility | null = null;
  rows: PermissionMatrixRow[] = [];
  modules: MenuAssignNode[] = [];
  assignedStaff: ResponsibilityStaffAssignment[] = [];
  editorOpen = false;
  assignOpen = false;
  form: AccessResponsibilityRequest = this.emptyForm();
  selectedStaffIds: number[] = [];
  staffOptions: { label: string; value: number }[] = [];
  staffLoadError = '';
  private menuSnapshot: PermissionMatrixRow[] = [];
  readonly formatDate = formatDate;

  get canManage(): boolean {
    return accessCanManage(this.permissions, this.login, ACCESS_RESOURCES.responsibilities);
  }

  get assignedMenuCount(): number {
    return this.rows.filter(r => this.granted(r)).length;
  }

  get assignedModules(): MenuAssignNode[] {
    return this.modules
      .map(module => ({
        row: module.row,
        children: module.children.filter(child => this.granted(child.row))
      }))
      .filter(module => this.granted(module.row) || module.children.length > 0);
  }

  ngOnInit(): void {
    this.responsibilityId = Number(this.route.snapshot.paramMap.get('responsibilityId'));
    this.load();
  }

  load(): void {
    if (!this.responsibilityId) {
      this.errorMessage = 'Invalid responsibility.';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.editingMenus = false;
    forkJoin({
      responsibility: this.api.getResponsibility(this.responsibilityId),
      matrix: this.api.getResponsibilityPermissions(this.responsibilityId),
      staff: this.api.getResponsibilityStaff(this.responsibilityId)
    }).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ responsibility, matrix, staff }) => {
        this.responsibility = responsibility;
        this.rows = (matrix.rows ?? []).map(r => ({ ...r }));
        this.modules = this.buildTree(this.rows);
        this.assignedStaff = staff ?? [];
        this.pageHeader.setPageHeader({
          title: responsibility?.responsibilityName || 'Responsibility'
        });
        this.pageHeader.setPageSubtitle(
          responsibility?.systemDefined ? 'Default responsibility · seeded with the organization' : 'Custom responsibility'
        );
      },
      error: () => {
        this.errorMessage = 'Unable to load this responsibility.';
        this.responsibility = null;
        this.rows = [];
        this.modules = [];
        this.assignedStaff = [];
      }
    });
  }

  typeLabel(): string {
    return this.responsibility?.systemDefined ? 'Default' : 'Custom';
  }

  startEditMenus(): void {
    if (!this.canManage) return;
    this.menuSnapshot = this.rows.map(r => ({ ...r }));
    this.editingMenus = true;
  }

  cancelEditMenus(): void {
    this.rows = this.menuSnapshot.map(r => ({ ...r }));
    this.modules = this.buildTree(this.rows);
    this.editingMenus = false;
  }

  toggleLeaf(row: PermissionMatrixRow, field: Privilege): void {
    if (!this.canManage || !this.editingMenus) return;
    this.applyPrivilege(row, field, !row[field]);
    const parent = this.modules.find(m => m.row.menuId === row.parentMenuId)
      ?? this.modules.find(m => m.children.some(c => c.row.menuId === row.menuId));
    if (parent) this.syncParentFromChildren(parent);
    this.cdr.markForCheck();
  }

  toggleModule(node: MenuAssignNode, field: Privilege): void {
    if (!this.canManage || !this.editingMenus) return;
    if (!node.children.length) {
      this.toggleLeaf(node.row, field);
      return;
    }
    const enable = !this.allChildrenHave(node, field);
    for (const child of node.children) {
      this.applyPrivilege(child.row, field, enable);
    }
    this.syncParentFromChildren(node);
    this.cdr.markForCheck();
  }

  allChildrenHave(node: MenuAssignNode, field: Privilege): boolean {
    return node.children.length > 0 && node.children.every(child => !!child.row[field]);
  }

  someChildrenHave(node: MenuAssignNode, field: Privilege): boolean {
    return node.children.some(child => !!child.row[field]) && !this.allChildrenHave(node, field);
  }

  saveMenus(): void {
    if (!this.canManage || this.saving || !this.editingMenus) return;
    this.saving = true;
    this.api.updateResponsibilityPermissions(this.responsibilityId, this.rows.map(r => ({
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
          detail: 'Assigned menus and submenus were updated.'
        });
        this.load();
      },
      error: () => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: 'Could not save menu assignment for this responsibility.'
      })
    });
  }

  openEdit(): void {
    if (!this.canManage || !this.responsibility) return;
    this.form = {
      responsibilityCode: this.responsibility.responsibilityCode,
      responsibilityName: this.responsibility.responsibilityName,
      description: this.responsibility.description ?? ''
    };
    this.editorOpen = true;
  }

  closeEditor(): void {
    this.editorOpen = false;
  }

  saveDetails(): void {
    if (!this.responsibility || !this.form.responsibilityName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Missing fields', detail: 'Name is required.' });
      return;
    }
    this.saving = true;
    this.api.updateResponsibility(this.responsibilityId, {
      responsibilityCode: this.responsibility.responsibilityCode,
      responsibilityName: this.form.responsibilityName.trim(),
      description: this.form.description?.trim() || undefined
    }).pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Responsibility details saved.' });
        this.closeEditor();
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Save failed', detail: 'Could not update this responsibility.' })
    });
  }

  confirmToggleActive(): void {
    if (!this.canManage || !this.responsibility) return;
    const active = this.responsibility.active !== false;
    this.confirm.confirm({
      header: active ? 'Deactivate responsibility?' : 'Activate responsibility?',
      message: active
        ? `${this.responsibility.responsibilityName} will no longer be available to assign to staff.`
        : `${this.responsibility.responsibilityName} will be available to assign again.`,
      acceptLabel: active ? 'Deactivate' : 'Activate',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: active ? 'p-button-danger' : 'p-button-success',
      accept: () => this.toggleActive()
    });
  }

  openAssignStaff(): void {
    if (!this.canManage) return;
    this.selectedStaffIds = [];
    this.staffLoadError = '';
    this.assignOpen = true;
    this.loadingStaff = true;
    const assigned = new Set(this.assignedStaff.map(s => s.staffId));
    this.staffApi.getStaffList({ employmentStatus: 'ACTIVE', page: 0, size: 200, sort: 'firstName,asc' }).pipe(
      catchError(() => this.staffApi.getStaffList({ page: 0, size: 200, sort: 'firstName,asc' })),
      finalize(() => { this.loadingStaff = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: page => {
        this.staffOptions = (page.content ?? [])
          .filter(s => s.active !== false && !assigned.has(s.staffId))
          .map(s => ({ label: this.staffLabel(s), value: s.staffId }));
        this.staffLoadError = '';
      },
      error: () => {
        this.staffOptions = [];
        this.staffLoadError = 'Could not load staff. Try again.';
        this.messages.add({ severity: 'error', summary: 'Staff list failed', detail: 'Could not load people to assign.' });
      }
    });
  }

  saveAssignedStaff(): void {
    if (!this.selectedStaffIds.length) {
      this.messages.add({ severity: 'warn', summary: 'Select staff', detail: 'Pick at least one person to assign.' });
      return;
    }
    this.assigning = true;
    this.api.assignStaffToResponsibility(this.responsibilityId, this.selectedStaffIds).pipe(
      finalize(() => { this.assigning = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: 'Staff assigned',
          detail: `${this.selectedStaffIds.length} staff now hold this responsibility.`
        });
        this.assignOpen = false;
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Assign failed', detail: 'Could not assign staff.' })
    });
  }

  confirmRemoveStaff(person: ResponsibilityStaffAssignment): void {
    if (!this.canManage) return;
    this.confirm.confirm({
      header: 'Remove assignment?',
      message: `${person.staffName || 'This staff member'} will no longer hold this responsibility.`,
      acceptLabel: 'Remove',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.removeStaff(person)
    });
  }

  openStaff(person: ResponsibilityStaffAssignment, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (person.userId) {
      this.router.navigate(['/app/access-management/users', person.userId]);
      return;
    }
    this.router.navigate(['/app/staff/profile', person.staffId]);
  }

  trackByMenuId(_: number, node: MenuAssignNode): number {
    return node.row.menuId;
  }

  trackByAssignment(_: number, item: ResponsibilityStaffAssignment): number {
    return item.assignmentId;
  }

  private toggleActive(): void {
    if (!this.responsibility) return;
    const active = this.responsibility.active !== false;
    const action = active
      ? this.api.deactivateResponsibility(this.responsibilityId)
      : this.api.activateResponsibility(this.responsibilityId);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: active ? 'Deactivated' : 'Activated',
          detail: `${this.responsibility!.responsibilityName} is now ${active ? 'inactive' : 'active'}.`
        });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not update status.' })
    });
  }

  private removeStaff(person: ResponsibilityStaffAssignment): void {
    this.api.removeResponsibilityAssignment(person.assignmentId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Removed', detail: `${person.staffName} is no longer assigned.` });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not remove this assignment.' })
    });
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

  private syncParentFromChildren(node: MenuAssignNode): void {
    if (!node.children.length) return;
    const anyGranted = node.children.some(child => this.granted(child.row));
    node.row.canView = anyGranted;
    node.row.canManage = this.allChildrenHave(node, 'canManage');
    node.row.canApprove = this.allChildrenHave(node, 'canApprove');
  }

  private granted(row: PermissionMatrixRow): boolean {
    return !!(row.canView || row.canManage || row.canApprove);
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
      nodes.sort((a, b) => (a.row.displayOrder ?? 0) - (b.row.displayOrder ?? 0)
        || a.row.menuName.localeCompare(b.row.menuName));
      nodes.forEach(n => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
  }

  private staffLabel(staff: StaffSummary): string {
    const role = staff.designation ? ` · ${staff.designation}` : '';
    return `${staff.fullName}${role}`;
  }

  private emptyForm(): AccessResponsibilityRequest {
    return { responsibilityCode: '', responsibilityName: '', description: '' };
  }
}
