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
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { BreadCrumbService } from '../../../../../core/services/bread-crumb.service';
import { ClassesSectionsApiService } from '../../../services/classes-sections-api.service';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import { AcademicClassDto } from '../../../models/classes-sections.model';
import {
  ACADEMICS_SUBJECTS_RESOURCE,
  ClassSubjectMappingDto,
  SUBJECT_CATEGORY_OPTIONS,
  SubjectCategory,
  SubjectDto,
  TIMETABLE_PREFERENCE_OPTIONS,
  SubjectTimetablePreference
} from '../../../models/subjects-mapping.model';

@Component({
  selector: 'app-subject-detail-page',
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
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.scss']
})
export class SubjectDetailPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(SubjectsMappingApiService);
  private readonly classesApi = inject(ClassesSectionsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly nav = inject(AcademicsNavService);
  private readonly pageHeader = inject(BreadCrumbService);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_SUBJECTS_RESOURCE;
  readonly subjectCategoryOptions = SUBJECT_CATEGORY_OPTIONS;
  readonly preferenceOptions = TIMETABLE_PREFERENCE_OPTIONS;

  loading = true;
  loadError = false;
  saving = false;
  mapping = false;
  subject: SubjectDto | null = null;
  private subjectId: number | null = null;
  offerMap = false;
  showSubjectDialog = false;
  showMapDialog = false;
  classes: AcademicClassDto[] = [];
  mapClassId: number | null = null;
  menuItems: MenuItem[] = [];

  subjectForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    code: ['', Validators.maxLength(50)],
    category: ['CORE' as SubjectCategory, Validators.required],
    defaultWeeklyPeriods: [5 as number, [Validators.required, Validators.min(1)]],
    timetablePreference: ['ANY' as SubjectTimetablePreference, Validators.required],
    description: ['']
  });

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.subject?.yearReadOnly;
  }

  get mappedClasses(): ClassSubjectMappingDto[] {
    return (this.subject?.mappings || []).filter((m) => m.included);
  }

  get availableClasses(): AcademicClassDto[] {
    const mappedIds = new Set(this.mappedClasses.map((m) => m.classId));
    return this.classes.filter((c) => c.active && !mappedIds.has(c.classId));
  }

  get classOptions(): { label: string; value: number }[] {
    return this.availableClasses.map((c) => ({
      label: `${c.name}${c.code ? ` (${c.code})` : ''}`,
      value: c.classId
    }));
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('subjectId'));
      if (id) {
        this.subjectId = id;
        this.load(id);
      }
    });
    this.route.queryParamMap.subscribe((q) => {
      this.offerMap = q.get('offerMap') === '1';
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  back(): void {
    this.nav.back(this.route, ['/app/academics/subjects-mapping']);
  }

  retry(): void {
    if (this.subjectId) this.load(this.subjectId);
  }

  dismissOffer(): void {
    this.offerMap = false;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { offerMap: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  load(subjectId: number): void {
    this.loading = true;
    this.loadError = false;
    this.api.getById(subjectId).pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (subject) => {
        this.subject = subject;
        this.pageHeader.setPageHeader({
          title: subject.name,
          subtitle: subject.academicYearName || 'Subject details'
        });
        this.loadClasses(subject.academicYearId);
      },
      error: () => {
        this.subject = null;
        this.loadError = true;
      }
    });
  }

  private loadClasses(yearId: number): void {
    this.classesApi.getDashboard(yearId, { active: true }).subscribe({
      next: (dash) => {
        this.classes = dash.classes || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.classes = [];
      }
    });
  }

  categoryLabel(category: SubjectCategory): string {
    return SUBJECT_CATEGORY_OPTIONS.find((c) => c.value === category)?.label || category;
  }

  preferenceLabel(pref: SubjectTimetablePreference): string {
    return TIMETABLE_PREFERENCE_OPTIONS.find((p) => p.value === pref)?.label || pref;
  }

  openEditSubject(): void {
    if (!this.subject) return;
    this.subjectForm.reset({
      name: this.subject.name,
      code: this.subject.code,
      category: this.subject.category,
      defaultWeeklyPeriods: this.subject.defaultWeeklyPeriods,
      timetablePreference: this.subject.timetablePreference,
      description: this.subject.description || ''
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
    if (!this.subject || this.subjectForm.invalid || !this.canManage) {
      this.subjectForm.markAllAsTouched();
      return;
    }
    const value = this.subjectForm.getRawValue();
    this.saving = true;
    this.api.update(this.subject.subjectId, {
      academicYearId: this.subject.academicYearId,
      name: value.name!.trim(),
      code: value.code?.trim() || undefined,
      category: value.category!,
      defaultWeeklyPeriods: Number(value.defaultWeeklyPeriods),
      timetablePreference: value.timetablePreference!,
      description: value.description?.trim() || undefined
    }).pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showSubjectDialog = false;
        this.messages.add({ severity: 'success', summary: 'Subject updated' });
        this.load(this.subject!.subjectId);
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: err?.error?.message || 'Unable to update subject'
      })
    });
  }

  openMapDialog(): void {
    if (!this.canManage) return;
    this.mapClassId = this.classOptions[0]?.value ?? null;
    this.showMapDialog = true;
    this.offerMap = false;
  }

  mapToClass(): void {
    if (!this.subject || !this.mapClassId || !this.canManage) return;
    this.mapping = true;
    this.api.upsertMapping(this.mapClassId, {
      subjectId: this.subject.subjectId,
      included: true,
      weeklyPeriods: this.subject.defaultWeeklyPeriods,
      timetablePreference: this.subject.timetablePreference
    }).pipe(finalize(() => {
      this.mapping = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showMapDialog = false;
        this.messages.add({ severity: 'success', summary: 'Subject mapped to class' });
        this.dismissOffer();
        this.load(this.subject!.subjectId);
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Mapping failed',
        detail: err?.error?.message || 'Unable to map subject'
      })
    });
  }

  buildMenu(row: ClassSubjectMappingDto): void {
    const items: MenuItem[] = [
      {
        label: 'Open Class Mapping',
        icon: 'pi pi-external-link',
        command: () => {
          void this.router.navigate(
            ['/app/academics/classes-sections', row.classId, 'subjects'],
            { queryParams: { from: 'subjects' } }
          );
        }
      }
    ];
    if (this.canManage) {
      items.push({
        label: 'Remove Mapping',
        icon: 'pi pi-times',
        command: () => this.removeMapping(row)
      });
    }
    this.menuItems = items;
  }

  removeMapping(row: ClassSubjectMappingDto): void {
    if (!this.subject || !this.canManage) return;
    this.confirm.confirm({
      header: `Remove from ${row.className || 'class'}?`,
      message: `${this.subject.name} will no longer be taught in ${row.className || 'this class'}.`,
      acceptLabel: 'Remove',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.upsertMapping(row.classId, {
          subjectId: this.subject!.subjectId,
          included: false
        }).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Mapping removed' });
            this.load(this.subject!.subjectId);
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Remove failed',
            detail: err?.error?.message || 'Unable to remove mapping'
          })
        });
      }
    });
  }

  toggleActive(activate: boolean): void {
    if (!this.subject || !this.canManage) return;
    this.confirm.confirm({
      header: activate ? `Activate ${this.subject.name}?` : `Deactivate ${this.subject.name}?`,
      message: activate
        ? `${this.subject.name} will become active again.`
        : `${this.subject.name} will be marked inactive.`,
      acceptLabel: activate ? 'Activate' : 'Deactivate',
      acceptButtonStyleClass: activate ? undefined : 'p-button-danger',
      accept: () => {
        const req$ = activate
          ? this.api.activate(this.subject!.subjectId)
          : this.api.deactivate(this.subject!.subjectId);
        req$.subscribe({
          next: () => {
            this.messages.add({
              severity: 'success',
              summary: activate ? 'Subject activated' : 'Subject deactivated'
            });
            this.load(this.subject!.subjectId);
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
}
