import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { ClassesSectionsApiService } from '../../../services/classes-sections-api.service';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import { AcademicClassDto } from '../../../models/classes-sections.model';
import {
  ACADEMICS_SUBJECTS_RESOURCE,
  ClassMappingBoard,
  ClassSubjectMappingDto,
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
    RouterLink,
    DialogModule,
    DropdownModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './subjects-mapping.component.html',
  styleUrls: ['./subjects-mapping.component.scss']
})
export class SubjectsMappingPageComponent implements OnInit {
  private readonly api = inject(SubjectsMappingApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly classesApi = inject(ClassesSectionsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
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

  loading = true;
  saving = false;
  activeTab: 'subjects' | 'mapping' = 'subjects';
  years: AcademicYearDto[] = [];
  classes: AcademicClassDto[] = [];
  selectedYearId: number | null = null;
  selectedClassId: number | null = null;
  dashboard: SubjectsMappingDashboard | null = null;
  mappingBoard: ClassMappingBoard | null = null;
  searchTerm = '';
  categoryFilter: SubjectCategory | null = null;
  activeFilter: boolean | null = null;

  showSubjectDialog = false;
  editingSubjectId: number | null = null;
  promptMapAfterCreate = false;
  createdSubjectId: number | null = null;

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

  ngOnInit(): void {
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

  reload(): void {
    if (!this.selectedYearId) return;
    this.loading = true;
    this.api
      .getDashboard(this.selectedYearId, {
        q: this.searchTerm || undefined,
        category: this.categoryFilter,
        active: this.activeFilter
      })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (dash) => {
          this.dashboard = dash;
          this.loadClasses();
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to load subjects',
          detail: err?.error?.message || 'Please try again'
        })
      });
  }

  onYearChange(): void {
    this.selectedClassId = null;
    this.mappingBoard = null;
    this.reload();
  }

  switchTab(tab: 'subjects' | 'mapping'): void {
    this.activeTab = tab;
    if (tab === 'mapping' && this.selectedClassId) {
      this.loadMappingBoard();
    }
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
          this.promptMapAfterCreate = true;
          this.createdSubjectId = created.subjectId;
        }
        this.reload();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: err?.error?.message || 'Unable to save subject'
      })
    });
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

  goToMapping(subject?: SubjectDto): void {
    this.promptMapAfterCreate = false;
    this.activeTab = 'mapping';
    if (!this.selectedClassId && this.classes.length) {
      this.selectedClassId = this.classes[0].classId;
    }
    if (this.selectedClassId) {
      this.loadMappingBoard();
    }
    if (subject) {
      this.messages.add({
        severity: 'info',
        summary: subject.name,
        detail: 'Select a class and include this subject in the mapping table'
      });
    }
  }

  loadMappingBoard(): void {
    if (!this.selectedClassId) return;
    this.api.getClassMappingBoard(this.selectedClassId).subscribe({
      next: (board) => {
        this.mappingBoard = board;
        this.cdr.markForCheck();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Unable to load class mapping',
        detail: err?.error?.message || 'Please try again'
      })
    });
  }

  onClassChange(): void {
    this.loadMappingBoard();
  }

  toggleIncluded(row: ClassSubjectMappingDto, included: boolean): void {
    if (!this.canManage || !this.selectedClassId) return;
    this.api.upsertMapping(this.selectedClassId, {
      subjectId: row.subjectId,
      included,
      weeklyPeriods: row.weeklyPeriods,
      timetablePreference: row.timetablePreference
    }).subscribe({
      next: () => {
        this.loadMappingBoard();
        this.reload();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Mapping update failed',
        detail: err?.error?.message || 'Unable to update mapping'
      })
    });
  }

  updatePeriods(row: ClassSubjectMappingDto, value: string): void {
    if (!this.canManage || !this.selectedClassId || !row.included) return;
    const periods = Number(value);
    if (!periods || periods < 1) return;
    this.api.upsertMapping(this.selectedClassId, {
      subjectId: row.subjectId,
      included: true,
      weeklyPeriods: periods,
      timetablePreference: row.timetablePreference
    }).subscribe({
      next: () => this.loadMappingBoard(),
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Update failed',
        detail: err?.error?.message || 'Unable to update periods'
      })
    });
  }

  updatePreference(row: ClassSubjectMappingDto, preference: SubjectTimetablePreference): void {
    if (!this.canManage || !this.selectedClassId || !row.included) return;
    this.api.upsertMapping(this.selectedClassId, {
      subjectId: row.subjectId,
      included: true,
      weeklyPeriods: row.weeklyPeriods,
      timetablePreference: preference
    }).subscribe({
      next: () => this.loadMappingBoard(),
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Update failed',
        detail: err?.error?.message || 'Unable to update preference'
      })
    });
  }

  goAssignTeacher(row: ClassSubjectMappingDto): void {
    this.router.navigate(['/app/academics/teacher-arrangement'], {
      queryParams: {
        academicYearId: this.selectedYearId,
        classId: this.selectedClassId,
        subjectId: row.subjectId
      }
    });
  }

  categoryLabel(category: SubjectCategory): string {
    return SUBJECT_CATEGORY_OPTIONS.find((c) => c.value === category)?.label || category;
  }

  preferenceLabel(pref: SubjectTimetablePreference): string {
    return TIMETABLE_PREFERENCE_OPTIONS.find((p) => p.value === pref)?.label || pref;
  }

  teacherStatusLabel(status: string): string {
    if (status === 'ASSIGNED') return 'Assigned';
    if (status === 'MISSING') return 'Missing';
    return '—';
  }

  private loadClasses(): void {
    if (!this.selectedYearId) return;
    this.classesApi.getDashboard(this.selectedYearId, { active: true }).subscribe({
      next: (dash) => {
        this.classes = dash.classes || [];
        if (!this.selectedClassId && this.classes.length) {
          this.selectedClassId = this.classes[0].classId;
        }
        if (this.activeTab === 'mapping' && this.selectedClassId) {
          this.loadMappingBoard();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.classes = [];
      }
    });
  }
}
