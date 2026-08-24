import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { LoginService } from '../../../../core/services/login.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { finalize, forkJoin } from 'rxjs';

import { AccessResponsibility, PermissionMatrixRow } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { ACCESS_RESOURCES, accessCanManage } from '../../utils/access-resources';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-responsibility-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent,
    CommonModule,
    RouterLink,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasPillComponent
  ],
  providers: [MessageService],
  templateUrl: './responsibility-workspace.component.html',
  styleUrl: './responsibility-workspace.component.scss'
})
export class ResponsibilityWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly login = inject(LoginService);
  private readonly permissions = inject(PermissionService);

  loading = true;
  saving = false;
  errorMessage = '';
  responsibilityId = 0;
  responsibility: AccessResponsibility | null = null;
  rows: PermissionMatrixRow[] = [];

  get canManage(): boolean {
    return accessCanManage(this.permissions, this.login, ACCESS_RESOURCES.responsibilities);
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
    forkJoin({
      responsibility: this.api.getResponsibility(this.responsibilityId),
      matrix: this.api.getResponsibilityPermissions(this.responsibilityId)
    }).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ responsibility, matrix }) => {
        this.responsibility = responsibility;
        this.rows = (matrix.rows ?? []).map(r => ({ ...r }));
        this.pageHeader.setPageHeader({
          title: responsibility?.responsibilityName || 'Menu assignment'
        });
        this.pageHeader.setPageSubtitle(responsibility?.responsibilityCode || 'Assign menus to this responsibility');
      },
      error: () => {
        this.errorMessage = 'Unable to load this responsibility or its menu assignment.';
        this.responsibility = null;
        this.rows = [];
      }
    });
  }

  toggle(row: PermissionMatrixRow, field: 'canView' | 'canManage' | 'canApprove'): void {
    if (!this.canManage) return;
    row[field] = !row[field];
    if (field === 'canManage' || field === 'canApprove') row.canView = row.canView || row.canManage || row.canApprove;
    if (field === 'canView' && !row.canView) { row.canManage = false; row.canApprove = false; }
    this.cdr.markForCheck();
  }

  save(): void {
    if (!this.canManage || this.saving) return;
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
      next: () => this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Menu assignment updated.' }),
      error: () => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: 'Could not save menu assignment for this responsibility.'
      })
    });
  }

  trackByMenuId(_: number, row: PermissionMatrixRow): number { return row.menuId; }
}
