import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { LoginService } from '../../../../core/services/login.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { finalize, Observable } from 'rxjs';

import { AccessResponsibility, AccessResponsibilityRequest } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { formatDate } from '../../utils/access-display.util';
import { ACCESS_RESOURCES, accessCanManage } from '../../utils/access-resources';
import { AppListResultsComponent, AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { ListQuerySession } from '../../../../shared/utils/list-query.session';
import { ListContextService } from '../../../../core/services/list-context.service';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

const LIST_KEY = 'access.responsibilities.view';

@Component({
  selector: 'app-responsibilities-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent, DialogModule, TooltipModule, AppListToolbarComponent, AppListResultsComponent, AppPaginatorComponent,
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
  private readonly listContext = inject(ListContextService);
  private readonly viewPrefs = inject(ViewPreferenceService);
  private readonly query = new ListQuerySession();

  loading = true;
  refreshing = false;
  hasLoaded = false;
  saving = false;
  errorMessage = '';
  search = '';
  list: AccessResponsibility[] = [];
  totalRecords = 0;
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  readonly pageSizeOptions = UI_PAGINATION.options;
  view: AppListViewMode = this.viewPrefs.globalDefault();
  editorOpen = false;
  editingId: number | null = null;
  form: AccessResponsibilityRequest = this.emptyForm();
  readonly formatDate = formatDate;

  get canManage(): boolean {
    return accessCanManage(this.permissions, this.login, ACCESS_RESOURCES.responsibilities);
  }

  ngOnInit(): void {
    const saved = this.listContext.consume(LIST_KEY);
    if (saved) {
      this.page = saved.page ?? this.page;
      this.pageSize = saved.size ?? this.pageSize;
      this.search = saved.search ?? this.search;
      this.view = this.viewPrefs.initialView(saved.view);
    }
    this.reload();
  }

  get stats(): SaasStat[] {
    const active = this.list.filter(r => r.active !== false).length;
    return [
      { key: 'total', label: 'Responsibilities', value: this.totalRecords, icon: 'pi pi-sitemap', tone: 'primary' },
      { key: 'active', label: 'Active (this page)', value: active, icon: 'pi pi-check-circle', tone: 'success' }
    ];
  }

  reload(): void {
    const requestId = this.query.beginRequest();
    this.refreshing = true;
    if (!this.hasLoaded) {
      this.loading = true;
    }
    this.errorMessage = '';
    this.api.getResponsibilities({
      search: this.search.trim() || undefined,
      page: this.page,
      size: this.pageSize,
      sort: 'createdOn,desc'
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: page => {
        if (!this.query.isCurrent(requestId)) {
          return;
        }
        this.list = page.content ?? [];
        this.totalRecords = page.totalElements ?? 0;
        this.loading = false;
        this.refreshing = false;
        this.hasLoaded = true;
        this.cdr.markForCheck();
      },
      error: () => {
        if (!this.query.isCurrent(requestId)) {
          return;
        }
        this.list = [];
        this.errorMessage = 'Could not load responsibilities.';
        this.loading = false;
        this.refreshing = false;
        this.hasLoaded = true;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchTermChange(value: string): void {
    this.search = value;
  }

  applyQuery(): void {
    this.page = 0;
    this.reload();
  }

  resetFilters(): void {
    this.search = '';
    this.page = 0;
    this.reload();
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.reload();
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.view = mode;
    this.cdr.markForCheck();
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
        this.reload();
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
        this.reload();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not update status.' })
    });
  }

  openWorkspace(item: AccessResponsibility, event?: Event): void {
    event?.stopPropagation();
    this.persistListContext();
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

  private persistListContext(): void {
    this.listContext.save(LIST_KEY, {
      page: this.page,
      size: this.pageSize,
      search: this.search,
      view: this.view
    });
  }
}
