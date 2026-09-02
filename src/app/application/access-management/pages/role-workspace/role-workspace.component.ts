import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize, forkJoin } from 'rxjs';

import { AccessRole, PermissionMatrixRow } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { roleTypeLabel } from '../../utils/access-display.util';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { AppBackNavComponent } from '../../../../shared/ui/app-list';

@Component({
  selector: 'app-role-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, 
    CommonModule,
    SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent, SaasTabsComponent,
    AppBackNavComponent
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

  loading = true;
  saving = false;
  errorMessage = '';
  roleId = 0;
  role: AccessRole | null = null;
  rows: PermissionMatrixRow[] = [];
  activeTab = 'permissions';

  readonly tabs = [
    { key: 'permissions', label: 'Permission Matrix', icon: 'pi pi-key' },
    { key: 'overview', label: 'Overview', icon: 'pi pi-id-card' }
  ];
  readonly roleTypeLabel = roleTypeLabel;

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
        this.pageHeader.setPageHeader({
          title: role?.roleName || 'Role Workspace'
        });
        this.pageHeader.setPageSubtitle(role?.roleCode || 'Permission assignment');
      },
      error: () => {
        this.errorMessage = 'Unable to load role workspace.';
        this.role = null;
        this.rows = [];
      }
    });
  }

  toggle(row: PermissionMatrixRow, field: 'canView' | 'canManage' | 'canApprove'): void {
    row[field] = !row[field];
    if (field === 'canManage' || field === 'canApprove') row.canView = row.canView || row.canManage || row.canApprove;
    if (field === 'canView' && !row.canView) { row.canManage = false; row.canApprove = false; }
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.saving) return;
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
      next: () => this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Permission matrix updated.' }),
      error: () => this.messages.add({ severity: 'error', summary: 'Save failed', detail: 'Could not update permissions.' })
    });
  }

  trackByMenuId(_: number, row: PermissionMatrixRow): number { return row.menuId; }
}

