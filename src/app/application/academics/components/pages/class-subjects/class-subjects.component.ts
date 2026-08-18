import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
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
  ClassMappingBoard,
  ClassSubjectMappingDto,
  SUBJECT_CATEGORY_OPTIONS,
  SubjectCategory
} from '../../../models/subjects-mapping.model';

@Component({
  selector: 'app-class-subjects-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
    DialogModule,
    CheckboxModule,
    MenuModule,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './class-subjects.component.html',
  styleUrls: ['./class-subjects.component.scss']
})
export class ClassSubjectsPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(SubjectsMappingApiService);
  private readonly classesApi = inject(ClassesSectionsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly nav = inject(AcademicsNavService);
  private readonly pageHeader = inject(BreadCrumbService);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_SUBJECTS_RESOURCE;

  loading = true;
  loadError = false;
  saving = false;
  cls: AcademicClassDto | null = null;
  board: ClassMappingBoard | null = null;
  private classId: number | null = null;

  showAddDialog = false;
  addSearch = '';
  selectedSubjectIds = new Set<number>();
  menuItems: MenuItem[] = [];

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.cls?.yearReadOnly;
  }

  get mappedSubjects(): ClassSubjectMappingDto[] {
    return (this.board?.mappings || []).filter((m) => m.included);
  }

  get unmappedSubjects(): ClassSubjectMappingDto[] {
    return (this.board?.mappings || []).filter((m) => !m.included);
  }

  get availableSubjects(): ClassSubjectMappingDto[] {
    const q = this.addSearch.trim().toLowerCase();
    return this.unmappedSubjects.filter((m) => {
      if (!q) return true;
      return (
        m.subjectName.toLowerCase().includes(q) ||
        m.subjectCode.toLowerCase().includes(q) ||
        this.categoryLabel(m.category).toLowerCase().includes(q)
      );
    });
  }

  get selectedCount(): number {
    return this.selectedSubjectIds.size;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('classId'));
      if (id) {
        this.classId = id;
        this.load(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  back(): void {
    if (this.classId) {
      void this.router.navigate(['/app/academics/classes-sections', this.classId], {
        queryParams: { from: 'classes' }
      });
      return;
    }
    this.nav.back(this.route, ['/app/academics/classes-sections']);
  }

  retry(): void {
    if (this.classId) this.load(this.classId);
  }

  load(classId: number): void {
    this.loading = true;
    this.loadError = false;
    forkJoin({
      cls: this.classesApi.getClass(classId),
      board: this.api.getClassMappingBoard(classId)
    }).pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: ({ cls, board }) => {
        this.cls = cls;
        this.board = board;
        this.pageHeader.setPageHeader({
          title: 'Class Subjects',
          subtitle: cls.name
        });
      },
      error: () => {
        this.cls = null;
        this.board = null;
        this.loadError = true;
      }
    });
  }

  reloadBoard(): void {
    if (!this.classId) return;
    this.api.getClassMappingBoard(this.classId).subscribe({
      next: (board) => {
        this.board = board;
        this.cdr.markForCheck();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Unable to refresh mappings',
        detail: err?.error?.message || 'Please try again'
      })
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

  openAddDialog(): void {
    if (!this.canManage) return;
    this.addSearch = '';
    this.selectedSubjectIds = new Set();
    this.showAddDialog = true;
  }

  isSelected(subjectId: number): boolean {
    return this.selectedSubjectIds.has(subjectId);
  }

  toggleSelect(subjectId: number, checked: boolean): void {
    if (checked) {
      this.selectedSubjectIds.add(subjectId);
    } else {
      this.selectedSubjectIds.delete(subjectId);
    }
    this.selectedSubjectIds = new Set(this.selectedSubjectIds);
    this.cdr.markForCheck();
  }

  addSelectedSubjects(): void {
    if (!this.classId || !this.canManage || !this.selectedCount) return;
    const rows = (this.board?.mappings || []).filter((m) => this.selectedSubjectIds.has(m.subjectId));
    this.saving = true;
    forkJoin(
      rows.map((row) => this.api.upsertMapping(this.classId!, {
        subjectId: row.subjectId,
        included: true,
        weeklyPeriods: row.defaultWeeklyPeriods || row.weeklyPeriods,
        timetablePreference: row.timetablePreference
      }))
    ).pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showAddDialog = false;
        this.messages.add({
          severity: 'success',
          summary: rows.length === 1 ? 'Subject added' : `${rows.length} subjects added`
        });
        this.reloadBoard();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Add failed',
        detail: err?.error?.message || 'Unable to add subjects'
      })
    });
  }

  openSubjectDetail(subjectId: number): void {
    void this.router.navigate(
      ['/app/academics/subjects-mapping', subjectId],
      { queryParams: { from: 'classes' } }
    );
  }

  buildMenu(row: ClassSubjectMappingDto): void {
    const items: MenuItem[] = [
      {
        label: 'View Subject',
        icon: 'pi pi-eye',
        command: () => this.openSubjectDetail(row.subjectId)
      }
    ];
    if (this.canManage) {
      items.push({
        label: 'Remove from Class',
        icon: 'pi pi-times',
        command: () => this.removeMapping(row)
      });
    }
    this.menuItems = items;
  }

  removeMapping(row: ClassSubjectMappingDto): void {
    if (!this.classId || !this.canManage) return;
    this.confirm.confirm({
      header: `Remove ${row.subjectName}?`,
      message: `${row.subjectName} will no longer be taught in ${this.cls?.name || 'this class'}.`,
      acceptLabel: 'Remove',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.upsertMapping(this.classId!, {
          subjectId: row.subjectId,
          included: false
        }).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Subject removed' });
            this.reloadBoard();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Remove failed',
            detail: err?.error?.message || 'Unable to remove subject'
          })
        });
      }
    });
  }

  stageLabel(): string {
    if (!this.cls) return '';
    const stage = this.cls.stage || this.board?.stage || '';
    return stage
      ? stage.charAt(0) + stage.slice(1).toLowerCase().replace(/_/g, ' ')
      : '';
  }
}
