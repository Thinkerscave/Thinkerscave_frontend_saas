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
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../shared/ui/saas/saas-primitives';
import { StudentsWorkspaceService } from '../../students/services/students-workspace.service';
import { ClassOption } from '../../students/models/students-workspace.model';
import { ClassStudentRow, DocMaster, DocumentationApiService } from '../documentation-api.service';

interface CollectionRow {
  studentId: number;
  studentName: string;
  documentName: string;
  files: { fileName: string; filePath: string }[];
  error: string;
}

@Component({
  selector: 'app-document-collection-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    AppSectionHeaderComponent,
    AppSelectComponent,
    AppEmptyStateComponent,
    AppToastComponent
  ],
  providers: [MessageService],
  templateUrl: './collection-page.component.html',
  styleUrls: ['../../front-desk/front-desk.shared.scss', '../documentation.shared.scss', './collection-page.component.scss']
})
export class DocumentCollectionPageComponent implements OnInit {
  private readonly api = inject(DocumentationApiService);
  private readonly students = inject(StudentsWorkspaceService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  classes: ClassOption[] = [];
  masters: DocMaster[] = [];
  /** Bound to app-select (string values). */
  classId: string | null = null;
  masterId: string | null = null;
  allStudents = true;
  rows: CollectionRow[] = [];
  picked = new Set<number>();
  saving = false;

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
    this.api.approved('collection-masters').subscribe({
      next: rows => {
        this.masters = rows;
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Approved collection types could not be loaded' })
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
      this.cdr.markForCheck();
      return;
    }
    this.api.classStudents(classId).subscribe(rows => {
      this.rows = rows.map((row: ClassStudentRow) => ({
        studentId: row.studentId,
        studentName: row.studentName,
        documentName: '',
        files: [],
        error: ''
      }));
      this.picked = new Set(rows.map(row => row.studentId));
      this.cdr.markForCheck();
    });
  }

  toggle(id: number): void {
    if (this.picked.has(id)) {
      this.picked.delete(id);
    } else {
      this.picked.add(id);
    }
  }

  addFile(row: CollectionRow, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.api.upload(file).subscribe({
      next: stored => {
        row.files = [...row.files, stored];
        row.error = '';
        this.cdr.markForCheck();
      },
      error: () => {
        row.error = 'File was not stored';
        this.cdr.markForCheck();
      }
    });
    input.value = '';
  }

  save(): void {
    const audience = this.allStudents ? this.rows : this.rows.filter(row => this.picked.has(row.studentId));
    const classId = this.classId ? Number(this.classId) : null;
    const masterId = this.masterId ? Number(this.masterId) : null;
    if (!classId || !masterId || !audience.length) {
      this.messages.add({ severity: 'warn', summary: 'Select class, approved type, and at least one student' });
      return;
    }
    this.saving = true;
    this.api.saveCollection({
      classId,
      masterId,
      allStudents: this.allStudents,
      items: audience.map(row => ({ studentId: row.studentId, documentName: row.documentName, files: row.files }))
    }).subscribe({
      next: () => {
        this.saving = false;
        this.messages.add({ severity: 'success', summary: 'Collection saved' });
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.messages.add({ severity: 'error', summary: 'Collection was not saved' });
        this.cdr.markForCheck();
      }
    });
  }
}
