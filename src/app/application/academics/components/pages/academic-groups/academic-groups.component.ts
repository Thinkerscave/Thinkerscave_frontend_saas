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
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { AppGridTableToggleComponent, AppListViewMode, AppPaginatorComponent } from '../../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../../shared/config/ui-standards';
import { AppPageChangeEvent, clampPage, slicePage } from '../../../../../shared/utils/paged-result.util';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicGroupsApiService } from '../../../services/academic-groups-api.service';
import { ViewPreferenceService } from '../../../../services/view-preference.service';
import {
  ACADEMIC_STAGE_OPTIONS,
  ACADEMICS_ACADEMIC_GROUPS_RESOURCE,
  AcademicGroupCreateRequest,
  AcademicGroupDto,
  AcademicStage,
  AcademicGroupsDashboard
} from '../../../models/academic-groups.model';

import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-academic-groups-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TcPageSkeletonComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent,
    AppGridTableToggleComponent,
    AppPaginatorComponent,
    DialogModule,
    DropdownModule,
    MenuModule,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './academic-groups.component.html',
  styleUrls: ['./academic-groups.component.scss']
})
export class AcademicGroupsPageComponent implements OnInit {
  private readonly api = inject(AcademicGroupsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewPrefs = inject(ViewPreferenceService);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_ACADEMIC_GROUPS_RESOURCE;
  readonly stageOptions = [
    { label: 'All Classifications', value: null },
    ...ACADEMIC_STAGE_OPTIONS
  ];
  readonly statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];
  readonly classificationOptions = ACADEMIC_STAGE_OPTIONS;

  private readonly search$ = new Subject<string>();

  loading = true;
  refreshing = false;
  saving = false;
  selectedYearId: number | null = null;
  dashboard: AcademicGroupsDashboard | null = null;
  searchTerm = '';
  stageFilter: AcademicStage | null = null;
  /** Default to Active so deactivated academicGroups stay out of the main working list. */
  activeFilter: boolean | null = true;
  viewMode: AppListViewMode = 'grid';
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;

  showAcademicGroupDialog = false;
  editingAcademicGroupId: number | null = null;
  formError: string | null = null;
  menuItems: MenuItem[] = [];

  groupForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', Validators.maxLength(50)],
    stage: [null as AcademicStage | null],
    description: ['', Validators.maxLength(500)],
    addSections: ['later' as 'now' | 'later'],
    sections: this.fb.array([])
  });

  get sectionRows(): FormArray {
    return this.groupForm.get('sections') as FormArray;
  }

  /** Classification filter only appears when the organization uses classifications. */
  get showClassificationFilter(): boolean {
    return this.stageFilter != null || !!this.dashboard?.academicGroups?.some((c) => !!c.stage);
  }

  get readOnly(): boolean {
    return !!this.dashboard?.yearReadOnly;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.readOnly;
  }

  get totalAcademicGroups(): number {
    return this.dashboard?.academicGroups?.length ?? 0;
  }

  get pagedAcademicGroups(): AcademicGroupDto[] {
    return slicePage(this.dashboard?.academicGroups ?? [], this.page, this.pageSize);
  }

  get pageSizeOptions(): number[] {
    return UI_PAGINATION.options;
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.stageFilter != null || this.activeFilter !== null;
  }

  get hasVisibleFilters(): boolean {
    return this.hasActiveFilters;
  }

  /** True when empty result is caused by non-default filters (not the default Active view). */
  get isFilterEmptyState(): boolean {
    return !!this.searchTerm.trim() || this.stageFilter != null || this.activeFilter !== true;
  }

  get showDeactivatedHint(): boolean {
    return this.activeFilter === true && !this.searchTerm.trim() && this.stageFilter == null;
  }

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 0;
        this.reload();
      });

  }

  onAcademicYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    this.page = 0;
    if (yearId == null) {
      this.dashboard = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.reload();
  }

  onSearchChange(value: string): void {
    this.search$.next(value ?? '');
  }

  onFilterChange(): void {
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
    this.cdr.markForCheck();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.page = 0;
    this.reload();
  }

  clearStage(): void {
    this.stageFilter = null;
    this.page = 0;
    this.reload();
  }

  clearStatus(): void {
    this.activeFilter = null;
    this.page = 0;
    this.reload();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.stageFilter = null;
    this.activeFilter = true;
    this.page = 0;
    this.reload();
  }

  reload(): void {
    if (!this.selectedYearId) return;
    const initial = !this.dashboard;
    if (initial) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }
    this.api
      .getDashboard(this.selectedYearId, {
        q: this.searchTerm.trim() || undefined,
        stage: this.stageFilter,
        active: this.activeFilter
      })
      .pipe(finalize(() => {
        this.loading = false;
        this.refreshing = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (dash) => {
          this.dashboard = dash;
          this.page = clampPage(this.page, Math.ceil(this.totalAcademicGroups / this.pageSize));
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to load Academic Groups',
          detail: err?.error?.message || 'Please try again'
        })
      });
  }

  openCreateAcademicGroup(): void {
    this.editingAcademicGroupId = null;
    this.groupForm.reset({ name: '', code: '', stage: null, description: '', addSections: 'later' });
    this.sectionRows.clear();
    this.formError = null;
    this.showAcademicGroupDialog = true;
  }

  openEditAcademicGroup(cls: AcademicGroupDto): void {
    this.editingAcademicGroupId = cls.academicGroupId;
    this.groupForm.reset({
      name: cls.name,
      code: cls.code,
      stage: cls.stage ?? null,
      description: cls.description ?? '',
      addSections: 'later'
    });
    this.sectionRows.clear();
    this.formError = null;
    this.showAcademicGroupDialog = true;
  }

  onAddSectionsChange(choice: 'now' | 'later'): void {
    this.groupForm.patchValue({ addSections: choice });
    if (choice === 'later') {
      this.sectionRows.clear();
    } else if (this.sectionRows.length === 0) {
      this.addSectionRow();
    }
    this.cdr.markForCheck();
  }

  addSectionRow(): void {
    this.sectionRows.push(this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      code: ['', Validators.maxLength(50)]
    }));
    this.cdr.markForCheck();
  }

  removeSectionRow(index: number): void {
    this.sectionRows.removeAt(index);
    this.cdr.markForCheck();
  }

  saveAcademicGroup(): void {
    if (!this.selectedYearId || this.groupForm.invalid || !this.canManage || this.saving) {
      this.groupForm.markAllAsTouched();
      return;
    }
    const value = this.groupForm.getRawValue();
    const sections = !this.editingAcademicGroupId && value.addSections === 'now'
      ? this.sectionRows.controls.map((c) => ({
        name: String(c.value.name ?? '').trim(),
        code: String(c.value.code ?? '').trim() || undefined
      }))
      : undefined;
    const body: AcademicGroupCreateRequest = {
      academicYearId: this.selectedYearId,
      name: value.name!.trim(),
      code: value.code?.trim() || undefined,
      stage: value.stage ?? null,
      description: value.description?.trim() || undefined,
      ...(sections ? { sections } : {})
    };
    this.saving = true;
    this.formError = null;
    const editingId = this.editingAcademicGroupId;
    const req$ = editingId
      ? this.api.updateAcademicGroup(editingId, body)
      : this.api.createAcademicGroup(body);

    req$.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (created) => {
        this.showAcademicGroupDialog = false;
        this.reload();
        if (editingId) {
          this.messages.add({ severity: 'success', summary: 'Academic Group updated' });
          return;
        }
        const added = sections?.length ?? 0;
        this.messages.add({
          severity: 'success',
          summary: 'Academic Group created',
          detail: added ? `${added} section${added === 1 ? '' : 's'} added.` : undefined
        });
        void this.router.navigate(['/app/academics/academic-groups', created.academicGroupId]);
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Unable to save the Academic Group. Check the details and try again.';
        this.cdr.markForCheck();
      }
    });
  }

  openDetails(academicGroupId: number, addSection = false): void {
    void this.router.navigate(
      ['/app/academics/academic-groups', academicGroupId],
      { queryParams: addSection ? { addSection: 1 } : undefined }
    );
  }

  buildAcademicGroupMenu(cls: AcademicGroupDto): void {
    const items: MenuItem[] = [
      {
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () => this.openDetails(cls.academicGroupId)
      }
    ];

    items.push({
      label: cls.active ? 'Manage Sections' : 'View Sections',
      icon: 'pi pi-th-large',
      command: () => this.openDetails(cls.academicGroupId)
    });
    items.push({
      label: 'View Students',
      icon: 'pi pi-users',
      command: () => void this.router.navigate(['/app/students/directory'], {
        queryParams: { classId: cls.academicGroupId }
      })
    });

    if (cls.active && this.permissions.canView('ACADEMICS_SUBJECTS')) {
      items.push({
        label: 'View Subject Mapping',
        icon: 'pi pi-book',
        command: () => void this.router.navigate(
          ['/app/academics/subject-mapping'],
          { queryParams: { academicYearId: cls.academicYearId, academicGroupId: cls.academicGroupId } }
        )
      });
    }
    if (cls.active && this.permissions.canView('ACADEMICS_TEACHER_ALLOCATION')) {
      items.push({
        label: 'View Teacher Allocation',
        icon: 'pi pi-user',
        command: () => void this.router.navigate(['/app/academics/teacher-allocation'], {
          queryParams: { from: 'academicGroups', academicGroupId: cls.academicGroupId }
        })
      });
    }
    if (cls.active && this.permissions.canView('ACADEMICS_TIMETABLE')) {
      items.push({
        label: 'View Timetable',
        icon: 'pi pi-calendar',
        command: () => void this.router.navigate(['/app/academics/timetable'], {
          queryParams: {
            from: 'academicGroups',
            academicYearId: cls.academicYearId,
            academicGroupId: cls.academicGroupId
          }
        })
      });
    }

    if (this.canManage) {
      items.push({
        label: 'Edit Academic Group',
        icon: 'pi pi-pencil',
        command: () => this.openEditAcademicGroup(cls)
      });

      if (cls.active) {
        items.push({
          label: 'Add Section',
          icon: 'pi pi-plus',
          command: () => this.openDetails(cls.academicGroupId, true)
        });
        items.push({
          label: 'Deactivate Group',
          icon: 'pi pi-ban',
          command: () => this.toggleAcademicGroupActive(cls, false)
        });
      } else {
        items.push({
          label: 'Reactivate Group',
          icon: 'pi pi-check',
          command: () => this.toggleAcademicGroupActive(cls, true)
        });
      }
    }

    this.menuItems = items;
  }

  toggleAcademicGroupActive(cls: AcademicGroupDto, activate: boolean): void {
    this.confirm.confirm({
      header: activate ? `Activate ${cls.name}?` : `Deactivate ${cls.name}?`,
      message: activate
        ? `${cls.name} will become active again.`
        : `${cls.name} will be marked inactive.`,
      acceptLabel: activate ? 'Activate' : 'Deactivate',
      acceptButtonStyleClass: activate ? undefined : 'p-button-danger',
      accept: () => {
        const req$ = activate
          ? this.api.activateAcademicGroup(cls.academicGroupId)
          : this.api.deactivateAcademicGroup(cls.academicGroupId);
        req$.subscribe({
          next: () => {
            this.messages.add({
              severity: 'success',
              summary: activate ? 'Academic Group activated' : 'Academic Group deactivated'
            });
            this.reload();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Action failed',
            detail: err?.error?.message || 'Unable to update Academic Group'
          })
        });
      }
    });
  }

  stageLabel(stage: AcademicStage | null | undefined): string {
    if (!stage) return '';
    return ACADEMIC_STAGE_OPTIONS.find((s) => s.value === stage)?.label || stage;
  }
}
