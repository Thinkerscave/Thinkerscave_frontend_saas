import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
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
    OverlayPanelModule,
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
  private optionRequestId = 0;

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
  selectedSubjectDetails = new Map<number, SubjectOption>();
  submitted = false;
  menuItems: MenuItem[] = [];

  @ViewChild('subjectPanel') subjectPanel?: OverlayPanel;

  get canManage(): boolean {
    return this.permissions.canManage(this.resource);
  }

  get hasFilters(): boolean {
    return !!this.searchTerm.trim() || this.typeFilter !== null || this.statusFilter !== 'ACTIVE';
  }

  get selectedSubjects(): SubjectOption[] {
    return [...this.selectedSubjectDetails.values()];
  }

  get nameError(): string | null {
    if (!this.submitted) return null;
    const name = this.groupName.trim();
    if (!name) return 'Group name is required.';
    if (name.length > 100) return 'Group name cannot exceed 100 characters.';
    return null;
  }

  get typeError(): string | null {
    return this.submitted && !this.formSubjectType ? 'Select a subject type.' : null;
  }

  get subjectsError(): string | null {
    if (!this.submitted) return null;
    return this.selectedSubjectIds.size < 2 ? 'Select at least two subjects.' : null;
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
    this.selectedSubjectDetails.clear();
    this.optionSearch = '';
    this.optionError = null;
    this.submitted = false;
    this.subjectPanel?.hide();
    this.dialogOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(group: SubjectChoiceGroup): void {
    this.editingGroup = group;
    this.groupName = group.name;
    this.formSubjectType = group.subjectType;
    this.selectedSubjectIds = new Set(group.subjects.map((subject) => subject.subjectId));
    this.selectedSubjectDetails = new Map(group.subjects.map((subject) => [subject.subjectId, {
      subjectId: subject.subjectId,
      name: subject.name,
      code: subject.code,
      subjectType: group.subjectType
    }]));
    this.optionSearch = '';
    this.optionError = null;
    this.submitted = false;
    this.subjectOptions = [];
    this.subjectPanel?.hide();
    this.dialogOpen = true;
    this.loadSubjectOptions();
  }

  onFormTypeChange(): void {
    const cleared = this.selectedSubjectIds.size;
    this.selectedSubjectIds.clear();
    this.selectedSubjectDetails.clear();
    this.subjectOptions = [];
    this.optionSearch = '';
    this.subjectPanel?.hide();
    if (cleared) {
      this.messages.add({
        severity: 'info',
        summary: 'Subjects cleared',
        detail: 'Choose subjects that match the new subject type.'
      });
    }
    if (this.formSubjectType) this.loadSubjectOptions();
    this.cdr.markForCheck();
  }

  onDialogVisibleChange(visible: boolean): void {
    this.dialogOpen = visible;
    if (!visible) this.subjectPanel?.hide();
    this.cdr.markForCheck();
  }

  /** Selecting an option keeps it in the field and closes the picker so the form stays visible. */
  selectSubject(subject: SubjectOption): void {
    this.toggleSubject(subject);
    this.subjectPanel?.hide();
  }

  toggleSubject(subject: SubjectOption): void {
    if (this.selectedSubjectIds.has(subject.subjectId)) {
      this.selectedSubjectIds.delete(subject.subjectId);
      this.selectedSubjectDetails.delete(subject.subjectId);
    } else {
      this.selectedSubjectIds.add(subject.subjectId);
      this.selectedSubjectDetails.set(subject.subjectId, subject);
    }
    this.cdr.markForCheck();
  }

  removeSelected(subjectId: number): void {
    this.selectedSubjectIds.delete(subjectId);
    this.selectedSubjectDetails.delete(subjectId);
    this.cdr.markForCheck();
  }

  isSelected(subjectId: number): boolean {
    return this.selectedSubjectIds.has(subjectId);
  }

  buildMenu(group: SubjectChoiceGroup): void {
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
  }

  save(): void {
    if (this.saving) return;
    this.submitted = true;
    const name = this.groupName.trim().replace(/\s+/g, ' ');
    if (!name || name.length > 100 || !this.formSubjectType || this.selectedSubjectIds.size < 2) {
      this.cdr.markForCheck();
      return;
    }
    this.saving = true;
    this.subjectPanel?.hide();
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
        this.submitted = false;
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
        next: (updated) => {
          // Reflect the new state immediately; reload keeps filters and pagination in sync.
          this.groups = this.groups.map((item) => item.subjectChoiceGroupId === group.subjectChoiceGroupId
            ? { ...item, active: updated.active }
            : item);
          this.messages.add({ severity: 'success', summary: `Choice group ${active ? 'reactivated' : 'deactivated'}` });
          this.reload();
        },
        error: (error) => this.showError(error, `Unable to ${active ? 'reactivate' : 'deactivate'} choice group`)
      })
    });
  }

  private loadSubjectOptions(): void {
    if (!this.formSubjectType) return;
    const requestId = ++this.optionRequestId;
    this.optionLoading = true;
    this.optionError = null;
    this.api.listChoiceGroupSubjectOptions({
      subjectType: this.formSubjectType,
      q: this.optionSearch.trim() || undefined,
      page: 0,
      size: 100
    }).pipe(finalize(() => {
      if (requestId !== this.optionRequestId) return;
      this.optionLoading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (page) => {
        if (requestId !== this.optionRequestId) return;
        this.subjectOptions = page.content ?? [];
        // Keep chip labels in sync without dropping selections that are outside the current search.
        for (const option of this.subjectOptions) {
          if (this.selectedSubjectIds.has(option.subjectId)) {
            this.selectedSubjectDetails.set(option.subjectId, option);
          }
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        if (requestId !== this.optionRequestId) return;
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
