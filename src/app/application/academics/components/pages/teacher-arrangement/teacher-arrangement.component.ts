import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicsWorkspaceData, TeacherAbsenceModel } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';
import { LoginService } from '../../../../../core/services/login.service';

@Component({
  selector: 'app-academic-teacher-arrangement-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, TableModule, ToastModule, ConfirmDialogModule, CalendarModule],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-arrangement.component.html',
  styleUrls: ['./teacher-arrangement.component.scss']
})
export class AcademicTeacherArrangementPageComponent implements OnInit {
  private readonly ws = inject(AcademicsWorkspaceService);
  private readonly loginService = inject(LoginService);
  private readonly cs = inject(ConfirmationService);
  private readonly ms = inject(MessageService);
  private readonly dr = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() dataChanged = new EventEmitter<void>();

  viewFilter: 'today' | 'upcoming' | 'history' = 'today';
  showDialog = false;
  showOverride = false;
  saving = false;
  formModel: {
    slotId?: number;
    absentTeacherId?: number;
    substituteTeacherId?: number;
    arrangementDate?: string;
    reason?: string;
  } = {};
  selectedArrangement: TeacherAbsenceModel | null = null;
  overrideTeacherId: number | null = null;

  ngOnInit() {}

  get teacherOptions() { return this.data.staff.map(t => ({ label: `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Staff #${t.staffId}`, value: t.staffId ?? t.id })); }
  get slotOptions() { return this.data.timetableSlots.map(s => ({ label: `${s.dayOfWeek} P${s.periodNumber} — ${s.subjectName}`, value: s.slotId })); }

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
    this.formModel = { arrangementDate: new Date().toISOString().split('T')[0] };
    this.showDialog = true;
  }

  save() {
    if (!this.formModel.slotId || !this.formModel.absentTeacherId || !this.formModel.substituteTeacherId || !this.formModel.arrangementDate) {
      this.ms.add({ severity: 'warn', summary: 'Complete all required fields' });
      return;
    }
    this.saving = true;
    this.ws.createTeacherAbsence({
      slotId: Number(this.formModel.slotId),
      absentTeacherId: Number(this.formModel.absentTeacherId),
      substituteTeacherId: Number(this.formModel.substituteTeacherId),
      arrangementDate: this.formModel.arrangementDate,
      reason: this.formModel.reason
    }).pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.dr))
      .subscribe({ next: () => { this.ms.add({ severity: 'success', summary: 'Arrangement recorded' }); this.dataChanged.emit(); }, error: () => this.ms.add({ severity: 'error', summary: 'Failed' }) });
  }

  approve(a: TeacherAbsenceModel) {
    const approverId = Number(this.loginService.getUser()?.id ?? 1);
    this.cs.confirm({ message: `Approve substitute arrangement?`, header: 'Approve', icon: 'pi pi-check-circle',
      accept: () => {
        this.ws.approveAbsence(Number(a.absenceId), approverId).pipe(takeUntilDestroyed(this.dr))
          .subscribe({ next: () => { this.ms.add({ severity: 'success', summary: 'Approved' }); this.dataChanged.emit(); } });
      }
    });
  }

  reject(a: TeacherAbsenceModel) {
    this.cs.confirm({ message: `Reject this arrangement?`, header: 'Reject', icon: 'pi pi-exclamation-triangle',
      accept: () => { this.ws.rejectAbsence(Number(a.absenceId)).pipe(takeUntilDestroyed(this.dr)).subscribe({ next: () => { this.ms.add({ severity: 'success', summary: 'Rejected' }); this.dataChanged.emit(); } }); }
    });
  }

  openOverride(a: TeacherAbsenceModel) {
    this.selectedArrangement = a;
    this.overrideTeacherId = null;
    this.showOverride = true;
  }

  confirmOverride() {
    if (!this.selectedArrangement || !this.overrideTeacherId) return;
    const slotId = this.selectedArrangement.affectedPeriods?.[0];
    if (!slotId || !this.selectedArrangement.teacherId) return;
    this.saving = true;
    this.ws.assignSubstitute(
      Number(this.selectedArrangement.absenceId),
      Number(this.overrideTeacherId),
      slotId,
      Number(this.selectedArrangement.teacherId),
      this.selectedArrangement.date
    ).pipe(finalize(() => { this.saving = false; this.showOverride = false; }), takeUntilDestroyed(this.dr))
      .subscribe({ next: () => { this.ms.add({ severity: 'success', summary: 'Substitute assigned' }); this.dataChanged.emit(); }, error: () => this.ms.add({ severity: 'error', summary: 'Failed' }) });
  }

  onSearch(event: Event, table: { filterGlobal: (value: string, mode: string) => void } | null) {
    if (table) table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
}
