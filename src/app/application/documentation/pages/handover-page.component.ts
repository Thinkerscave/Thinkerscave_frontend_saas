import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../core/feedback/app-toast.component';
import {
  AppEmptyStateComponent,
  AppSectionHeaderComponent,
  AppSelectComponent,
  AppSelectOption
} from '../../../shared/ui/app-form';
import { AppListToolbarComponent } from '../../../shared/ui/app-list/app-list-toolbar.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../shared/ui/saas/saas-primitives';
import { StudentsWorkspaceService } from '../../students/services/students-workspace.service';
import { ClassOption } from '../../students/models/students-workspace.model';
import { ClassStudentRow, DocMaster, DocumentationApiService } from '../documentation-api.service';

interface HandoverRow {
  id?: number;
  studentId: number;
  studentName: string;
  description: string;
  handedOver: boolean;
  status: string;
}

@Component({
  selector: 'app-study-material-handover-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    AppListToolbarComponent,
    AppSectionHeaderComponent,
    AppSelectComponent,
    AppEmptyStateComponent,
    AppToastComponent
  ],
  providers: [MessageService],
  templateUrl: './handover-page.component.html',
  styleUrls: [
    '../../front-desk/front-desk.shared.scss',
    '../documentation.shared.scss',
    './collection-page.component.scss'
  ]
})
export class StudyMaterialHandoverPageComponent implements OnInit {
  private readonly api = inject(DocumentationApiService);
  private readonly students = inject(StudentsWorkspaceService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly handoverStatusOptions: AppSelectOption[] = [
    { value: 'ALL', label: 'Fully handed over' },
    { value: 'PARTIALLY', label: 'Partially' },
    { value: 'NOT_HANDEDOVER', label: 'Not handed over' }
  ];

  classes: ClassOption[] = [];
  masters: DocMaster[] = [];
  classId: string | null = null;
  masterId: string | null = null;
  allStudents = true;
  statusFilter = '';
  rows: HandoverRow[] = [];
  visible: HandoverRow[] = [];
  handoverId: number | null = null;

  ngOnInit(): void {
    this.students.listAcademicYears().subscribe(years => {
      const yearId = years[0]?.id;
      if (yearId) {
        this.students.listClasses(yearId).subscribe(rows => {
          this.classes = rows;
          this.cdr.markForCheck();
        });
      }
    });
    this.api.approved('material-masters').subscribe(rows => {
      this.masters = rows;
      this.cdr.markForCheck();
    });
  }

  get classOptions(): AppSelectOption[] {
    return this.classes.map(c => ({ value: String(c.id), label: c.label }));
  }

  get masterOptions(): AppSelectOption[] {
    return this.masters
      .filter(m => m.id != null)
      .map(m => ({ value: String(m.id), label: m.masterName ?? '' }));
  }

  loadStudents(classKey: string | null): void {
    const classId = classKey ? Number(classKey) : null;
    if (!classId) {
      this.rows = [];
      this.visible = [];
      this.cdr.markForCheck();
      return;
    }
    this.handoverId = null;
    this.api.classStudents(classId).subscribe(rows => {
      this.rows = rows.map((row: ClassStudentRow) => ({
        studentId: row.studentId,
        studentName: row.studentName,
        description: '',
        handedOver: false,
        status: 'NOT_HANDEDOVER'
      }));
      this.applyFilter();
    });
  }

  applyFilter(): void {
    this.visible = this.statusFilter ? this.rows.filter(row => row.status === this.statusFilter) : [...this.rows];
    this.cdr.markForCheck();
  }

  save(): void {
    const classId = this.classId ? Number(this.classId) : null;
    const masterId = this.masterId ? Number(this.masterId) : null;
    if (!classId || !masterId) {
      this.messages.add({ severity: 'warn', summary: 'Select class and approved material' });
      return;
    }
    this.api.saveHandover({
      classId,
      masterId,
      allStudents: this.allStudents,
      items: this.rows.map(row => ({
        studentId: row.studentId,
        description: row.description,
        handedOver: row.handedOver,
        status: row.status
      }))
    }).subscribe({
      next: saved => {
        this.handoverId = Number(saved['id']);
        this.api.handoverItems(this.handoverId, '').subscribe(items => {
          this.rows = items.map(item => ({
            id: Number(item['id']),
            studentId: Number(item['studentId']),
            studentName: String(item['studentName'] ?? ''),
            description: String(item['description'] ?? ''),
            handedOver: Boolean(item['handedOver']),
            status: String(item['status'] ?? 'NOT_HANDEDOVER')
          }));
          this.applyFilter();
          this.messages.add({ severity: 'success', summary: 'Handover saved' });
        });
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Handover was not saved' })
    });
  }

  updateOne(row: HandoverRow): void {
    if (!row.id) {
      return;
    }
    this.api.updateHandoverItem(row.id, {
      studentId: row.studentId,
      description: row.description,
      handedOver: row.handedOver,
      status: row.status
    }).subscribe({
      next: () => this.messages.add({ severity: 'success', summary: 'Student row saved' }),
      error: () => this.messages.add({ severity: 'error', summary: 'This row was not saved' })
    });
  }
}
