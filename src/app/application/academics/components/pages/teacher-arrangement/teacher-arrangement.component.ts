import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicsWorkspaceData, TeacherAbsenceModel } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';

@Component({
  selector: 'app-academic-teacher-arrangement-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, TableModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-arrangement.component.html',
  styleUrls: ['./teacher-arrangement.component.scss']
})
export class AcademicTeacherArrangementPageComponent implements OnInit {
  private readonly ws = inject(AcademicsWorkspaceService);
  private readonly cs = inject(ConfirmationService);
  private readonly ms = inject(MessageService);
  private readonly dr = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() dataChanged = new EventEmitter<void>();

  viewFilter: 'today' | 'upcoming' | 'history' = 'today';
  showDialog = false;
  showOverride = false;
  saving = false;
  formModel: any = {};
  overrideAbsence: TeacherAbsenceModel | null = null;
  overrideTeacherId: any = null;

  ngOnInit() {}

  get teacherOptions() { return this.data.staff.map(t => ({ label: `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Staff #${t.staffId}`, value: t.staffId ?? t.id })); }

  get filtered(): TeacherAbsenceModel[] {
    const today = new Date().toISOString().split('T')[0];
    switch (this.viewFilter) {
      case 'today': return this.data.teacherAbsences.filter(a => a.date === today);
      case 'upcoming': return this.data.teacherAbsences.filter(a => a.date > today);
      default: return this.data.teacherAbsences;
    }
  }

  get absentToday() { return this.data.teacherAbsences.filter(a => a.date === new Date().toISOString().split('T')[0]).length; }
  get affectedClasses() { return this.data.teacherAbsences.reduce((s, a) => s + (a.affectedClasses?.length || 0), 0); }
  get pending() { return this.data.teacherAbsences.filter(a => a.status === 'PENDING').length; }
  get approved() { return this.data.teacherAbsences.filter(a => a.status === 'APPROVED').length; }

  // AI recommendation panel data
  get suggestedReplacements() {
    return this.data.teacherAbsences
      .filter(a => a.status === 'PENDING' && a.suggestedReplacementName)
      .slice(0, 5)
      .map(a => ({
        teacherName: a.suggestedReplacementName,
        score: a.confidenceScore || 0,
        reason: a.reason,
        date: a.date,
        absentTeacher: a.teacherName
      }));
  }

  openRecordDialog() {
    this.formModel = { teacherId: null, date: '', reason: '', affectedClassesInput: '' };
    this.showDialog = true;
  }

  save() {
    if (!this.formModel.teacherId || !this.formModel.date || !this.formModel.reason) return;
    this.saving = true;
    this.ws.createTeacherAbsence({
      teacherId: this.formModel.teacherId,
      date: this.formModel.date,
      reason: this.formModel.reason,
      affectedClasses: this.formModel.affectedClassesInput ? this.formModel.affectedClassesInput.split(',').map((s: string) => s.trim()) : [],
      status: 'PENDING'
    }).pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.dr))
      .subscribe({ next: () => { this.ms.add({ severity: 'success', summary: 'Absence recorded' }); this.dataChanged.emit(); }, error: () => this.ms.add({ severity: 'error', summary: 'Failed' }) });
  }

  approve(a: TeacherAbsenceModel) {
    this.cs.confirm({ message: `Approve replacement for ${a.teacherName}?`, header: 'Approve', icon: 'pi pi-check-circle',
      accept: () => { this.ws.approveAbsence(Number(a.absenceId)).pipe(takeUntilDestroyed(this.dr)).subscribe({ next: () => { this.ms.add({ severity: 'success', summary: 'Approved' }); this.dataChanged.emit(); } }); }
    });
  }

  reject(a: TeacherAbsenceModel) {
    this.cs.confirm({ message: `Reject absence for ${a.teacherName}?`, header: 'Reject', icon: 'pi pi-exclamation-triangle',
      accept: () => { this.ws.rejectAbsence(Number(a.absenceId)).pipe(takeUntilDestroyed(this.dr)).subscribe({ next: () => { this.ms.add({ severity: 'success', summary: 'Rejected' }); this.dataChanged.emit(); } }); }
    });
  }

  openOverride(a: TeacherAbsenceModel) {
    this.overrideAbsence = a;
    this.overrideTeacherId = null;
    this.showOverride = true;
  }

  confirmOverride() {
    if (!this.overrideAbsence || !this.overrideTeacherId) return;
    this.saving = true;
    this.ws.overrideAbsence(Number(this.overrideAbsence.absenceId), Number(this.overrideTeacherId))
      .pipe(finalize(() => { this.saving = false; this.showOverride = false; }), takeUntilDestroyed(this.dr))
      .subscribe({ next: () => { this.ms.add({ severity: 'success', summary: 'Overridden' }); this.dataChanged.emit(); }, error: () => this.ms.add({ severity: 'error', summary: 'Failed' }) });
  }

  onSearch(event: any, table: any) {
    if (table) table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
}