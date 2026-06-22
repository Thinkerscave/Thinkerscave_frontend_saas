import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicsActionMode, AcademicsWorkspaceData, TeacherAbsenceModel } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';
import { finalize } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-academic-teacher-arrangement-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, TableModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="arrangement-page">
      <!-- Header -->
      <div class="arrangement-header">
        <div>
          <div class="arrangement-eyebrow">Teacher Arrangement</div>
          <h1 class="arrangement-title">Leave & Substitution Management</h1>
        </div>
        <div class="arrangement-actions">
          <div class="arrangement-view-tabs">
            <button class="arrangement-view-tab" [class.active]="viewFilter === 'today'" (click)="viewFilter = 'today'">Today</button>
            <button class="arrangement-view-tab" [class.active]="viewFilter === 'upcoming'" (click)="viewFilter = 'upcoming'">Upcoming</button>
            <button class="arrangement-view-tab" [class.active]="viewFilter === 'history'" (click)="viewFilter = 'history'">History</button>
          </div>
          <button class="arrangement-btn arrangement-btn-primary" (click)="openRecordAbsenceDialog()">
            <i class="pi pi-user-minus"></i> Record Absence
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="arrangement-summary">
        <div class="arrangement-summary-card">
          <i class="pi pi-user-minus" style="color: #EF4444;"></i>
          <div>
            <span>Absent Today</span>
            <strong>{{ absentTodayCount }}</strong>
          </div>
        </div>
        <div class="arrangement-summary-card">
          <i class="pi pi-exclamation-triangle" style="color: #F59E0B;"></i>
          <div>
            <span>Affected Classes</span>
            <strong>{{ affectedClassCount }}</strong>
          </div>
        </div>
        <div class="arrangement-summary-card">
          <i class="pi pi-clock" style="color: #6366F1;"></i>
          <div>
            <span>Pending</span>
            <strong>{{ pendingCount }}</strong>
          </div>
        </div>
        <div class="arrangement-summary-card">
          <i class="pi pi-check-circle" style="color: #10B981;"></i>
          <div>
            <span>Approved</span>
            <strong>{{ approvedCount }}</strong>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="arrangement-table-panel">
        <p-table [value]="filteredAbsences" [paginator]="true" [rows]="10"
          [globalFilterFields]="['teacherName', 'reason', 'status', 'suggestedReplacementName']"
          styleClass="arrangement-table">
          <ng-template pTemplate="caption">
            <div class="arrangement-table-header">
              <span class="arrangement-table-title">Absence Records</span>
              <input pInputText type="text" (input)="onSearch($event)" placeholder="Search absences..." class="arrangement-search-input">
            </div>
          </ng-template>
          <ng-template pTemplate="header">
            <tr>
              <th>Teacher</th>
              <th>Date</th>
              <th>Affected Classes</th>
              <th>Subject</th>
              <th>Suggested Replacement</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-absence>
            <tr>
              <td><strong>{{ absence.teacherName }}</strong></td>
              <td>{{ absence.date | date:'mediumDate' }}</td>
              <td>{{ (absence.affectedClasses || []).join(', ') || 'N/A' }}</td>
              <td>{{ absence.reason }}</td>
              <td>
                <span *ngIf="absence.suggestedReplacementName">
                  <strong>{{ absence.suggestedReplacementName }}</strong>
                  <small *ngIf="absence.confidenceScore" class="arrangement-match-badge">{{ absence.confidenceScore }}% match</small>
                </span>
                <span *ngIf="!absence.suggestedReplacementName" class="arrangement-muted">Not suggested</span>
              </td>
              <td>
                <span class="arrangement-status" [class.pending]="absence.status === 'PENDING'"
                  [class.approved]="absence.status === 'APPROVED'"
                  [class.rejected]="absence.status === 'REJECTED'"
                  [class.overridden]="absence.status === 'OVERRIDDEN'">
                  {{ absence.status }}
                </span>
              </td>
              <td>
                <div class="arrangement-action-btns" *ngIf="absence.status === 'PENDING'">
                  <button class="arrangement-icon-btn success" pTooltip="Approve" (click)="approveAbsence(absence)">
                    <i class="pi pi-check"></i>
                  </button>
                  <button class="arrangement-icon-btn danger" pTooltip="Reject" (click)="rejectAbsence(absence)">
                    <i class="pi pi-times"></i>
                  </button>
                  <button class="arrangement-icon-btn" pTooltip="Override" (click)="openOverrideDialog(absence)">
                    <i class="pi pi-refresh"></i>
                  </button>
                </div>
                <span *ngIf="absence.status !== 'PENDING'" class="arrangement-muted">{{ absence.approvedByName || 'System' }}</span>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="arrangement-empty">
                <i class="pi pi-check-circle"></i>
                <p>No teacher absences recorded. All teachers are available.</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Record Absence Dialog -->
    <p-dialog header="Record Teacher Absence" [(visible)]="showAbsenceDialog" [modal]="true" [style]="{width: '800px'}" [draggable]="false" [resizable]="false">
      <div class="arrangement-dialog-form">
        <div class="arrangement-form-row">
          <label>Teacher <span class="required">*</span></label>
          <p-dropdown [options]="teacherOptions" [(ngModel)]="absenceForm.teacherId" optionLabel="label" optionValue="value" placeholder="Select Teacher" styleClass="arrangement-form-dropdown"></p-dropdown>
        </div>
        <div class="arrangement-form-row">
          <label>Date <span class="required">*</span></label>
          <input pInputText type="date" [(ngModel)]="absenceForm.date" class="arrangement-form-input">
        </div>
        <div class="arrangement-form-row">
          <label>Reason <span class="required">*</span></label>
          <input pInputText [(ngModel)]="absenceForm.reason" placeholder="e.g., Medical leave" class="arrangement-form-input">
        </div>
        <div class="arrangement-form-row">
          <label>Affected Classes</label>
          <input pInputText [(ngModel)]="absenceForm.affectedClassesInput" placeholder="e.g., Class 1-A, Class 2-B" class="arrangement-form-input">
        </div>
        <div class="arrangement-form-row">
          <label>Notes</label>
          <textarea pInputTextarea [(ngModel)]="absenceForm.notes" rows="3" placeholder="Additional notes..." class="arrangement-form-input"></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="arrangement-btn arrangement-btn-ghost" (click)="showAbsenceDialog = false">Cancel</button>
        <button class="arrangement-btn arrangement-btn-primary" (click)="saveAbsence()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>

    <!-- Override Dialog -->
    <p-dialog header="Override Replacement" [(visible)]="showOverrideDialog" [modal]="true" [style]="{width: '600px'}" [draggable]="false" [resizable]="false">
      <div class="arrangement-dialog-form">
        <p>Override replacement for <strong>{{ overridingAbsence?.teacherName }}</strong> on {{ overridingAbsence?.date | date:'mediumDate' }}</p>
        <div class="arrangement-form-row">
          <label>Replacement Teacher <span class="required">*</span></label>
          <p-dropdown [options]="teacherOptions" [(ngModel)]="overrideTeacherId" optionLabel="label" optionValue="value" placeholder="Select Replacement" styleClass="arrangement-form-dropdown"></p-dropdown>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="arrangement-btn arrangement-btn-ghost" (click)="showOverrideDialog = false">Cancel</button>
        <button class="arrangement-btn arrangement-btn-primary" (click)="confirmOverride()" [disabled]="saving">
          <i class="pi pi-check"></i> Override
        </button>
      </ng-template>
    </p-dialog>

    <p-confirmDialog [style]="{width: '500px'}"></p-confirmDialog>
    <p-toast position="top-right"></p-toast>
  `,
  styles: [`
    :host { display: block; }
    .arrangement-page { display: flex; flex-direction: column; gap: 1.25rem; padding: 0.25rem; }
    .arrangement-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .arrangement-eyebrow { font-size: 0.8rem; color: var(--tc-text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .arrangement-title { font-size: 1.5rem; font-weight: 700; color: var(--tc-heading); margin: 0.25rem 0 0; }
    .arrangement-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .arrangement-view-tabs { display: flex; background: var(--tc-bg-muted); border-radius: 8px; padding: 0.2rem; }
    .arrangement-view-tab { padding: 0.4rem 0.85rem; border: none; background: transparent; color: var(--tc-text-muted); font-size: 0.85rem; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
    .arrangement-view-tab.active { background: var(--tc-surface-card); color: var(--tc-heading); font-weight: 600; }
    .arrangement-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
    .arrangement-btn-primary { background: var(--tc-primary-600); color: #fff; border-color: var(--tc-primary-600); }
    .arrangement-btn-ghost { background: transparent; color: var(--tc-text-muted); border-color: transparent; }
    .arrangement-btn-ghost:hover { background: var(--tc-bg-muted); }
    .arrangement-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
    .arrangement-summary-card { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: var(--tc-surface-card); border: 1px solid var(--tc-border); border-radius: 12px; }
    .arrangement-summary-card i { font-size: 1.5rem; }
    .arrangement-summary-card span { display: block; font-size: 0.8rem; color: var(--tc-text-muted); }
    .arrangement-summary-card strong { font-size: 1.5rem; color: var(--tc-heading); }
    .arrangement-table-panel { background: var(--tc-surface-card); border: 1px solid var(--tc-border); border-radius: 12px; padding: 1rem; overflow: auto; }
    .arrangement-table { width: 100%; }
    .arrangement-table-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.5rem 0; }
    .arrangement-table-title { font-weight: 600; color: var(--tc-heading); }
    .arrangement-search-input { padding: 0.5rem 0.75rem; border: 1px solid var(--tc-border); border-radius: 8px; background: var(--tc-bg); color: var(--tc-text); min-width: 240px; }
    .arrangement-status { display: inline-flex; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .arrangement-status.pending { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }
    .arrangement-status.approved { background: rgba(16, 185, 129, 0.12); color: #10B981; }
    .arrangement-status.rejected { background: rgba(239, 68, 68, 0.12); color: #EF4444; }
    .arrangement-status.overridden { background: rgba(99, 102, 241, 0.12); color: #6366F1; }
    .arrangement-action-btns { display: flex; gap: 0.35rem; }
    .arrangement-icon-btn { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--tc-border); background: transparent; color: var(--tc-text-muted); cursor: pointer; transition: all 0.2s; }
    .arrangement-icon-btn:hover { background: var(--tc-bg-muted); }
    .arrangement-icon-btn.success:hover { color: #10B981; border-color: #10B981; }
    .arrangement-icon-btn.danger:hover { color: #EF4444; border-color: #EF4444; }
    .arrangement-match-badge { display: inline-block; margin-left: 0.35rem; padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.7rem; background: rgba(16, 185, 129, 0.12); color: #10B981; }
    .arrangement-muted { color: var(--tc-text-muted); font-size: 0.8rem; }
    .arrangement-empty { text-align: center; padding: 3rem 1rem; color: var(--tc-text-muted); }
    .arrangement-empty i { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; opacity: 0.5; }
    .arrangement-empty p { margin: 0; }
    .arrangement-dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .arrangement-form-row { display: flex; flex-direction: column; gap: 0.35rem; }
    .arrangement-form-row label { font-size: 0.85rem; font-weight: 500; color: var(--tc-text); }
    .required { color: #EF4444; }
    .arrangement-form-input { padding: 0.6rem 0.75rem; border: 1px solid var(--tc-border); border-radius: 8px; background: var(--tc-bg); color: var(--tc-text); }
    .arrangement-form-input:focus { outline: none; border-color: var(--tc-primary-600); }
    .arrangement-form-dropdown { width: 100%; }
  `]
})
export class AcademicTeacherArrangementPageComponent implements OnInit {
  private readonly workspaceService = inject(AcademicsWorkspaceService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();
  @Output() dataChanged = new EventEmitter<void>();

  viewFilter: 'today' | 'upcoming' | 'history' = 'today';
  showAbsenceDialog = false;
  showOverrideDialog = false;
  saving = false;
  absenceForm: any = { teacherId: null, date: '', reason: '', affectedClassesInput: '', notes: '' };
  overridingAbsence: TeacherAbsenceModel | null = null;
  overrideTeacherId: any = null;

  get teacherOptions() {
    return this.data.staff.map(t => ({
      label: `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Staff #${t.staffId}`,
      value: t.staffId ?? t.id
    }));
  }

  ngOnInit() {}

  get filteredAbsences(): TeacherAbsenceModel[] {
    const today = new Date().toISOString().split('T')[0];
    switch (this.viewFilter) {
      case 'today': return this.data.teacherAbsences.filter(a => a.date === today);
      case 'upcoming': return this.data.teacherAbsences.filter(a => a.date > today);
      case 'history': return this.data.teacherAbsences;
      default: return this.data.teacherAbsences;
    }
  }

  get absentTodayCount() { return this.data.teacherAbsences.filter(a => a.date === new Date().toISOString().split('T')[0]).length; }
  get affectedClassCount() {
    return this.data.teacherAbsences.reduce((sum, a) => sum + (a.affectedClasses?.length || 0), 0);
  }
  get pendingCount() { return this.data.teacherAbsences.filter(a => a.status === 'PENDING').length; }
  get approvedCount() { return this.data.teacherAbsences.filter(a => a.status === 'APPROVED').length; }

  openRecordAbsenceDialog() {
    this.absenceForm = { teacherId: null, date: '', reason: '', affectedClassesInput: '', notes: '' };
    this.showAbsenceDialog = true;
  }

  saveAbsence() {
    if (!this.absenceForm.teacherId || !this.absenceForm.date || !this.absenceForm.reason) return;
    this.saving = true;
    const payload = {
      teacherId: this.absenceForm.teacherId,
      date: this.absenceForm.date,
      reason: this.absenceForm.reason,
      affectedClasses: this.absenceForm.affectedClassesInput ? this.absenceForm.affectedClassesInput.split(',').map((s: string) => s.trim()) : [],
      notes: this.absenceForm.notes,
      status: 'PENDING' as const
    };
    this.workspaceService.createTeacherAbsence(payload)
      .pipe(finalize(() => { this.saving = false; this.showAbsenceDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Absence recorded' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  approveAbsence(absence: TeacherAbsenceModel) {
    this.confirmationService.confirm({
      message: `Approve replacement for ${absence.teacherName}?`,
      header: 'Approve',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.workspaceService.approveAbsence(Number(absence.absenceId))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Approved' }); this.dataChanged.emit(); } });
      }
    });
  }

  rejectAbsence(absence: TeacherAbsenceModel) {
    this.confirmationService.confirm({
      message: `Reject absence for ${absence.teacherName}?`,
      header: 'Reject',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.workspaceService.rejectAbsence(Number(absence.absenceId))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Rejected' }); this.dataChanged.emit(); } });
      }
    });
  }

  openOverrideDialog(absence: TeacherAbsenceModel) {
    this.overridingAbsence = absence;
    this.overrideTeacherId = null;
    this.showOverrideDialog = true;
  }

  confirmOverride() {
    if (!this.overridingAbsence || !this.overrideTeacherId) return;
    this.saving = true;
    this.workspaceService.overrideAbsence(Number(this.overridingAbsence.absenceId), Number(this.overrideTeacherId))
      .pipe(finalize(() => { this.saving = false; this.showOverrideDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Overridden' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  onSearch(event: any) {
    const table = (event.target as HTMLElement).closest('p-table') as any;
    if (table) table.filterGlobal(event.target.value, 'contains');
  }
}