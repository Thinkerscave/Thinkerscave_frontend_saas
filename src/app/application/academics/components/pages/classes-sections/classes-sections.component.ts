import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { ClassesSectionsApiService } from '../../../services/classes-sections-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
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
  showBack = false;
  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  dashboard: ClassesSectionsDashboard | null = null;
  searchTerm = '';
  stageFilter: AcademicStage | null = null;
  activeFilter: boolean | null = null;
  viewMode: 'grid' | 'list' = 'grid';

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

  ngOnInit(): void {
    this.showBack = this.route.snapshot.queryParamMap.get('from') === 'overview';
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
          void this.router.navigate(
            ['/app/academics/classes-sections', created.classId],
            { queryParams: { offerSections: '1', tab: 'sections', from: 'classes' } }
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
      { queryParams: tab ? { tab, from: 'classes' } : { from: 'classes' } }
    );
  }

  buildMenu(cls: AcademicClassDto): void {
    const items: MenuItem[] = [
      { label: 'Open', icon: 'pi pi-eye', command: () => this.openDetails(cls.classId) }
    ];
    if (this.canManage) {
      items.push({ label: 'Edit Class', icon: 'pi pi-pencil', command: () => this.openEditClass(cls) });
      items.push({
        label: 'Manage Sections',
        icon: 'pi pi-th-large',
        command: () => this.openDetails(cls.classId, 'sections')
      });
    }
    items.push({
      label: 'View Students',
      icon: 'pi pi-users',
      command: () => this.viewStudents(cls)
    });
    items.push({
      label: 'Subject Mapping',
      icon: 'pi pi-book',
      command: () => this.router.navigate(['/app/academics/subjects-mapping'], {
        queryParams: { from: 'classes', classId: cls.classId }
      })
    });
    items.push({
      label: 'Timetable',
      icon: 'pi pi-calendar',
      command: () => this.router.navigate(['/app/academics/timetable'], { queryParams: { from: 'classes' } })
    });
    if (this.canManage) {
      items.push({
        label: cls.active ? 'Deactivate' : 'Activate',
        icon: cls.active ? 'pi pi-ban' : 'pi pi-check',
        command: () => this.toggleClassActive(cls, !cls.active)
      });
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

  viewStudents(cls: AcademicClassDto): void {
    void this.router.navigate(['/app/students/directory'], {
      queryParams: {
        academicYearId: cls.academicYearId,
        classId: cls.classId
      }
    });
  }

  stageLabel(stage: AcademicStage): string {
    return ACADEMIC_STAGE_OPTIONS.find((s) => s.value === stage)?.label || stage;
  }
}
