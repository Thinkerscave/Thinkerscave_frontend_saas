import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { LoginService } from '../../../../core/services/login.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { debounceTime, finalize, Observable, Subject } from 'rxjs';

import { AccessResponsibility, AccessResponsibilityRequest } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { formatDate } from '../../utils/access-display.util';
import { ACCESS_RESOURCES, accessCanManage } from '../../utils/access-resources';
import { AppGridTableToggleComponent, AppListViewMode } from '../../../../shared/ui/app-list';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-responsibilities-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent, DialogModule, TooltipModule, PaginatorModule, AppGridTableToggleComponent,
    CommonModule, FormsModule,
    SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasPillComponent
  ],
  providers: [MessageService],
  templateUrl: './responsibilities-list.component.html',
  styleUrl: './responsibilities-list.component.scss'
})
export class ResponsibilitiesListComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly login = inject(LoginService);
  private readonly messages = inject(MessageService);
  private readonly permissions = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly search$ = new Subject<string>();

  loading = true;
  saving = false;
  errorMessage = '';
  search = '';
  list: AccessResponsibility[] = [];
  totalRecords = 0;
  page = 0;
  pageSize = 12;
  view: AppListViewMode = 'table';
  editorOpen = false;
  editingId: number | null = null;
  form: AccessResponsibilityRequest = this.emptyForm();
  readonly formatDate = formatDate;

  get canManage(): boolean {
    return accessCanManage(this.permissions, this.login, ACCESS_RESOURCES.responsibilities);
  }

  ngOnInit(): void {
    this.search$.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.load();
  }

  get stats(): SaasStat[] {
    const active = this.list.filter(r => r.active !== false).length;
    return [
      { key: 'total', label: 'Responsibilities', value: this.totalRecords, icon: 'pi pi-sitemap', tone: 'primary' },
      { key: 'active', label: 'Active (this page)', value: active, icon: 'pi pi-check-circle', tone: 'success' }
    ];
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getResponsibilities({
      search: this.search.trim() || undefined,
      page: this.page,
      size: this.pageSize,
      sort: 'createdOn,desc'
    }).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: page => {
        this.list = page.content ?? [];
        this.totalRecords = page.totalElements ?? 0;
      },
      error: () => {
        this.list = [];
        this.errorMessage = 'Could not load responsibilities.';
      }
    });
  }

  onSearchChange(): void { this.search$.next(this.search); }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    this.load();
  }

  openCreate(): void {
    if (!this.canManage) return;
    this.editingId = null;
    this.form = this.emptyForm();
    this.editorOpen = true;
  }

  openEdit(item: AccessResponsibility, event?: Event): void {
    event?.stopPropagation();
    if (!this.canManage) return;
    this.editingId = item.responsibilityId;
    this.form = {
      responsibilityCode: item.responsibilityCode,
      responsibilityName: item.responsibilityName,
      description: item.description ?? '',
      displayOrder: item.displayOrder ?? 0,
      remarks: item.remarks ?? ''
    };
    this.editorOpen = true;
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.editingId = null;
  }

  save(): void {
    if (!this.form.responsibilityName.trim() || !this.form.responsibilityCode.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Missing fields', detail: 'Code and name are required.' });
      return;
    }
    this.saving = true;
    const payload: AccessResponsibilityRequest = {
      ...this.form,
      responsibilityCode: this.form.responsibilityCode.trim().toUpperCase(),
      responsibilityName: this.form.responsibilityName.trim()
    };
    const request$: Observable<unknown> = this.editingId
      ? this.api.updateResponsibility(this.editingId, payload)
      : this.api.createResponsibility(payload);
    request$.pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.editingId ? 'Updated' : 'Created',
          detail: `${payload.responsibilityName} saved.`
        });
        this.closeEditor();
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Save failed', detail: 'Could not save responsibility.' })
    });
  }

  toggleActive(item: AccessResponsibility, event?: Event): void {
    event?.stopPropagation();
    if (!this.canManage || item.systemDefined) return;
    const action = item.active
      ? this.api.deactivateResponsibility(item.responsibilityId)
      : this.api.activateResponsibility(item.responsibilityId);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: item.active ? 'Deactivated' : 'Activated',
          detail: `${item.responsibilityName} is now ${item.active ? 'inactive' : 'active'}.`
        });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not update status.' })
    });
  }

  openWorkspace(item: AccessResponsibility, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/app/access-management/responsibilities', item.responsibilityId]);
  }

  trackById(_: number, item: AccessResponsibility): number { return item.responsibilityId; }

  private emptyForm(): AccessResponsibilityRequest {
    return {
      responsibilityCode: '',
      responsibilityName: '',
      description: '',
      displayOrder: 0,
      remarks: ''
    };
  }
}
