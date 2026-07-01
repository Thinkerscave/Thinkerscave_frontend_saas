import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TreeModule } from 'primeng/tree';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicsWorkspaceData, AcademicsActionMode } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';
import { ACADEMICS_ACADEMIC_STAGES, ACADEMICS_SUBJECT_TYPES } from '../../../data/academics-workspace.config';

interface TreeNode {
  label: string;
  data: string;
  expandedIcon?: string;
  collapsedIcon?: string;
  icon?: string;
  children?: TreeNode[];
  type?: string;
  classId?: number | string;
  sectionId?: number | string;
  expanded?: boolean;
}

@Component({
  selector: 'app-academic-setup-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DialogModule, DropdownModule,
    TableModule, TreeModule, ToastModule, ConfirmDialogModule
  ],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class AcademicSetupPageComponent implements OnInit, OnChanges {
  private readonly workspaceService = inject(AcademicsWorkspaceService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() dataChanged = new EventEmitter<void>();
  @Output() yearChanged = new EventEmitter<number>();

  activeTab: 'classes' | 'subjects' | 'teachers' | 'shifts' = 'classes';
  saving = false;

  treeNodes: TreeNode[] = [];
  selectedTreeNode: any = null;
  selectedYearId: number | null = null;

  // Visibility flags
  showDialog = false;
  dialogTitle = '';
  dialogMode: 'class' | 'subject' | 'teacher' | 'year' | 'clone' | 'section' | 'shift' | 'template' = 'class';

  // Form models
  formModel: any = {};

  readonly academicStageOptions = ACADEMICS_ACADEMIC_STAGES.map(s => ({ label: s.replace(/_/g, ' '), value: s }));
  readonly subjectTypeOptions = ACADEMICS_SUBJECT_TYPES.map(s => ({ label: s.replace(/_/g, ' '), value: s }));
  readonly statusOptions = [{ label: 'Active', value: true }, { label: 'Inactive', value: false }];
  readonly booleanOptions = [{ label: 'Yes', value: true }, { label: 'No', value: false }];

  ngOnInit() {
    this.syncYearSelection();
    this.buildTree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.syncYearSelection();
      this.buildTree();
    }
  }

  private syncYearSelection(): void {
    if (this.data.currentYear) {
      this.selectedYearId = this.data.currentYear.academicYearId ?? this.data.currentYear.id ?? null;
    }
  }

  private currentYearId(): number | undefined {
    const id = this.selectedYearId ?? this.data.currentYear?.academicYearId ?? this.data.currentYear?.id;
    return id ? Number(id) : undefined;
  }

  get academicYearOptions() {
    return this.data.academicYears.map(y => ({
      label: y.yearCode || y.yearName || `Year ${y.academicYearId}`,
      value: y.academicYearId ?? y.id
    }));
  }

  get classOptions() { return this.data.classes.map(c => ({ label: c.className, value: c.classId })); }
  get sectionOptions() { return this.data.sections.map(s => ({ label: `${s.sectionName} (${s.classEntity?.className || ''})`, value: s.sectionId })); }
  get subjectOptions() { return this.data.subjects.map(s => ({ label: `${s.subjectName} (${s.subjectCode})`, value: s.subjectId })); }
  get teacherOptions() { return this.data.staff.map(t => ({ label: `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Staff #${t.staffId}`, value: t.staffId ?? t.id })); }
  get shiftOptions() { return this.data.shifts.map(s => ({ label: s.shiftName, value: s.shiftId })); }

  get sectionData() {
    return this.data.sections.map(s => ({
      ...s,
      classTeacher: this.data.classTeacherAssignments.find(a => Number(a.sectionId) === Number(s.sectionId))?.teacherName || 'Not assigned',
      studentCount: 0
    }));
  }

  buildTree() {
    const stageMap: Record<string, TreeNode> = {};
    for (const cls of this.data.classes) {
      const stage = cls.academicStage || 'OTHER';
      if (!stageMap[stage]) {
        stageMap[stage] = {
          label: stage.replace(/_/g, ' '), data: stage,
          expandedIcon: 'pi pi-folder-open', collapsedIcon: 'pi pi-folder',
          children: [], type: 'stage', expanded: true
        };
      }
      const classNode: TreeNode = {
        label: cls.className, data: cls.className,
        expandedIcon: 'pi pi-sitemap', collapsedIcon: 'pi pi-sitemap',
        children: [], type: 'class', classId: cls.classId, expanded: true
      };
      const sections = this.data.sections.filter(s => Number(s.classId) === Number(cls.classId));
      for (const sec of sections) {
        classNode.children!.push({
          label: sec.sectionName, data: sec.sectionName,
          icon: 'pi pi-th-large', type: 'section', sectionId: sec.sectionId
        });
      }
      stageMap[stage].children!.push(classNode);
    }
    this.treeNodes = Object.values(stageMap);
  }

  onTreeNodeSelect(event: any) {
    if (event.node.type === 'class') this.activeTab = 'classes';
  }

  onYearChange() {
    if (this.selectedYearId) this.yearChanged.emit(Number(this.selectedYearId));
  }

  // ─── Dialogs ───────────────────────────────────────────────────────
  openDialog(mode: string) {
    this.dialogMode = mode as any;
    this.formModel = {};
    this.dialogTitle = this.getDialogTitle(mode);
    this.showDialog = true;
  }

  private getDialogTitle(mode: string): string {
    const titles: Record<string, string> = {
      class: 'Add Class', subject: 'Add Subject', teacher: 'Assign Teacher',
      year: 'Create Academic Year', clone: 'Clone Academic Year',
      section: 'Add Section', shift: 'Create Shift', template: 'Create Period Template'
    };
    return titles[mode] || 'Form';
  }

  saveDialog() {
    const mode = this.dialogMode;
    switch (mode) {
      case 'class': this.saveClass(); break;
      case 'subject': this.saveSubject(); break;
      case 'teacher': this.saveAllocation(); break;
      case 'year': this.saveYear(); break;
      case 'clone': this.cloneYear(); break;
      case 'section': this.saveSection(); break;
      case 'shift': this.saveShift(); break;
      case 'template': this.saveTemplate(); break;
    }
  }

  confirmAction(message: string, header: string, callback: () => void) {
    this.confirmationService.confirm({ message, header, icon: 'pi pi-exclamation-triangle', accept: callback });
  }

  // ─── CRUD Operations ───────────────────────────────────────────────
  saveClass() {
    if (!this.formModel.className) return;
    const yearId = this.currentYearId();
    if (!yearId) {
      this.messageService.add({ severity: 'warn', summary: 'Select academic year' });
      return;
    }
    this.saving = true;
    this.workspaceService.createClass({ ...this.formModel, academicYearId: yearId }, yearId)
      .pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Class created' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  saveSection() {
    if (!this.formModel.classId || !this.formModel.sectionName) return;
    this.saving = true;
    this.workspaceService.createSection(this.formModel)
      .pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Section created' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  deactivateSection(section: any) {
    this.confirmAction(`Deactivate section "${section.sectionName}"?`, 'Confirm', () => {
      this.workspaceService.deactivateSection(Number(section.sectionId))
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Deactivated' }); this.dataChanged.emit(); } });
    });
  }

  saveSubject() {
    if (!this.formModel.subjectCode || !this.formModel.subjectName) return;
    this.saving = true;
    this.workspaceService.createSubject(this.formModel)
      .pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Subject added' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  deactivateSubject(subject: any) {
    this.confirmAction(`Deactivate subject "${subject.subjectName}"?`, 'Confirm', () => {
      this.workspaceService.deactivateSubject(Number(subject.subjectId))
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Deactivated' }); this.dataChanged.emit(); } });
    });
  }

  saveAllocation() {
    if (!this.formModel.classId || !this.formModel.subjectId || !this.formModel.teacherId) return;
    const yearId = this.currentYearId();
    if (!yearId) return;
    this.saving = true;
    this.workspaceService.allocateTeacher({ ...this.formModel, academicYearId: yearId, periodsPerWeek: this.formModel.periodsPerWeek ?? 5 })
      .pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Teacher assigned' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  editAllocation(allocation: any) {
    this.formModel = { ...allocation };
    this.dialogMode = 'teacher';
    this.dialogTitle = 'Reassign Teacher';
    this.showDialog = true;
  }

  removeAllocation(allocation: any) {
    this.confirmAction(`Remove assignment for "${allocation.subjectName}"?`, 'Confirm', () => {
      this.workspaceService.removeAllocation(Number(allocation.allocationId))
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Removed' }); this.dataChanged.emit(); } });
    });
  }

  saveYear() {
    if (!this.formModel.yearCode || !this.formModel.startDate || !this.formModel.endDate) return;
    this.saving = true;
    this.workspaceService.createAcademicYear(this.formModel)
      .pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Year created' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  cloneYear() {
    if (!this.formModel.sourceYearId || !this.formModel.newYearCode) return;
    this.saving = true;
    this.workspaceService.cloneAcademicYear(this.formModel.sourceYearId, this.formModel.newYearCode)
      .pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Year cloned' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  saveShift() {
    if (!this.formModel.shiftName) return;
    const yearId = this.currentYearId();
    if (!yearId) return;
    this.saving = true;
    this.workspaceService.createShift(yearId, this.formModel)
      .pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Shift created' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  saveTemplate() {
    if (!this.formModel.templateName || !this.formModel.shiftId) return;
    this.saving = true;
    this.workspaceService.createPeriodTemplate(Number(this.formModel.shiftId), this.formModel)
      .pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Template created' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  getTemplatesForShift(shiftId?: number) {
    return this.data.periodTemplates.filter(t => t.shiftId === shiftId);
  }

  onSearch(event: any, table: any) {
    if (table) table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
}