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
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { AppGridTableToggleComponent, AppListViewMode, AppPaginatorComponent } from '../../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../../shared/config/ui-standards';
import { AppPageChangeEvent, clampPage, slicePage } from '../../../../../shared/utils/paged-result.util';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { ClassesSectionsApiService } from '../../../services/classes-sections-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import { ViewPreferenceService } from '../../../../services/view-preference.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import {
  ACADEMIC_STAGE_OPTIONS,
  ACADEMICS_CLASSES_RESOURCE,
  AcademicClassDto,
  AcademicStage,
  ClassesSectionsDashboard
} from '../../../models/classes-sections.model';

@Component({
  selector: 'app-classes-sections-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SaasPageHeaderComponent,
    AppGridTableToggleComponent,
    AppPaginatorComponent,
    DialogModule,
    DropdownModule,
    MenuModule,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './classes-sections.component.html',
  styleUrls: ['./classes-sections.component.scss']
})
export class ClassesSectionsPageComponent implements OnInit {
  private readonly api = inject(ClassesSectionsApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(AcademicsNavService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewPrefs = inject(ViewPreferenceService);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_CLASSES_RESOURCE;
  readonly stageOptions = [
    { label: 'All Stages', value: null },
    ...ACADEMIC_STAGE_OPTIONS
  ];
  readonly statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];
  readonly classStageOptions = ACADEMIC_STAGE_OPTIONS;

  private readonly search$ = new Subject<string>();

  loading = true;
  refreshing = false;
  saving = false;
  showBack = false;
  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  dashboard: ClassesSectionsDashboard | null = null;
  searchTerm = '';
  stageFilter: AcademicStage | null = null;
  /** Default to Active so deactivated classes stay out of the main working list. */
  activeFilter: boolean | null = true;
  viewMode: AppListViewMode = this.viewPrefs.globalDefault();
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;

  showClassDialog = false;
  editingClassId: number | null = null;
  menuItems: MenuItem[] = [];

  classForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', Validators.maxLength(50)],
    stage: ['PRIMARY' as AcademicStage, Validators.required]
  });

  get readOnly(): boolean {
    return !!this.dashboard?.yearReadOnly;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.readOnly;
  }

  get totalClasses(): number {
    return this.dashboard?.classes?.length ?? 0;
  }

  get pagedClasses(): AcademicClassDto[] {
    return slicePage(this.dashboard?.classes ?? [], this.page, this.pageSize);
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
    this.showBack = this.route.snapshot.queryParamMap.get('from') === 'overview';

    this.search$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 0;
        this.reload();
      });

    this.yearApi.search().subscribe({
      next: (years) => {
        this.years = years;
        const current = years.find((y) => y.status === 'CURRENT') ?? years[0] ?? null;
        this.selectedYearId = current?.academicYearId ?? null;
        if (this.selectedYearId) {
          this.reload();
        } else {
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: 'Unable to load academic years' });
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.nav.back(this.route);
  }

  onSearchChange(value: string): void {
    this.search$.next(value ?? '');
  }

  onFilterChange(): void {
    this.page = 0;
    this.reload();
  }

  onYearChange(): void {
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
          this.page = clampPage(this.page, Math.ceil(this.totalClasses / this.pageSize));
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to load classes',
          detail: err?.error?.message || 'Please try again'
        })
      });
  }

  openCreateClass(): void {
    this.editingClassId = null;
    this.classForm.reset({ name: '', code: '', stage: 'PRIMARY' });
    this.showClassDialog = true;
  }

  openEditClass(cls: AcademicClassDto): void {
    this.editingClassId = cls.classId;
    this.classForm.reset({ name: cls.name, code: cls.code, stage: cls.stage });
    this.showClassDialog = true;
  }

  suggestClassCode(): void {
    const name = this.classForm.value.name?.trim();
    if (!name || this.classForm.value.code) return;
    const cleaned = name.replace(/[^A-Za-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    this.classForm.patchValue({ code: `CLS-${cleaned}`.toUpperCase() });
  }

  saveClass(): void {
    if (!this.selectedYearId || this.classForm.invalid || !this.canManage) {
      this.classForm.markAllAsTouched();
      return;
    }
    const value = this.classForm.getRawValue();
    const body = {
      academicYearId: this.selectedYearId,
      name: value.name!.trim(),
      code: value.code?.trim() || undefined,
      stage: value.stage!
    };
    this.saving = true;
    const req$ = this.editingClassId
      ? this.api.updateClass(this.editingClassId, body)
      : this.api.createClass(body);

    req$.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (created) => {
        this.showClassDialog = false;
        this.messages.add({
          severity: 'success',
          summary: this.editingClassId ? 'Class updated' : 'Class created'
        });
        if (!this.editingClassId) {
          void this.router.navigate(
            ['/app/academics/classes-sections', created.classId],
            { queryParams: { offerSections: '1', from: 'classes' } }
          );
        } else {
          this.reload();
        }
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: err?.error?.message || 'Unable to save class'
      })
    });
  }

  openDetails(classId: number, tab?: 'overview' | 'sections'): void {
    void this.router.navigate(
      ['/app/academics/classes-sections', classId],
      {
        queryParams: {
          from: 'classes',
          ...(tab === 'sections' ? { offerSections: '1' } : {})
        }
      }
    );
  }

  buildMenu(cls: AcademicClassDto): void {
    const items: MenuItem[] = [
      {
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () => this.openDetails(cls.classId)
      }
    ];

    if (this.canManage) {
      items.push({
        label: 'Edit Class',
        icon: 'pi pi-pencil',
        command: () => this.openEditClass(cls)
      });

      if (cls.active) {
        items.push({
          label: 'Add Section',
          icon: 'pi pi-plus',
          command: () => this.openDetails(cls.classId, 'sections')
        });
        items.push({
          label: 'Deactivate Class',
          icon: 'pi pi-ban',
          command: () => this.toggleClassActive(cls, false)
        });
      } else {
        items.push({
          label: 'Reactivate Class',
          icon: 'pi pi-check',
          command: () => this.toggleClassActive(cls, true)
        });
      }
    }

    this.menuItems = items;
  }

  toggleClassActive(cls: AcademicClassDto, activate: boolean): void {
    this.confirm.confirm({
      header: activate ? `Activate ${cls.name}?` : `Deactivate ${cls.name}?`,
      message: activate
        ? `${cls.name} will become active again.`
        : `${cls.name} will be marked inactive.`,
      acceptLabel: activate ? 'Activate' : 'Deactivate',
      acceptButtonStyleClass: activate ? undefined : 'p-button-danger',
      accept: () => {
        const req$ = activate
          ? this.api.activateClass(cls.classId)
          : this.api.deactivateClass(cls.classId);
        req$.subscribe({
          next: () => {
            this.messages.add({
              severity: 'success',
              summary: activate ? 'Class activated' : 'Class deactivated'
            });
            this.reload();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Action failed',
            detail: err?.error?.message || 'Unable to update class'
          })
        });
      }
    });
  }

  stageLabel(stage: AcademicStage): string {
    return ACADEMIC_STAGE_OPTIONS.find((s) => s.value === stage)?.label || stage;
  }
}
