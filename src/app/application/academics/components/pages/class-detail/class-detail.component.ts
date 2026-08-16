import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize, map } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { ClassesSectionsApiService } from '../../../services/classes-sections-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import {
  ACADEMIC_STAGE_OPTIONS,
  ACADEMICS_CLASSES_RESOURCE,
  AcademicClassDto,
  AcademicStage,
  ClassSectionDto
} from '../../../models/classes-sections.model';
import { academicsApi } from '../../../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../../../shared/models/auth.model';
import { BreadCrumbService } from '../../../../../core/services/bread-crumb.service';

@Component({
  selector: 'app-class-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    SaasPageHeaderComponent,
    DialogModule,
    DropdownModule,
    MenuModule,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './class-detail.component.html',
  styleUrls: ['./class-detail.component.scss']
})
export class ClassDetailPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(ClassesSectionsApiService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly nav = inject(AcademicsNavService);
  private readonly pageHeader = inject(BreadCrumbService);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_CLASSES_RESOURCE;
  readonly classStageOptions = ACADEMIC_STAGE_OPTIONS;

  loading = true;
  loadError = false;
  saving = false;
  cls: AcademicClassDto | null = null;
  private classId: number | null = null;
  offerSections = false;
  showClassDialog = false;
  showSectionDialog = false;
  editingSectionId: number | null = null;
  staffOptions: { label: string; value: number }[] = [];
  menuItems: MenuItem[] = [];

  classForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', Validators.maxLength(50)],
    stage: ['PRIMARY' as AcademicStage, Validators.required]
  });

  sectionForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    code: ['', Validators.maxLength(50)],
    classTeacherStaffId: [null as number | null]
  });

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.cls?.yearReadOnly;
  }

  get sectionCount(): number {
    return this.cls?.sectionCount ?? this.cls?.sections?.length ?? 0;
  }

  get studentCount(): number {
    return this.cls?.studentCount ?? 0;
  }

  ngOnInit(): void {
    this.loadStaff();
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('classId'));
      if (id) {
        this.classId = id;
        this.load(id);
      }
    });
    this.route.queryParamMap.subscribe((q) => {
      this.offerSections = q.get('offerSections') === '1';
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  back(): void {
    this.nav.back(this.route, ['/app/academics/classes-sections']);
  }

  retry(): void {
    if (this.classId) this.load(this.classId);
  }

  dismissOffer(): void {
    this.offerSections = false;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { offerSections: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  load(classId: number): void {
    this.loading = true;
    this.loadError = false;
    this.api.getClass(classId).pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (cls) => {
        this.cls = cls;
        this.pageHeader.setPageHeader({
          title: cls.name,
          subtitle: cls.academicYearName || 'Class details'
        });
      },
      error: () => {
        this.cls = null;
        this.loadError = true;
      }
    });
  }

  sectionDisplayName(section: ClassSectionDto): string {
    const name = (section.name || '').trim();
    if (!name) return 'Section';
    return /^section\b/i.test(name) ? name : `Section ${name}`;
  }

  openEditClass(): void {
    if (!this.cls) return;
    this.classForm.reset({ name: this.cls.name, code: this.cls.code, stage: this.cls.stage });
    this.showClassDialog = true;
  }

  saveClass(): void {
    if (!this.cls || this.classForm.invalid || !this.canManage) {
      this.classForm.markAllAsTouched();
      return;
    }
    const value = this.classForm.getRawValue();
    this.saving = true;
    this.api.updateClass(this.cls.classId, {
      academicYearId: this.cls.academicYearId,
      name: value.name!.trim(),
      code: value.code?.trim() || undefined,
      stage: value.stage!
    }).pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showClassDialog = false;
        this.messages.add({ severity: 'success', summary: 'Class updated' });
        this.load(this.cls!.classId);
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: err?.error?.message || 'Unable to save class'
      })
    });
  }

  openAddSection(): void {
    this.editingSectionId = null;
    this.sectionForm.reset({ name: '', code: '', classTeacherStaffId: null });
    this.showSectionDialog = true;
    this.offerSections = false;
  }

  openEditSection(section: ClassSectionDto): void {
    this.editingSectionId = section.sectionId;
    this.sectionForm.reset({
      name: section.name,
      code: section.code,
      classTeacherStaffId: section.classTeacherStaffId ?? null
    });
    this.showSectionDialog = true;
  }

  openAssignTeacher(section: ClassSectionDto): void {
    if (!this.canManage) return;
    this.openEditSection(section);
  }

  suggestSectionCode(): void {
    const name = this.sectionForm.value.name?.trim();
    if (!name || this.sectionForm.value.code || !this.cls) return;
    this.sectionForm.patchValue({
      code: `${this.cls.code}-${name}`.toUpperCase().replace(/\s+/g, '')
    });
  }

  saveSection(): void {
    if (!this.cls || this.sectionForm.invalid || !this.canManage) {
      this.sectionForm.markAllAsTouched();
      return;
    }
    const value = this.sectionForm.getRawValue();
    const body = {
      name: value.name!.trim(),
      code: value.code?.trim() || undefined,
      classTeacherStaffId: value.classTeacherStaffId
    };
    this.saving = true;
    const req$ = this.editingSectionId
      ? this.api.updateSection(this.editingSectionId, body)
      : this.api.createSection(this.cls.classId, body);

    req$.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showSectionDialog = false;
        this.messages.add({
          severity: 'success',
          summary: this.editingSectionId ? 'Section updated' : 'Section created'
        });
        this.load(this.cls!.classId);
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: err?.error?.message || 'Unable to save section'
      })
    });
  }

  buildMenu(section: ClassSectionDto): void {
    const items: MenuItem[] = [
      {
        label: 'View Students',
        icon: 'pi pi-users',
        command: () => this.viewStudents(section)
      }
    ];

    if (this.canManage) {
      items.push({
        label: 'Edit Section',
        icon: 'pi pi-pencil',
        command: () => this.openEditSection(section)
      });
      items.push({
        label: section.classTeacherStaffId ? 'Change Class Teacher' : 'Assign Class Teacher',
        icon: 'pi pi-user-edit',
        command: () => this.openAssignTeacher(section)
      });
      items.push({
        label: section.active ? 'Deactivate Section' : 'Reactivate Section',
        icon: section.active ? 'pi pi-ban' : 'pi pi-check',
        command: () => this.confirmToggleSection(section, !section.active)
      });
    }

    this.menuItems = items;
  }

  confirmToggleSection(section: ClassSectionDto, activate: boolean): void {
    if (!this.canManage || !this.cls) return;
    this.confirm.confirm({
      header: activate ? `Reactivate ${this.sectionDisplayName(section)}?` : `Deactivate ${this.sectionDisplayName(section)}?`,
      message: activate
        ? 'This section will become active again.'
        : 'This section will be marked inactive. Historical data is preserved.',
      acceptLabel: activate ? 'Reactivate' : 'Deactivate',
      acceptButtonStyleClass: activate ? undefined : 'p-button-danger',
      accept: () => this.toggleSectionActive(section, activate)
    });
  }

  toggleSectionActive(section: ClassSectionDto, activate: boolean): void {
    if (!this.canManage || !this.cls) return;
    const req$ = activate
      ? this.api.activateSection(section.sectionId)
      : this.api.deactivateSection(section.sectionId);
    req$.subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: activate ? 'Section reactivated' : 'Section deactivated'
        });
        this.load(this.cls!.classId);
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Action failed',
        detail: err?.error?.message || 'Unable to update section'
      })
    });
  }

  viewStudents(section?: ClassSectionDto): void {
    if (!this.cls) return;
    const queryParams: Record<string, string | number> = {
      academicYearId: this.cls.academicYearId,
      classId: this.cls.classId
    };
    if (section) queryParams['sectionId'] = section.sectionId;
    void this.router.navigate(['/app/students/directory'], { queryParams });
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
        error: () => { this.staffOptions = []; }
      });
  }
}
