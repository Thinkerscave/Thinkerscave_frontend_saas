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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import {
  ACADEMICS_SUBJECTS_RESOURCE,
  SUBJECT_CATEGORY_OPTIONS,
  SubjectCategory,
  SubjectDto,
  SubjectsMappingDashboard,
  TIMETABLE_PREFERENCE_OPTIONS,
  SubjectTimetablePreference
} from '../../../models/subjects-mapping.model';

@Component({
  selector: 'app-subjects-mapping-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SaasPageHeaderComponent,
    DialogModule,
    DropdownModule,
    MenuModule,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './subjects-mapping.component.html',
  styleUrls: ['./subjects-mapping.component.scss']
})
export class SubjectsMappingPageComponent implements OnInit {
  private readonly api = inject(SubjectsMappingApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(AcademicsNavService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_SUBJECTS_RESOURCE;
  readonly categoryOptions = [
    { label: 'All Categories', value: null },
    ...SUBJECT_CATEGORY_OPTIONS
  ];
  readonly statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];
  readonly subjectCategoryOptions = SUBJECT_CATEGORY_OPTIONS;
  readonly preferenceOptions = TIMETABLE_PREFERENCE_OPTIONS;

  private readonly search$ = new Subject<string>();

  loading = true;
  refreshing = false;
  saving = false;
  showBack = false;
  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  dashboard: SubjectsMappingDashboard | null = null;
  searchTerm = '';
  categoryFilter: SubjectCategory | null = null;
  /** Default Active so deactivated subjects stay out of the main working list. */
  activeFilter: boolean | null = true;
  viewMode: 'grid' | 'list' = 'grid';
  page = 1;
  pageSize = 12;

  showSubjectDialog = false;
  editingSubjectId: number | null = null;
  menuItems: MenuItem[] = [];

  subjectForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    code: ['', Validators.maxLength(50)],
    category: ['CORE' as SubjectCategory, Validators.required],
    defaultWeeklyPeriods: [5 as number, [Validators.required, Validators.min(1)]],
    timetablePreference: ['ANY' as SubjectTimetablePreference, Validators.required],
    description: ['']
  });

  get readOnly(): boolean {
    return !!this.dashboard?.yearReadOnly;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.readOnly;
  }

  get totalSubjects(): number {
    return this.dashboard?.subjects?.length ?? 0;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalSubjects / this.pageSize));
  }

  get pageStart(): number {
    if (!this.totalSubjects) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalSubjects);
  }

  get pagedSubjects(): SubjectDto[] {
    const all = this.dashboard?.subjects ?? [];
    const start = (this.page - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.categoryFilter != null || this.activeFilter !== null;
  }

  get hasVisibleFilters(): boolean {
    return this.hasActiveFilters;
  }

  get isFilterEmptyState(): boolean {
    return !!this.searchTerm.trim() || this.categoryFilter != null || this.activeFilter !== true;
  }

  get showDeactivatedHint(): boolean {
    return this.activeFilter === true && !this.searchTerm.trim() && this.categoryFilter == null;
  }

  ngOnInit(): void {
    const from = this.route.snapshot.queryParamMap.get('from');
    this.showBack = from === 'overview';

    // Legacy deep-link from Class Detail: send users to the class-scoped mapping page.
    const classId = Number(this.route.snapshot.queryParamMap.get('classId'));
    if (classId) {
      void this.router.navigate(
        ['/app/academics/classes-sections', classId, 'subjects'],
        { queryParams: { from: from || 'classes' }, replaceUrl: true }
      );
      return;
    }

    this.search$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
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
    this.page = 1;
    this.reload();
  }

  onYearChange(): void {
    this.page = 1;
    this.reload();
  }

  setPage(next: number): void {
    this.page = Math.min(Math.max(1, next), this.totalPages);
    this.cdr.markForCheck();
  }

  setPageSize(size: number): void {
    this.pageSize = Number(size) || 12;
    this.page = 1;
    this.cdr.markForCheck();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.page = 1;
    this.reload();
  }

  clearCategory(): void {
    this.categoryFilter = null;
    this.page = 1;
    this.reload();
  }

  clearStatus(): void {
    this.activeFilter = null;
    this.page = 1;
    this.reload();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = null;
    this.activeFilter = true;
    this.page = 1;
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
        category: this.categoryFilter,
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
          if (this.page > this.totalPages) {
            this.page = this.totalPages;
          }
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to load subjects',
          detail: err?.error?.message || 'Please try again'
        })
      });
  }

  openCreateSubject(): void {
    this.editingSubjectId = null;
    this.subjectForm.reset({
      name: '',
      code: '',
      category: 'CORE',
      defaultWeeklyPeriods: 5,
      timetablePreference: 'ANY',
      description: ''
    });
    this.showSubjectDialog = true;
  }

  openEditSubject(subject: SubjectDto): void {
    this.editingSubjectId = subject.subjectId;
    this.subjectForm.reset({
      name: subject.name,
      code: subject.code,
      category: subject.category,
      defaultWeeklyPeriods: subject.defaultWeeklyPeriods,
      timetablePreference: subject.timetablePreference,
      description: subject.description || ''
    });
    this.showSubjectDialog = true;
  }

  suggestCode(): void {
    const name = this.subjectForm.value.name?.trim();
    if (!name || this.subjectForm.value.code) return;
    const letters = name.replace(/[^A-Za-z]/g, '').toUpperCase();
    this.subjectForm.patchValue({ code: letters.slice(0, 3) || 'SUB' });
  }

  onCategoryChange(): void {
    const category = this.subjectForm.value.category;
    if (category === 'CORE' || category === 'LANGUAGE') {
      this.subjectForm.patchValue({
        defaultWeeklyPeriods: this.subjectForm.value.defaultWeeklyPeriods || 5,
        timetablePreference: 'FIRST_HALF'
      });
    } else if (category === 'ACTIVITY' || category === 'LAB' || category === 'PRACTICAL') {
      this.subjectForm.patchValue({
        defaultWeeklyPeriods: this.subjectForm.value.defaultWeeklyPeriods || 2,
        timetablePreference: 'SECOND_HALF'
      });
    }
  }

  saveSubject(): void {
    if (!this.selectedYearId || this.subjectForm.invalid || !this.canManage) {
      this.subjectForm.markAllAsTouched();
      return;
    }
    const value = this.subjectForm.getRawValue();
    const body = {
      academicYearId: this.selectedYearId,
      name: value.name!.trim(),
      code: value.code?.trim() || undefined,
      category: value.category!,
      defaultWeeklyPeriods: Number(value.defaultWeeklyPeriods),
      timetablePreference: value.timetablePreference!,
      description: value.description?.trim() || undefined
    };
    this.saving = true;
    const req$ = this.editingSubjectId
      ? this.api.update(this.editingSubjectId, body)
      : this.api.create(body);

    req$.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (created) => {
        this.showSubjectDialog = false;
        this.messages.add({
          severity: 'success',
          summary: this.editingSubjectId ? 'Subject updated' : 'Subject created'
        });
        if (!this.editingSubjectId) {
          void this.router.navigate(
            ['/app/academics/subjects-mapping', created.subjectId],
            { queryParams: { offerMap: '1', from: 'subjects' } }
          );
        } else {
          this.reload();
        }
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: err?.error?.message || 'Unable to save subject'
      })
    });
  }

  openDetails(subjectId: number, offerMap = false): void {
    void this.router.navigate(
      ['/app/academics/subjects-mapping', subjectId],
      {
        queryParams: {
          from: 'subjects',
          ...(offerMap ? { offerMap: '1' } : {})
        }
      }
    );
  }

  buildMenu(subject: SubjectDto): void {
    const items: MenuItem[] = [
      {
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () => this.openDetails(subject.subjectId)
      }
    ];

    if (this.canManage) {
      items.push({
        label: 'Edit Subject',
        icon: 'pi pi-pencil',
        command: () => this.openEditSubject(subject)
      });

      if (subject.active) {
        items.push({
          label: 'Map to Class',
          icon: 'pi pi-link',
          command: () => this.openDetails(subject.subjectId, true)
        });
        items.push({
          label: 'Deactivate Subject',
          icon: 'pi pi-ban',
          command: () => this.toggleSubjectActive(subject, false)
        });
      } else {
        items.push({
          label: 'Reactivate Subject',
          icon: 'pi pi-check',
          command: () => this.toggleSubjectActive(subject, true)
        });
      }
    }

    this.menuItems = items;
  }

  toggleSubjectActive(subject: SubjectDto, activate: boolean): void {
    if (!this.canManage) return;
    this.confirm.confirm({
      header: activate ? `Activate ${subject.name}?` : `Deactivate ${subject.name}?`,
      message: activate
        ? `${subject.name} will become active again.`
        : `${subject.name} will be marked inactive.`,
      acceptLabel: activate ? 'Activate' : 'Deactivate',
      acceptButtonStyleClass: activate ? undefined : 'p-button-danger',
      accept: () => {
        const req$ = activate
          ? this.api.activate(subject.subjectId)
          : this.api.deactivate(subject.subjectId);
        req$.subscribe({
          next: () => {
            this.messages.add({
              severity: 'success',
              summary: activate ? 'Subject activated' : 'Subject deactivated'
            });
            this.reload();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Action failed',
            detail: err?.error?.message || 'Unable to update subject'
          })
        });
      }
    });
  }

  categoryLabel(category: SubjectCategory): string {
    return SUBJECT_CATEGORY_OPTIONS.find((c) => c.value === category)?.label || category;
  }

  categoryTone(category: SubjectCategory): string {
    switch (category) {
      case 'LANGUAGE': return 'language';
      case 'CORE': return 'core';
      case 'PRACTICAL':
      case 'LAB': return 'practical';
      case 'ACTIVITY': return 'activity';
      default: return 'default';
    }
  }
}
