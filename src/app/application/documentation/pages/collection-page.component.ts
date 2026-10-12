import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../core/feedback/app-toast.component';
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
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent, AppToastComponent],
  providers: [MessageService],
  template: `
    <section class="tc-page-shell">
      <tc-saas-page-header>
        <button type="button" class="tc-btn tc-btn--primary" [disabled]="saving" (click)="save()">Save collection</button>
      </tc-saas-page-header>
      <tc-saas-panel title="Document collection">
        <label>Class
          <select [(ngModel)]="classId" name="classId" (ngModelChange)="loadStudents($event)">
            <option [ngValue]="null">Select class</option>
            @for (cls of classes; track cls.id) { <option [ngValue]="cls.id">{{ cls.label }}</option> }
          </select>
        </label>
        <label>Approved type
          <select [(ngModel)]="masterId" name="masterId">
            <option [ngValue]="null">Select type</option>
            @for (master of masters; track master.id) { <option [ngValue]="master.id">{{ master.masterName }}</option> }
          </select>
        </label>
        <label><input type="checkbox" [(ngModel)]="allStudents" name="allStudents" /> All students</label>
        <div class="tc-table-wrap">
          <table>
            <thead><tr><th></th><th>Student</th><th>Document</th><th>Files</th></tr></thead>
            <tbody>
              @for (row of rows; track row.studentId) {
                <tr>
                  <td><input type="checkbox" [checked]="picked.has(row.studentId)" (change)="toggle(row.studentId)" /></td>
                  <td>{{ row.studentName }}</td>
                  <td><input [(ngModel)]="row.documentName" [name]="'doc' + row.studentId" /></td>
                  <td>
                    @for (file of row.files; track file.filePath) { <div>{{ file.fileName }}</div> }
                    @if (row.error) { <div>{{ row.error }}</div> }
                    <input type="file" (change)="addFile(row, $event)" />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </tc-saas-panel>
      <app-toast />
    </section>
  `,
  styles: [`label { display: grid; gap: 0.25rem; margin: 0.7rem 0; }`]
})
export class DocumentCollectionPageComponent implements OnInit {
  private readonly api = inject(DocumentationApiService);
  private readonly students = inject(StudentsWorkspaceService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  classes: ClassOption[] = [];
  masters: DocMaster[] = [];
  classId: number | null = null;
  masterId: number | null = null;
  allStudents = true;
  rows: CollectionRow[] = [];
  picked = new Set<number>();
  saving = false;

  ngOnInit(): void {
    this.students.listAcademicYears().subscribe(years => {
      const yearId = years[0]?.id;
      if (yearId) this.students.listClasses(yearId).subscribe(rows => { this.classes = rows; this.cdr.markForCheck(); });
    });
    this.api.approved('collection-masters').subscribe({
      next: rows => { this.masters = rows; this.cdr.markForCheck(); },
      error: () => this.messages.add({ severity: 'error', summary: 'Approved collection types could not be loaded' })
    });
  }

  loadStudents(classId: number | null): void {
    if (!classId) return;
    this.api.classStudents(classId).subscribe(rows => {
      this.rows = rows.map((row: ClassStudentRow) => ({ studentId: row.studentId, studentName: row.studentName, documentName: '', files: [], error: '' }));
      this.picked = new Set(rows.map(row => row.studentId));
      this.cdr.markForCheck();
    });
  }

  toggle(id: number): void {
    if (this.picked.has(id)) this.picked.delete(id);
    else this.picked.add(id);
  }

  addFile(row: CollectionRow, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.api.upload(file).subscribe({
      next: stored => { row.files = [...row.files, stored]; row.error = ''; this.cdr.markForCheck(); },
      error: () => { row.error = 'This file was not stored'; this.cdr.markForCheck(); }
    });
    input.value = '';
  }

  save(): void {
    const audience = this.allStudents ? this.rows : this.rows.filter(row => this.picked.has(row.studentId));
    if (!this.classId || !this.masterId || !audience.length) return;
    this.saving = true;
    this.api.saveCollection({
      classId: this.classId,
      masterId: this.masterId,
      allStudents: this.allStudents,
      items: audience.map(row => ({ studentId: row.studentId, documentName: row.documentName, files: row.files }))
    }).subscribe({
      next: () => { this.saving = false; this.messages.add({ severity: 'success', summary: 'Collection saved' }); this.cdr.markForCheck(); },
      error: () => { this.saving = false; this.messages.add({ severity: 'error', summary: 'Collection was not saved' }); this.cdr.markForCheck(); }
    });
  }
}
