import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { BreadCrumbService } from '../../../../../core/services/bread-crumb.service';
import { PermissionService } from '../../../../../core/services/permission.service';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { AppGridTableToggleComponent, AppListViewMode, AppPaginatorComponent } from '../../../../../shared/ui/app-list';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { UI_PAGINATION } from '../../../../../shared/config/ui-standards';
import { AppPageChangeEvent } from '../../../../../shared/utils/paged-result.util';
import { extractApiError } from '../../../../../shared/utils/api-error.util';
import {
  ACADEMICS_SUBJECTS_RESOURCE,
  SUBJECT_STATUS_OPTIONS,
  SUBJECT_TYPE_FILTER_OPTIONS,
  SUBJECT_TYPE_OPTIONS,
  SubjectChoiceGroup,
  SubjectOption,
  SubjectStatusFilter,
  SubjectType,
  subjectTypeLabel,
  subjectTypeTone
} from '../../../models/subjects-mapping.model';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';

@Component({
  selector: 'app-choice-groups-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogModule,
    DialogModule,
    DropdownModule,
    MenuModule,
    HasPermissionDirective,
    TcPageSkeletonComponent,
    SaasPageHeaderComponent,
    AppGridTableToggleComponent,
    AppPaginatorComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './choice-groups.component.html',
  styleUrl: './choice-groups.component.scss'
})
export class ChoiceGroupsPageComponent implements OnInit {
  private readonly api = inject(SubjectsMappingApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_SUBJECTS_RESOURCE;
  readonly typeOptions = SUBJECT_TYPE_FILTER_OPTIONS;
  readonly formTypeOptions = SUBJECT_TYPE_OPTIONS;
  readonly statusOptions = SUBJECT_STATUS_OPTIONS;
  readonly pageSizeOptions = [10, 20, 50];
  readonly typeLabel = subjectTypeLabel;
  readonly typeTone = subjectTypeTone;

  private readonly search$ = new Subject<string>();
  private readonly optionSearch$ = new Subject<string>();

  groups: SubjectChoiceGroup[] = [];
  totalElements = 0;
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  searchTerm = '';
  typeFilter: SubjectType | null = null;
  statusFilter: SubjectStatusFilter = 'ACTIVE';
  viewMode: AppListViewMode = 'table';
  loading = true;
  refreshing = false;
  loadedOnce = false;
  loadError: string | null = null;

  dialogOpen = false;
  saving = false;
  editingGroup: SubjectChoiceGroup | null = null;
  groupName = '';
  formSubjectType: SubjectType | null = null;
  optionSearch = '';
  optionLoading = false;
  optionError: string | null = null;
  subjectOptions: SubjectOption[] = [];
  selectedSubjectIds = new Set<number>();
  menuItems: MenuItem[] = [];

  get canManage(): boolean {
    return this.permissions.canManage(this.resource);
  }

  get hasFilters(): boolean {
    return !!this.searchTerm.trim() || this.typeFilter !== null || this.statusFilter !== 'ACTIVE';
  }

  get selectedOptions(): SubjectOption[] {
    return this.subjectOptions.filter((subject) => this.selectedSubjectIds.has(subject.subjectId));
  }

  get canSave(): boolean {
    return !!this.groupName.trim()
      && this.groupName.trim().length <= 100
      && !!this.formSubjectType
      && this.selectedSubjectIds.size >= 2
      && !this.saving;
  }

  ngOnInit(): void {
    this.pageHeader.setPageSubtitle('Manage reusable groups of alternative subjects.');
    this.search$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 0;
        this.reload();
      });
    this.optionSearch$
      .pipe(debounceTime(220), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadSubjectOptions());
    this.reload();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value ?? '';
    this.search$.next(this.searchTerm);
  }

  onOptionSearchChange(value: string): void {
    this.optionSearch = value ?? '';
    this.optionSearch$.next(this.optionSearch);
  }

  onFilterChange(): void {
    this.page = 0;
    this.reload();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = null;
    this.statusFilter = 'ACTIVE';
    this.page = 0;
    this.reload();
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.viewMode = mode;
    this.cdr.markForCheck();
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.reload();
  }

  reload(): void {
    const initial = !this.loadedOnce;
    this.loading = initial;
    this.refreshing = !initial;
    this.loadError = null;
    this.cdr.markForCheck();
    this.api.listSubjectChoiceGroups({
      q: this.searchTerm.trim() || undefined,
      subjectType: this.typeFilter,
      status: this.statusFilter,
      page: this.page,
      size: this.pageSize
    }).pipe(finalize(() => {
      this.loading = false;
      this.refreshing = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (result) => {
        this.loadedOnce = true;
        this.groups = result.content ?? [];
        this.totalElements = result.totalElements ?? 0;
        const lastPage = Math.max(0, Math.ceil(this.totalElements / this.pageSize) - 1);
        if (this.page > lastPage) {
          this.page = lastPage;
          this.reload();
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loadError = extractApiError(error, 'Unable to load choice groups. Please try again.').message;
        this.cdr.markForCheck();
      }
    });
  }

  openCreate(): void {
    this.editingGroup = null;
    this.groupName = '';
    this.formSubjectType = null;
    this.subjectOptions = [];
    this.selectedSubjectIds.clear();
    this.optionSearch = '';
    this.optionError = null;
    this.dialogOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(group: SubjectChoiceGroup): void {
    this.editingGroup = group;
    this.groupName = group.name;
    this.formSubjectType = group.subjectType;
    this.selectedSubjectIds = new Set(group.subjects.map((subject) => subject.subjectId));
    this.optionSearch = '';
    this.optionError = null;
    this.subjectOptions = [];
    this.dialogOpen = true;
    this.loadSubjectOptions();
  }

  onFormTypeChange(): void {
    this.selectedSubjectIds.clear();
    this.subjectOptions = [];
    this.optionSearch = '';
    if (this.formSubjectType) this.loadSubjectOptions();
    this.cdr.markForCheck();
  }

  toggleSubject(subjectId: number): void {
    if (this.selectedSubjectIds.has(subjectId)) this.selectedSubjectIds.delete(subjectId);
    else this.selectedSubjectIds.add(subjectId);
    this.cdr.markForCheck();
  }

  removeSelected(subjectId: number): void {
    this.selectedSubjectIds.delete(subjectId);
    this.cdr.markForCheck();
  }

  isSelected(subjectId: number): boolean {
    return this.selectedSubjectIds.has(subjectId);
  }

  openMenu(group: SubjectChoiceGroup, menu: { toggle: (event: Event) => void }, event: Event): void {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.openEdit(group),
        visible: this.canManage
      },
      {
        label: group.active ? 'Deactivate' : 'Reactivate',
        icon: group.active ? 'pi pi-ban' : 'pi pi-check',
        command: () => this.confirmStatusChange(group),
        visible: this.canManage
      }
    ];
    menu.toggle(event);
  }

  save(): void {
    const name = this.groupName.trim().replace(/\s+/g, ' ');
    if (!name || name.length > 100 || !this.formSubjectType || this.selectedSubjectIds.size < 2) return;
    this.saving = true;
    this.cdr.markForCheck();
    const request = {
      name,
      subjectType: this.formSubjectType,
      subjectIds: [...this.selectedSubjectIds]
    };
    const request$ = this.editingGroup
      ? this.api.updateSubjectChoiceGroup(this.editingGroup.subjectChoiceGroupId, request)
      : this.api.createSubjectChoiceGroup(request);
    request$.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (saved) => {
        this.dialogOpen = false;
        this.messages.add({
          severity: 'success',
          summary: this.editingGroup ? 'Choice group updated' : 'Choice group created',
          detail: saved.name
        });
        this.reload();
      },
      error: (error) => this.showError(error, 'Unable to save choice group')
    });
  }

  confirmStatusChange(group: SubjectChoiceGroup): void {
    const active = !group.active;
    this.confirm.confirm({
      header: `${active ? 'Reactivate' : 'Deactivate'} ${group.name}?`,
      message: active
        ? 'This group will be available for new curriculum mappings.'
        : 'Existing mappings will be preserved. The group cannot be used for new mappings.',
      acceptLabel: active ? 'Reactivate' : 'Deactivate',
      accept: () => this.api.setSubjectChoiceGroupActive(group.subjectChoiceGroupId, active).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: `Choice group ${active ? 'reactivated' : 'deactivated'}` });
          this.reload();
        },
        error: (error) => this.showError(error, `Unable to ${active ? 'reactivate' : 'deactivate'} choice group`)
      })
    });
  }

  private loadSubjectOptions(): void {
    if (!this.formSubjectType) return;
    this.optionLoading = true;
    this.optionError = null;
    this.api.listChoiceGroupSubjectOptions({
      subjectType: this.formSubjectType,
      q: this.optionSearch.trim() || undefined,
      page: 0,
      size: 100
    }).pipe(finalize(() => {
      this.optionLoading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (page) => {
        this.subjectOptions = page.content ?? [];
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.optionError = extractApiError(error, 'Unable to load eligible subjects.').message;
        this.cdr.markForCheck();
      }
    });
  }

  private showError(error: unknown, summary: string): void {
    this.messages.add({
      severity: 'error',
      summary,
      detail: extractApiError(error, 'Please try again.').message
    });
  }
}
