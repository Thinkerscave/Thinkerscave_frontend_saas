import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { ClassesSectionsApiService } from '../../../services/classes-sections-api.service';
import { TeacherAllocationApiService } from '../../../services/teacher-allocation-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import { AcademicClassDto } from '../../../models/classes-sections.model';
import {
  ACADEMICS_TEACHER_ALLOCATION_RESOURCE,
  TeacherAllocationDashboard,
  TeacherAllocationRow,
  TeacherAllocationStatus,
  TeacherRecommendation
} from '../../../models/teacher-allocation.model';

@Component({
  selector: 'app-teacher-allocation-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DialogModule,
    DropdownModule,
    ProgressBarModule,
    SaasPageHeaderComponent,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './teacher-allocation.component.html',
  styleUrls: ['./teacher-allocation.component.scss']
})
export class TeacherAllocationPageComponent implements OnInit {
  private readonly api = inject(TeacherAllocationApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly classesApi = inject(ClassesSectionsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly nav = inject(AcademicsNavService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_TEACHER_ALLOCATION_RESOURCE;
  readonly statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'Missing', value: 'UNASSIGNED' },
    { label: 'Conflict', value: 'CONFLICT' }
  ];

  loading = true;
  saving = false;
  showBack = false;
  years: AcademicYearDto[] = [];
  classes: AcademicClassDto[] = [];
  classOptions: { label: string; value: number | null }[] = [{ label: 'All Classes', value: null }];
  sections: { label: string; value: number | null }[] = [{ label: 'All Sections', value: null }];
  subjects: { label: string; value: number | null }[] = [{ label: 'All Subjects', value: null }];
  selectedYearId: number | null = null;
  classFilter: number | null = null;
  sectionFilter: number | null = null;
  subjectFilter: number | null = null;
  statusFilter: TeacherAllocationStatus | null = null;
  dashboard: TeacherAllocationDashboard | null = null;

  showAssign = false;
  assignTarget: TeacherAllocationRow | null = null;
  recommendations: TeacherRecommendation[] = [];
  selectedStaffId: number | null = null;
  activeTab: 'allocation' | 'workload' = 'allocation';

  get readOnly(): boolean {
    return !!this.dashboard?.yearReadOnly;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.readOnly;
  }

  get assignedPercent(): number {
    const d = this.dashboard;
    if (!d?.totalSlots) return 0;
    return Math.round((d.assignedSlots / d.totalSlots) * 100);
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.showBack = !!qp.get('from');
    const qpClass = qp.get('classId');
    const qpSubject = qp.get('subjectId');
    const qpYear = qp.get('academicYearId');
    if (qpClass) this.classFilter = Number(qpClass);
    if (qpSubject) this.subjectFilter = Number(qpSubject);

    this.yearApi.search().subscribe({
      next: (years) => {
        this.years = years;
        const preferred = qpYear
          ? years.find((y) => y.academicYearId === Number(qpYear))
          : null;
        const current = preferred ?? years.find((y) => y.status === 'CURRENT') ?? years[0] ?? null;
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
        classId: this.classFilter,
        sectionId: this.sectionFilter,
        subjectId: this.subjectFilter,
        status: this.statusFilter
      })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (dash) => {
          this.dashboard = dash;
          this.refreshFilterOptions(dash);
          this.loadClasses();
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to load allocations',
          detail: err?.error?.message || 'Please try again'
        })
      });
  }

  onYearChange(): void {
    this.classFilter = null;
    this.sectionFilter = null;
    this.subjectFilter = null;
    this.reload();
  }

  onClassChange(): void {
    this.sectionFilter = null;
    this.reload();
  }

  openAssign(row: TeacherAllocationRow): void {
    if (!this.canManage) return;
    this.assignTarget = row;
    this.selectedStaffId = row.primaryStaffId ?? null;
    this.showAssign = true;
    this.recommendations = [];
    this.api.recommendations(row.sectionId, row.classSubjectMappingId).subscribe({
      next: (list) => {
        this.recommendations = list;
        if (!this.selectedStaffId && list.length) {
          const first = list.find((r) => r.recommended) ?? list[0];
          this.selectedStaffId = first.staffId;
        }
        this.cdr.markForCheck();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Unable to load recommendations',
        detail: err?.error?.message || 'Please try again'
      })
    });
  }

  confirmAssign(): void {
    if (!this.assignTarget || !this.selectedStaffId || !this.canManage) return;
    const staffId = Number(this.selectedStaffId);
    if (!staffId) return;
    this.saving = true;
    this.api
      .assign({
        sectionId: this.assignTarget.sectionId,
        classSubjectMappingId: this.assignTarget.classSubjectMappingId,
        staffId,
        role: 'PRIMARY'
      })
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.showAssign = false;
          this.messages.add({ severity: 'success', summary: 'Teacher assigned' });
          this.reload();
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Assignment failed',
          detail: err?.error?.message || 'Unable to assign teacher'
        })
      });
  }

  unassign(row: TeacherAllocationRow): void {
    if (!this.canManage || !row.teacherAllocationId) return;
    this.confirm.confirm({
      header: 'Unassign teacher?',
      message: `Remove teacher from ${row.subjectName} · ${row.className}-${row.sectionName}?`,
      acceptLabel: 'Unassign',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.unassign(row.teacherAllocationId!).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Teacher unassigned' });
            this.reload();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Unassign failed',
            detail: err?.error?.message || 'Unable to unassign'
          })
        });
      }
    });
  }

  viewStaff(staffId?: number | null): void {
    if (!staffId) return;
    this.router.navigate(['/app/staff/directory'], { queryParams: { staffId } });
  }

  statusLabel(status: TeacherAllocationStatus): string {
    if (status === 'ASSIGNED') return 'Assigned';
    if (status === 'CONFLICT') return 'Conflict';
    return 'Missing';
  }

  workloadLabel(status?: string | null): string {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'LIMITED': return 'Limited';
      case 'AT_CAPACITY': return 'At Capacity';
      case 'EXCEEDS_LIMIT': return 'Exceeds Limit';
      default: return status || '—';
    }
  }

  workloadPercent(assigned?: number | null, max?: number | null): number {
    if (!assigned || !max || max <= 0) return 0;
    return Math.min(100, Math.round((assigned / max) * 100));
  }

  private refreshFilterOptions(dash: TeacherAllocationDashboard): void {
    const sectionOpts: { label: string; value: number | null }[] = [];
    const subjectSeen = new Map<number, string>();
    const seenSections = new Set<number>();
    for (const row of dash.rows) {
      if (!seenSections.has(row.sectionId)) {
        seenSections.add(row.sectionId);
        if (!this.classFilter || row.classId === this.classFilter) {
          sectionOpts.push({ label: `${row.className}-${row.sectionName}`, value: row.sectionId });
        }
      }
      subjectSeen.set(row.subjectId, row.subjectName);
    }
    this.sections = [{ label: 'All Sections', value: null }, ...sectionOpts];
    this.subjects = [
      { label: 'All Subjects', value: null },
      ...[...subjectSeen.entries()].map(([value, label]) => ({ label, value }))
    ];
  }

  private loadClasses(): void {
    if (!this.selectedYearId) return;
    this.classesApi.getDashboard(this.selectedYearId, { active: true }).subscribe({
      next: (dash) => {
        this.classes = dash.classes || [];
        this.classOptions = [
          { label: 'All Classes', value: null },
          ...this.classes.map((cls) => ({ label: cls.name, value: cls.classId }))
        ];

        const sectionOpts: { label: string; value: number | null }[] = [];
        for (const cls of this.classes) {
          if (this.classFilter && cls.classId !== this.classFilter) continue;
          for (const section of cls.sections || []) {
            sectionOpts.push({
              label: `${cls.name}-${section.name}`,
              value: section.sectionId
            });
          }
        }
        if (sectionOpts.length) {
          this.sections = [{ label: 'All Sections', value: null }, ...sectionOpts];
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.classes = [];
        this.classOptions = [{ label: 'All Classes', value: null }];
      }
    });
  }
}
