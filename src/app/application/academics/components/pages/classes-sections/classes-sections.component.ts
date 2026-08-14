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
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { ClassesSectionsApiService } from '../../../services/classes-sections-api.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import {
  ACADEMIC_STAGE_OPTIONS,
  ACADEMICS_CLASSES_RESOURCE,
  AcademicClassDto,
  AcademicStage,
  ClassSectionDto,
  ClassesSectionsDashboard
} from '../../../models/classes-sections.model';
import { academicsApi } from '../../../../../shared/constants/api.endpoint';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../../../../shared/models/auth.model';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-classes-sections-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    DialogModule,
    DropdownModule,
    MenuModule,
    ToastModule,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './classes-sections.component.html',
  styleUrls: ['./classes-sections.component.scss']
})
export class ClassesSectionsPageComponent implements OnInit {
  private readonly api = inject(ClassesSectionsApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
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

  loading = true;
  saving = false;
  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  dashboard: ClassesSectionsDashboard | null = null;
  searchTerm = '';
  stageFilter: AcademicStage | null = null;
  activeFilter: boolean | null = null;
  viewMode: 'grid' | 'list' = 'grid';

  showClassDialog = false;
  showSectionDialog = false;
  showDetails = false;
  editingClassId: number | null = null;
  editingSectionId: number | null = null;
  detailsClass: AcademicClassDto | null = null;
  detailsTab: 'overview' | 'sections' = 'overview';
  promptAddSectionsAfterCreate = false;
  menuItems: MenuItem[] = [];
  staffOptions: { label: string; value: number }[] = [];

  classForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', Validators.maxLength(50)],
    stage: ['PRIMARY' as AcademicStage, Validators.required]
  });

  sectionForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    code: ['', Validators.maxLength(50)],
    capacity: [40 as number | null],
    classTeacherStaffId: [null as number | null]
  });

  get readOnly(): boolean {
    return !!this.dashboard?.yearReadOnly;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.readOnly;
  }

  ngOnInit(): void {
    this.loadStaff();
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
        stage: this.stageFilter,
        active: this.activeFilter
      })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (dash) => {
          this.dashboard = dash;
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to load classes',
          detail: err?.error?.message || 'Please try again'
        })
      });
  }

  onYearChange(): void {
    this.reload();
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
          this.promptAddSectionsAfterCreate = true;
          this.openDetails(created.classId, true);
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

  openAddSection(cls: AcademicClassDto): void {
    this.editingSectionId = null;
    this.detailsClass = cls;
    this.sectionForm.reset({ name: '', code: '', capacity: 40, classTeacherStaffId: null });
    this.showSectionDialog = true;
  }

  openEditSection(section: ClassSectionDto): void {
    this.editingSectionId = section.sectionId;
    this.sectionForm.reset({
      name: section.name,
      code: section.code,
      capacity: section.capacity ?? null,
      classTeacherStaffId: section.classTeacherStaffId ?? null
    });
    this.showSectionDialog = true;
  }

  suggestSectionCode(): void {
    const name = this.sectionForm.value.name?.trim();
    if (!name || this.sectionForm.value.code || !this.detailsClass) return;
    this.sectionForm.patchValue({
      code: `${this.detailsClass.code}-${name}`.toUpperCase().replace(/\s+/g, '')
    });
  }

  saveSection(): void {
    if (!this.detailsClass || this.sectionForm.invalid || !this.canManage) {
      this.sectionForm.markAllAsTouched();
      return;
    }
    const value = this.sectionForm.getRawValue();
    const body = {
      name: value.name!.trim(),
      code: value.code?.trim() || undefined,
      capacity: value.capacity,
      classTeacherStaffId: value.classTeacherStaffId
    };
    this.saving = true;
    const req$ = this.editingSectionId
      ? this.api.updateSection(this.editingSectionId, body)
      : this.api.createSection(this.detailsClass.classId, body);

    req$.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showSectionDialog = false;
        this.promptAddSectionsAfterCreate = false;
        this.messages.add({
          severity: 'success',
          summary: this.editingSectionId ? 'Section updated' : 'Section created'
        });
        this.openDetails(this.detailsClass!.classId);
        this.reload();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: err?.error?.message || 'Unable to save section'
      })
    });
  }

  openDetails(classId: number, offerSections = false): void {
    this.api.getClass(classId).subscribe({
      next: (cls) => {
        this.detailsClass = cls;
        this.detailsTab = 'overview';
        this.showDetails = true;
        this.promptAddSectionsAfterCreate = offerSections;
        this.cdr.markForCheck();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Unable to load class',
        detail: err?.error?.message || 'Please try again'
      })
    });
  }

  buildMenu(cls: AcademicClassDto): void {
    const items: MenuItem[] = [
      { label: 'View Details', icon: 'pi pi-eye', command: () => this.openDetails(cls.classId) }
    ];
    if (this.canManage) {
      items.push({ label: 'Edit Class', icon: 'pi pi-pencil', command: () => this.openEditClass(cls) });
      items.push({ label: 'Manage Sections', icon: 'pi pi-th-large', command: () => {
        this.openDetails(cls.classId);
        this.detailsTab = 'sections';
      }});
    }
    items.push({
      label: 'View Students',
      icon: 'pi pi-users',
      command: () => this.viewStudents(cls)
    });
    items.push({
      label: 'View Subject Mapping',
      icon: 'pi pi-book',
      command: () => this.messages.add({
        severity: 'info',
        summary: 'Coming soon',
        detail: 'Subjects & Mapping is the next Academics slice'
      })
    });
    items.push({
      label: 'View Timetable',
      icon: 'pi pi-calendar',
      command: () => this.router.navigate(['/app/academics/timetable'])
    });
    if (this.canManage) {
      if (cls.active) {
        items.push({
          label: 'Deactivate',
          icon: 'pi pi-ban',
          command: () => this.toggleClassActive(cls, false)
        });
      } else {
        items.push({
          label: 'Activate',
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
        : `${cls.name} will be marked inactive (is_active = false).`,
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

  toggleSectionActive(section: ClassSectionDto, activate: boolean): void {
    if (!this.canManage) return;
    const req$ = activate
      ? this.api.activateSection(section.sectionId)
      : this.api.deactivateSection(section.sectionId);
    req$.subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: activate ? 'Section activated' : 'Section deactivated'
        });
        if (this.detailsClass) this.openDetails(this.detailsClass.classId);
        this.reload();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Action failed',
        detail: err?.error?.message || 'Unable to update section'
      })
    });
  }

  viewStudents(cls: AcademicClassDto, section?: ClassSectionDto): void {
    const queryParams: Record<string, string | number> = {
      academicYearId: cls.academicYearId,
      classId: cls.classId
    };
    if (section) queryParams['sectionId'] = section.sectionId;
    this.router.navigate(['/app/students/directory'], { queryParams });
  }

  stageLabel(stage: AcademicStage): string {
    return ACADEMIC_STAGE_OPTIONS.find((s) => s.value === stage)?.label || stage;
  }

  private loadStaff(): void {
    this.http
      .get<ApiResponse<any[] | { content?: any[] }>>(academicsApi.staffAll)
      .pipe(map((res) => {
        const data = res.data as any;
        return Array.isArray(data) ? data : (data?.content ?? []);
      }))
      .subscribe({
        next: (staff) => {
          this.staffOptions = staff.map((s: any) => ({
            value: Number(s.staffId ?? s.id),
            label: [s.firstName, s.lastName].filter(Boolean).join(' ')
              || s.staffName
              || s.fullName
              || `Staff ${s.staffId ?? s.id}`
          })).filter((s: { value: number }) => !!s.value);
          this.cdr.markForCheck();
        },
        error: () => {
          this.staffOptions = [];
        }
      });
  }
}
