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
import { AcademicGroupsApiService } from '../../../services/academic-groups-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import {
  ACADEMIC_STAGE_OPTIONS,
  ACADEMICS_ACADEMIC_GROUPS_RESOURCE,
  AcademicGroupCreateRequest,
  AcademicGroupDto,
  AcademicGroupSummary,
  AcademicStage,
  AcademicSectionDto
} from '../../../models/academic-groups.model';
import { academicsApi } from '../../../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../../../shared/models/auth.model';
import { BreadCrumbService } from '../../../../../core/services/bread-crumb.service';

import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-academic-group-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TcPageSkeletonComponent,
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
  templateUrl: './academic-group-detail.component.html',
  styleUrls: ['./academic-group-detail.component.scss']
})
export class AcademicGroupDetailPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(AcademicGroupsApiService);
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

  readonly resource = ACADEMICS_ACADEMIC_GROUPS_RESOURCE;
  readonly classificationOptions = ACADEMIC_STAGE_OPTIONS;

  loading = true;
  loadError = false;
  saving = false;
  cls: AcademicGroupDto | null = null;
  academicGroupId: number | null = null;
  summary: AcademicGroupSummary | null = null;
  summaryError = false;
  groupMenuItems: MenuItem[] = [];
  formError: string | null = null;
  private wantsAddSection = false;
  showAcademicGroupDialog = false;
  showSectionDialog = false;
  editingSectionId: number | null = null;
  editingSectionActive = true;
  staffOptions: { label: string; value: number }[] = [];
  menuItems: MenuItem[] = [];

  academicGroupForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', Validators.maxLength(50)],
    stage: [null as AcademicStage | null],
    description: ['', Validators.maxLength(500)]
  });

  sectionForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    code: ['', Validators.maxLength(50)],
    capacity: [null as number | null, Validators.min(1)],
    sectionTeacherStaffId: [null as number | null]
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
      const id = Number(params.get('academicGroupId'));
      if (id) {
        this.academicGroupId = id;
        this.load(id);
      }
    });
    this.route.queryParamMap.subscribe((q) => {
      this.wantsAddSection = q.get('addSection') === '1';
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  back(): void {
    this.nav.back(this.route, ['/app/academics/academic-groups']);
  }

  retry(): void {
    if (this.academicGroupId) this.load(this.academicGroupId);
  }

  load(academicGroupId: number): void {
    this.loading = true;
    this.loadError = false;
    this.summaryError = false;
    this.api.getAcademicGroup(academicGroupId).pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (cls) => {
        this.cls = cls;
        this.pageHeader.setPageSubtitle(cls.academicYearName || null);
        this.loadSummary(cls.academicGroupId);
        if (this.wantsAddSection && this.canManage) {
          this.wantsAddSection = false;
          this.openAddSection();
        }
      },
      error: () => {
        this.cls = null;
        this.loadError = true;
      }
    });
  }

  private loadSummary(academicGroupId: number): void {
    this.api.getGroupSummary(academicGroupId).subscribe({
      next: (summary) => {
        this.summary = summary;
        this.cdr.markForCheck();
      },
      error: () => {
        this.summary = null;
        this.summaryError = true;
        this.cdr.markForCheck();
      }
    });
  }

  buildGroupMenu(): void {
    if (!this.cls) return;
    const items: MenuItem[] = [];
    if (this.canManage) {
      items.push({ label: 'Edit Academic Group', icon: 'pi pi-pencil', command: () => this.openEditAcademicGroup() });
      items.push(this.cls.active
        ? { label: 'Deactivate Group', icon: 'pi pi-ban', command: () => this.confirmToggleGroup(false) }
        : { label: 'Reactivate Group', icon: 'pi pi-check', command: () => this.confirmToggleGroup(true) });
    }
    this.groupMenuItems = items;
  }

  confirmToggleGroup(activate: boolean): void {
    if (!this.cls || !this.canManage) return;
    const group = this.cls;
    this.confirm.confirm({
      header: activate ? `Reactivate ${group.name}?` : `Deactivate ${group.name}?`,
      message: activate
        ? 'This group will become active again.'
        : 'Students are never moved by this action. Deactivation is blocked while students are enrolled.',
      acceptLabel: activate ? 'Reactivate' : 'Deactivate',
      acceptButtonStyleClass: activate ? undefined : 'p-button-danger',
      accept: () => {
        const req$ = activate
          ? this.api.activateAcademicGroup(group.academicGroupId)
          : this.api.deactivateAcademicGroup(group.academicGroupId);
        req$.subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: activate ? 'Academic Group reactivated' : 'Academic Group deactivated' });
            this.load(group.academicGroupId);
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Action blocked',
            detail: err?.error?.message || 'Unable to update the Academic Group.'
          })
        });
      }
    });
  }

  sectionDisplayName(section: AcademicSectionDto): string {
    const name = (section.name || '').trim();
    if (!name) return 'Section';
    return /^section\b/i.test(name) ? name : `Section ${name}`;
  }

  openEditAcademicGroup(): void {
    if (!this.cls) return;
    this.academicGroupForm.reset({
      name: this.cls.name,
      code: this.cls.code,
      stage: this.cls.stage ?? null,
      description: this.cls.description ?? ''
    });
    this.formError = null;
    this.showAcademicGroupDialog = true;
  }

  saveAcademicGroup(): void {
    if (!this.cls || this.academicGroupForm.invalid || !this.canManage) {
      this.academicGroupForm.markAllAsTouched();
      return;
    }
    const value = this.academicGroupForm.getRawValue();
    const body: AcademicGroupCreateRequest = {
      academicYearId: this.cls.academicYearId,
      name: value.name!.trim(),
      code: value.code?.trim() || undefined,
      stage: value.stage ?? null,
      description: value.description?.trim() || undefined
    };
    this.saving = true;
    this.formError = null;
    this.api.updateAcademicGroup(this.cls.academicGroupId, body).pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showAcademicGroupDialog = false;
        this.messages.add({ severity: 'success', summary: 'Academic Group updated' });
        this.load(this.cls!.academicGroupId);
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Unable to save the Academic Group.';
        this.cdr.markForCheck();
      }
    });
  }

  openAddSection(): void {
    this.editingSectionId = null;
    this.editingSectionActive = true;
    this.sectionForm.reset({ name: '', code: '', capacity: null, sectionTeacherStaffId: null });
    this.showSectionDialog = true;
  }

  openEditSection(section: AcademicSectionDto): void {
    this.editingSectionId = section.sectionId;
    this.editingSectionActive = section.active;
    this.sectionForm.reset({
      name: section.name,
      code: section.code,
      capacity: section.capacity ?? null,
      sectionTeacherStaffId: section.sectionTeacherStaffId ?? null
    });
    this.showSectionDialog = true;
  }

  openAssignTeacher(section: AcademicSectionDto): void {
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
      capacity: value.capacity ?? undefined,
      sectionTeacherStaffId: value.sectionTeacherStaffId
    };
    this.saving = true;
    const req$ = this.editingSectionId
      ? this.api.updateSection(this.editingSectionId, body)
      : this.api.createSection(this.cls.academicGroupId, body);

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
        this.load(this.cls!.academicGroupId);
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: err?.error?.message || 'Unable to save section'
      })
    });
  }

  buildSectionMenu(section: AcademicSectionDto): void {
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
        label: section.sectionTeacherStaffId ? 'Change Section Teacher' : 'Assign Section Teacher',
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

  confirmToggleSection(section: AcademicSectionDto, activate: boolean): void {
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

  toggleSectionActive(section: AcademicSectionDto, activate: boolean): void {
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
        this.load(this.cls!.academicGroupId);
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Action failed',
        detail: err?.error?.message || 'Unable to update section'
      })
    });
  }

  viewStudents(section?: AcademicSectionDto): void {
    if (!this.cls) return;
    const queryParams: Record<string, string | number> = {
      academicYearId: this.cls.academicYearId,
      academicGroupId: this.cls.academicGroupId
    };
    if (section) queryParams['sectionId'] = section.sectionId;
    void this.router.navigate(['/app/students/directory'], { queryParams });
  }

  stageLabel(stage: AcademicStage | null | undefined): string {
    if (!stage) return '';
    return ACADEMIC_STAGE_OPTIONS.find((s) => s.value === stage)?.label || stage;
  }

  get timetableLabel(): string {
    switch (this.summary?.timetableStatus) {
      case 'PUBLISHED': return 'Published';
      case 'DRAFT': return 'Draft';
      case 'NOT_GENERATED': return 'Not generated';
      default: return '—';
    }
  }

  focusSections(): void {
    document.getElementById('cd-sections')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
