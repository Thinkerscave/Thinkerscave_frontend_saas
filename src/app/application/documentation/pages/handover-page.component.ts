import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../core/feedback/app-toast.component';
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
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent, AppListToolbarComponent, AppToastComponent],
  providers: [MessageService],
  template: `
    <section class="tc-page-shell">
      <tc-saas-page-header>
        <button type="button" class="tc-btn tc-btn--primary" (click)="save()">Save handover</button>
      </tc-saas-page-header>
      <tc-saas-panel title="Study material handover">
        <label>Class
          <select [(ngModel)]="classId" name="classId" (ngModelChange)="loadStudents($event)">
            <option [ngValue]="null">Select class</option>
            @for (cls of classes; track cls.id) { <option [ngValue]="cls.id">{{ cls.label }}</option> }
          </select>
        </label>
        <label>Approved material
          <select [(ngModel)]="masterId" name="masterId">
            <option [ngValue]="null">Select material</option>
            @for (master of masters; track master.id) { <option [ngValue]="master.id">{{ master.masterName }}</option> }
          </select>
        </label>
        <label><input type="checkbox" [(ngModel)]="allStudents" name="allStudents" /> All students</label>
        <app-list-toolbar [showSearch]="false" [search]="''" (submitted)="applyFilter()" (reset)="statusFilter = ''; applyFilter()">
          <select [(ngModel)]="statusFilter" name="statusFilter">
            <option value="">All statuses</option>
            <option value="ALL">All handed over</option>
            <option value="PARTIALLY">Partially</option>
            <option value="NOT_HANDEDOVER">Not handed over</option>
          </select>
        </app-list-toolbar>
        <div class="tc-table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Description</th><th>Handed over</th><th>Status</th><th></th></tr></thead>
            <tbody>
              @for (row of visible; track row.studentId) {
                <tr>
                  <td>{{ row.studentName }}</td>
                  <td><input [(ngModel)]="row.description" [name]="'d' + row.studentId" /></td>
                  <td><input type="checkbox" [(ngModel)]="row.handedOver" [name]="'h' + row.studentId" /></td>
                  <td>
                    <select [(ngModel)]="row.status" [name]="'s' + row.studentId">
                      <option value="ALL">ALL</option>
                      <option value="PARTIALLY">PARTIALLY</option>
                      <option value="NOT_HANDEDOVER">NOT_HANDEDOVER</option>
                    </select>
                  </td>
                  <td>@if (row.id) { <button type="button" class="tc-btn" title="Saves this student's handover without changing the other rows" (click)="updateOne(row)">Save row</button> }</td>
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
export class StudyMaterialHandoverPageComponent implements OnInit {
  private readonly api = inject(DocumentationApiService);
  private readonly students = inject(StudentsWorkspaceService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  classes: ClassOption[] = [];
  masters: DocMaster[] = [];
  classId: number | null = null;
  masterId: number | null = null;
  allStudents = true;
  statusFilter = '';
  rows: HandoverRow[] = [];
  visible: HandoverRow[] = [];
  handoverId: number | null = null;

  ngOnInit(): void {
    this.students.listAcademicYears().subscribe(years => {
      const yearId = years[0]?.id;
      if (yearId) this.students.listClasses(yearId).subscribe(rows => { this.classes = rows; this.cdr.markForCheck(); });
    });
    this.api.approved('material-masters').subscribe(rows => { this.masters = rows; this.cdr.markForCheck(); });
  }

  loadStudents(classId: number | null): void {
    if (!classId) return;
    this.handoverId = null;
    this.api.classStudents(classId).subscribe(rows => {
      this.rows = rows.map((row: ClassStudentRow) => ({ studentId: row.studentId, studentName: row.studentName, description: '', handedOver: false, status: 'NOT_HANDEDOVER' }));
      this.applyFilter();
    });
  }

  applyFilter(): void {
    this.visible = this.statusFilter ? this.rows.filter(row => row.status === this.statusFilter) : [...this.rows];
    this.cdr.markForCheck();
  }

  save(): void {
    if (!this.classId || !this.masterId) return;
    this.api.saveHandover({
      classId: this.classId,
      masterId: this.masterId,
      allStudents: this.allStudents,
      items: this.rows.map(row => ({ studentId: row.studentId, description: row.description, handedOver: row.handedOver, status: row.status }))
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
    if (!row.id) return;
    this.api.updateHandoverItem(row.id, { studentId: row.studentId, description: row.description, handedOver: row.handedOver, status: row.status }).subscribe({
      next: () => this.messages.add({ severity: 'success', summary: 'Student row saved' }),
      error: () => this.messages.add({ severity: 'error', summary: 'This row was not saved' })
    });
  }
}
