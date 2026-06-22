import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TreeModule } from 'primeng/tree';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicsActionMode, AcademicsWorkspaceData, AcademicClass, AcademicSection, SubjectModel, TeacherAllocationModel, ShiftModel, PeriodTemplateModel, AcademicYear } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';
import { ACADEMICS_ACADEMIC_STAGES, ACADEMICS_SUBJECT_TYPES } from '../../../data/academics-workspace.config';
import { finalize } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
}

@Component({
  selector: 'app-academic-setup-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    DropdownModule,
    TableModule,
    TreeModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="academic-setup-page">
      <!-- Header with Academic Year Controls -->
      <div class="setup-header">
        <div class="setup-header-left">
          <div class="setup-eyebrow">Academic Setup</div>
          <h1 class="setup-title">Configure School Structure</h1>
        </div>
        <div class="setup-header-right">
          <div class="setup-year-controls">
            <p-dropdown
              [options]="academicYearOptions"
              [(ngModel)]="selectedYearId"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Academic Year"
              (onChange)="onYearChange()"
              styleClass="setup-year-dropdown">
            </p-dropdown>
            <button class="setup-btn setup-btn-outline" (click)="openCloneYearDialog()">
              <i class="pi pi-copy"></i> Clone Year
            </button>
            <button class="setup-btn setup-btn-primary" (click)="openCreateYearDialog()">
              <i class="pi pi-plus"></i> Start New Year
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content: Tree + Tabs -->
      <div class="setup-content">
        <!-- Left Panel: Academic Structure Tree -->
        <div class="setup-tree-panel">
          <div class="setup-panel-header">
            <i class="pi pi-sitemap"></i>
            <span>Academic Structure</span>
          </div>
          <div class="setup-tree-container">
            <p-tree [value]="treeNodes" selectionMode="single" [(selection)]="selectedTreeNode"
              (onNodeSelect)="onTreeNodeSelect($event)"
              styleClass="setup-tree">
            </p-tree>
          </div>
        </div>

        <!-- Right Panel: Tabbed Configuration -->
        <div class="setup-tab-panel">
          <div class="setup-tabs">
            <button class="setup-tab" [class.active]="activeTab === 'classes'" (click)="activeTab = 'classes'">
              <i class="pi pi-th-large"></i> Classes & Sections
            </button>
            <button class="setup-tab" [class.active]="activeTab === 'subjects'" (click)="activeTab = 'subjects'">
              <i class="pi pi-book"></i> Subjects
            </button>
            <button class="setup-tab" [class.active]="activeTab === 'teachers'" (click)="activeTab = 'teachers'">
              <i class="pi pi-users"></i> Teacher Assignment
            </button>
            <button class="setup-tab" [class.active]="activeTab === 'shifts'" (click)="activeTab = 'shifts'">
              <i class="pi pi-clock"></i> Shift & Templates
            </button>
          </div>

          <div class="setup-tab-content">
            <!-- Classes & Sections Tab -->
            <div class="setup-tab-pane" *ngIf="activeTab === 'classes'">
              <div class="setup-tab-actions">
                <button class="setup-btn setup-btn-primary" (click)="openAddClassDialog()">
                  <i class="pi pi-plus"></i> Add Class
                </button>
                <button class="setup-btn setup-btn-outline" (click)="openAddSectionDialog()">
                  <i class="pi pi-plus"></i> Add Section
                </button>
              </div>
              <p-table [value]="sectionData" [paginator]="true" [rows]="10"
                [globalFilterFields]="['sectionName', 'classEntity.className', 'classTeacher', 'capacity']"
                styleClass="setup-table">
                <ng-template pTemplate="caption">
                  <div class="setup-table-header">
                    <span class="setup-table-title">Sections Overview</span>
                    <input pInputText type="text" (input)="onSectionSearch($event)" placeholder="Search sections..." class="setup-search-input">
                  </div>
                </ng-template>
                <ng-template pTemplate="header">
                  <tr>
                    <th>Section</th>
                    <th>Class</th>
                    <th>Capacity</th>
                    <th>Class Teacher</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-section>
                  <tr>
                    <td><strong>{{ section.sectionName }}</strong></td>
                    <td>{{ section.classEntity?.className || 'N/A' }}</td>
                    <td>{{ section.capacity || 'N/A' }}</td>
                    <td>{{ section.classTeacher || 'Not assigned' }}</td>
                    <td>{{ section.studentCount || 0 }}</td>
                    <td><span class="setup-status-badge" [class.active]="section.isActive !== false">Active</span></td>
                    <td>
                      <div class="setup-action-btns">
                        <button class="setup-icon-btn" pTooltip="Edit" (click)="openEditSectionDialog(section)">
                          <i class="pi pi-pencil"></i>
                        </button>
                        <button class="setup-icon-btn" pTooltip="Deactivate" (click)="confirmDeactivateSection(section)">
                          <i class="pi pi-ban"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="7" class="setup-empty">
                      <i class="pi pi-sitemap"></i>
                      <p>No sections configured yet. Add a class or section to get started.</p>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>

            <!-- Subjects Tab -->
            <div class="setup-tab-pane" *ngIf="activeTab === 'subjects'">
              <div class="setup-tab-actions">
                <button class="setup-btn setup-btn-primary" (click)="openAddSubjectDialog()">
                  <i class="pi pi-plus"></i> Add Subject
                </button>
              </div>
              <p-table [value]="data.subjects" [paginator]="true" [rows]="10"
                [globalFilterFields]="['subjectCode', 'subjectName', 'subjectType', 'weeklyPeriods']"
                styleClass="setup-table">
                <ng-template pTemplate="caption">
                  <div class="setup-table-header">
                    <span class="setup-table-title">Subject Library</span>
                    <input pInputText type="text" (input)="onSubjectSearch($event)" placeholder="Search subjects..." class="setup-search-input">
                  </div>
                </ng-template>
                <ng-template pTemplate="header">
                  <tr>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Type</th>
                    <th>Weekly Periods</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-subject>
                  <tr>
                    <td><span class="setup-code-badge">{{ subject.subjectCode }}</span></td>
                    <td><strong>{{ subject.subjectName }}</strong></td>
                    <td>{{ subject.subjectType || subject.category || 'CORE' }}</td>
                    <td>{{ subject.weeklyPeriods || subject.credits || 0 }}</td>
                    <td><span class="setup-status-badge" [class.active]="subject.isActive !== false">Active</span></td>
                    <td>
                      <div class="setup-action-btns">
                        <button class="setup-icon-btn" pTooltip="Edit" (click)="openEditSubjectDialog(subject)">
                          <i class="pi pi-pencil"></i>
                        </button>
                        <button class="setup-icon-btn" pTooltip="Deactivate" (click)="confirmDeactivateSubject(subject)">
                          <i class="pi pi-ban"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="6" class="setup-empty">
                      <i class="pi pi-book"></i>
                      <p>No subjects added yet. Add subjects to build your curriculum.</p>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>

            <!-- Teacher Assignment Tab -->
            <div class="setup-tab-pane" *ngIf="activeTab === 'teachers'">
              <div class="setup-tab-actions">
                <button class="setup-btn setup-btn-primary" (click)="openAssignTeacherDialog()">
                  <i class="pi pi-user-plus"></i> Assign Teacher
                </button>
              </div>
              <p-table [value]="data.teacherAllocations" [paginator]="true" [rows]="10"
                [globalFilterFields]="['subjectName', 'primaryTeacherName', 'secondaryTeacherName', 'className', 'sectionName']"
                styleClass="setup-table">
                <ng-template pTemplate="caption">
                  <div class="setup-table-header">
                    <span class="setup-table-title">Teacher Assignments</span>
                    <input pInputText type="text" (input)="onTeacherSearch($event)" placeholder="Search assignments..." class="setup-search-input">
                  </div>
                </ng-template>
                <ng-template pTemplate="header">
                  <tr>
                    <th>Subject</th>
                    <th>Primary Teacher</th>
                    <th>Secondary Teacher</th>
                    <th>Class</th>
                    <th>Weekly Load</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-allocation>
                  <tr>
                    <td><strong>{{ allocation.subjectName }}</strong></td>
                    <td>{{ allocation.primaryTeacherName || allocation.teacherName || 'Not assigned' }}</td>
                    <td>{{ allocation.secondaryTeacherName || '—' }}</td>
                    <td>{{ allocation.className }} {{ allocation.sectionName || '' }}</td>
                    <td>{{ allocation.periodsPerWeek || allocation.weeklyLoad || 0 }} periods</td>
                    <td>
                      <div class="setup-action-btns">
                        <button class="setup-icon-btn" pTooltip="Reassign" (click)="openReassignTeacherDialog(allocation)">
                          <i class="pi pi-refresh"></i>
                        </button>
                        <button class="setup-icon-btn" pTooltip="Remove" (click)="confirmRemoveAllocation(allocation)">
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="6" class="setup-empty">
                      <i class="pi pi-users"></i>
                      <p>No teacher assignments yet. Assign teachers to subjects and classes.</p>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>

            <!-- Shift & Templates Tab -->
            <div class="setup-tab-pane" *ngIf="activeTab === 'shifts'">
              <div class="setup-tab-actions">
                <button class="setup-btn setup-btn-primary" (click)="openCreateShiftDialog()">
                  <i class="pi pi-plus"></i> Create Shift
                </button>
                <button class="setup-btn setup-btn-outline" (click)="openCreateTemplateDialog()">
                  <i class="pi pi-plus"></i> Create Template
                </button>
              </div>
              <div class="setup-shifts-grid">
                <div class="setup-shift-card" *ngFor="let shift of data.shifts">
                  <div class="setup-shift-card-header">
                    <i class="pi pi-clock"></i>
                    <h3>{{ shift.shiftName }}</h3>
                    <span class="setup-shift-timing">{{ shift.startTime }} - {{ shift.endTime }}</span>
                  </div>
                  <div class="setup-shift-card-body">
                    <div class="setup-shift-stat">
                      <span>Total Periods</span>
                      <strong>{{ shift.totalPeriods }}</strong>
                    </div>
                    <div class="setup-shift-templates">
                      <div class="setup-template-item" *ngFor="let template of getTemplatesForShift(shift.shiftId)">
                        <span class="setup-template-period">P{{ template.periodNumber }}</span>
                        <span>{{ template.startTime }} - {{ template.endTime }}</span>
                        <span class="setup-template-break" *ngIf="template.isBreak">Break</span>
                      </div>
                    </div>
                  </div>
                  <div class="setup-shift-card-actions">
                    <button class="setup-icon-btn" pTooltip="Edit Template" (click)="openEditTemplateDialog(shift)">
                      <i class="pi pi-pencil"></i>
                    </button>
                  </div>
                </div>
                <div class="setup-shift-card setup-shift-card-empty" *ngIf="!data.shifts.length">
                  <i class="pi pi-plus-circle"></i>
                  <p>No shifts configured. Create your first shift to define period templates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <p-dialog header="Add Class" [(visible)]="showAddClassDialog" [modal]="true" [style]="{width: '900px'}" [draggable]="false" [resizable]="false">
      <div class="setup-dialog-form">
        <div class="setup-form-row">
          <label>Class Code <span class="required">*</span></label>
          <input pInputText [(ngModel)]="classForm.className" placeholder="e.g., Class 1" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Class Name <span class="required">*</span></label>
          <input pInputText [(ngModel)]="classForm.className" placeholder="e.g., Class 1" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Academic Stage</label>
          <p-dropdown [options]="academicStageOptions" [(ngModel)]="classForm.academicStage" placeholder="Select Stage" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
        <div class="setup-form-row">
          <label>Display Order</label>
          <input pInputText type="number" [(ngModel)]="classForm.displayOrder" placeholder="e.g., 1" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Status</label>
          <p-dropdown [options]="statusOptions" [(ngModel)]="classForm.isActive" placeholder="Select Status" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="setup-btn setup-btn-ghost" (click)="showAddClassDialog = false">Cancel</button>
        <button class="setup-btn setup-btn-primary" (click)="saveClass()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-dialog header="Add Subject" [(visible)]="showAddSubjectDialog" [modal]="true" [style]="{width: '1000px'}" [draggable]="false" [resizable]="false">
      <div class="setup-dialog-form">
        <div class="setup-form-row">
          <label>Subject Code <span class="required">*</span></label>
          <input pInputText [(ngModel)]="subjectForm.subjectCode" placeholder="e.g., MATH01" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Subject Name <span class="required">*</span></label>
          <input pInputText [(ngModel)]="subjectForm.subjectName" placeholder="e.g., Mathematics" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Subject Type</label>
          <p-dropdown [options]="subjectTypeOptions" [(ngModel)]="subjectForm.subjectType" placeholder="Select Type" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
        <div class="setup-form-row">
          <label>Applicable Levels</label>
          <input pInputText [(ngModel)]="subjectForm.applicableLevels" placeholder="e.g., PRIMARY,MIDDLE" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Weekly Periods</label>
          <input pInputText type="number" [(ngModel)]="subjectForm.weeklyPeriods" placeholder="e.g., 5" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Status</label>
          <p-dropdown [options]="statusOptions" [(ngModel)]="subjectForm.isActive" placeholder="Select Status" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="setup-btn setup-btn-ghost" (click)="showAddSubjectDialog = false">Cancel</button>
        <button class="setup-btn setup-btn-primary" (click)="saveSubject()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-dialog header="Assign Teacher" [(visible)]="showAssignTeacherDialog" [modal]="true" [style]="{width: '900px'}" [draggable]="false" [resizable]="false">
      <div class="setup-dialog-form">
        <div class="setup-form-row">
          <label>Class <span class="required">*</span></label>
          <p-dropdown [options]="classOptions" [(ngModel)]="allocationForm.classId" optionLabel="label" optionValue="value" placeholder="Select Class" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
        <div class="setup-form-row">
          <label>Section</label>
          <p-dropdown [options]="sectionOptions" [(ngModel)]="allocationForm.sectionId" optionLabel="label" optionValue="value" placeholder="Select Section" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
        <div class="setup-form-row">
          <label>Subject <span class="required">*</span></label>
          <p-dropdown [options]="subjectOptions" [(ngModel)]="allocationForm.subjectId" optionLabel="label" optionValue="value" placeholder="Select Subject" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
        <div class="setup-form-row">
          <label>Teacher <span class="required">*</span></label>
          <p-dropdown [options]="teacherOptions" [(ngModel)]="allocationForm.teacherId" optionLabel="label" optionValue="value" placeholder="Select Teacher" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
        <div class="setup-form-row">
          <label>Weekly Periods</label>
          <input pInputText type="number" [(ngModel)]="allocationForm.periodsPerWeek" placeholder="e.g., 5" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Effective From</label>
          <input pInputText type="date" [(ngModel)]="allocationForm.effectiveFrom" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Effective To</label>
          <input pInputText type="date" [(ngModel)]="allocationForm.effectiveTo" class="setup-form-input">
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="setup-btn setup-btn-ghost" (click)="showAssignTeacherDialog = false">Cancel</button>
        <button class="setup-btn setup-btn-primary" (click)="saveAllocation()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-dialog header="Create Academic Year" [(visible)]="showCreateYearDialog" [modal]="true" [style]="{width: '700px'}" [draggable]="false" [resizable]="false">
      <div class="setup-dialog-form">
        <div class="setup-form-row">
          <label>Year Code <span class="required">*</span></label>
          <input pInputText [(ngModel)]="yearForm.yearCode" placeholder="e.g., 2025-26" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Year Name</label>
          <input pInputText [(ngModel)]="yearForm.yearName" placeholder="e.g., Academic Year 2025-26" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Start Date <span class="required">*</span></label>
          <input pInputText type="date" [(ngModel)]="yearForm.startDate" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>End Date <span class="required">*</span></label>
          <input pInputText type="date" [(ngModel)]="yearForm.endDate" class="setup-form-input">
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="setup-btn setup-btn-ghost" (click)="showCreateYearDialog = false">Cancel</button>
        <button class="setup-btn setup-btn-primary" (click)="saveYear()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-dialog header="Clone Academic Year" [(visible)]="showCloneYearDialog" [modal]="true" [style]="{width: '700px'}" [draggable]="false" [resizable]="false">
      <div class="setup-dialog-form">
        <div class="setup-form-row">
          <label>Source Year</label>
          <p-dropdown [options]="academicYearOptions" [(ngModel)]="cloneForm.sourceYearId" optionLabel="label" optionValue="value" placeholder="Select Source Year" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
        <div class="setup-form-row">
          <label>New Year Code <span class="required">*</span></label>
          <input pInputText [(ngModel)]="cloneForm.newYearCode" placeholder="e.g., 2026-27" class="setup-form-input">
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="setup-btn setup-btn-ghost" (click)="showCloneYearDialog = false">Cancel</button>
        <button class="setup-btn setup-btn-primary" (click)="cloneYear()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Cloning...' : 'Clone' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-dialog header="Add Section" [(visible)]="showAddSectionDialog" [modal]="true" [style]="{width: '700px'}" [draggable]="false" [resizable]="false">
      <div class="setup-dialog-form">
        <div class="setup-form-row">
          <label>Class <span class="required">*</span></label>
          <p-dropdown [options]="classOptions" [(ngModel)]="sectionForm.classId" optionLabel="label" optionValue="value" placeholder="Select Class" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
        <div class="setup-form-row">
          <label>Section Name <span class="required">*</span></label>
          <input pInputText [(ngModel)]="sectionForm.sectionName" placeholder="e.g., A" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Capacity</label>
          <input pInputText type="number" [(ngModel)]="sectionForm.capacity" placeholder="e.g., 40" class="setup-form-input">
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="setup-btn setup-btn-ghost" (click)="showAddSectionDialog = false">Cancel</button>
        <button class="setup-btn setup-btn-primary" (click)="saveSection()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-dialog header="Create Shift" [(visible)]="showCreateShiftDialog" [modal]="true" [style]="{width: '700px'}" [draggable]="false" [resizable]="false">
      <div class="setup-dialog-form">
        <div class="setup-form-row">
          <label>Shift Name <span class="required">*</span></label>
          <input pInputText [(ngModel)]="shiftForm.shiftName" placeholder="e.g., Morning Shift" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Start Time <span class="required">*</span></label>
          <input pInputText type="time" [(ngModel)]="shiftForm.startTime" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>End Time <span class="required">*</span></label>
          <input pInputText type="time" [(ngModel)]="shiftForm.endTime" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Total Periods</label>
          <input pInputText type="number" [(ngModel)]="shiftForm.totalPeriods" placeholder="e.g., 8" class="setup-form-input">
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="setup-btn setup-btn-ghost" (click)="showCreateShiftDialog = false">Cancel</button>
        <button class="setup-btn setup-btn-primary" (click)="saveShift()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-dialog header="Create Period Template" [(visible)]="showCreateTemplateDialog" [modal]="true" [style]="{width: '700px'}" [draggable]="false" [resizable]="false">
      <div class="setup-dialog-form">
        <div class="setup-form-row">
          <label>Template Name <span class="required">*</span></label>
          <input pInputText [(ngModel)]="templateForm.templateName" placeholder="e.g., Regular Period" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Shift</label>
          <p-dropdown [options]="shiftOptions" [(ngModel)]="templateForm.shiftId" optionLabel="label" optionValue="value" placeholder="Select Shift" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
        <div class="setup-form-row">
          <label>Period Number</label>
          <input pInputText type="number" [(ngModel)]="templateForm.periodNumber" placeholder="e.g., 1" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Start Time</label>
          <input pInputText type="time" [(ngModel)]="templateForm.startTime" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>End Time</label>
          <input pInputText type="time" [(ngModel)]="templateForm.endTime" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Duration (minutes)</label>
          <input pInputText type="number" [(ngModel)]="templateForm.durationMinutes" placeholder="e.g., 45" class="setup-form-input">
        </div>
        <div class="setup-form-row">
          <label>Is Break</label>
          <p-dropdown [options]="booleanOptions" [(ngModel)]="templateForm.isBreak" placeholder="Select" styleClass="setup-form-dropdown"></p-dropdown>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="setup-btn setup-btn-ghost" (click)="showCreateTemplateDialog = false">Cancel</button>
        <button class="setup-btn setup-btn-primary" (click)="saveTemplate()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-confirmDialog [style]="{width: '500px'}"></p-confirmDialog>
    <p-toast position="top-right"></p-toast>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .academic-setup-page { display: flex; flex-direction: column; gap: 1.25rem; height: 100%; padding: 0.25rem; }
    .setup-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .setup-header-left { }
    .setup-eyebrow { font-size: 0.8rem; color: var(--tc-text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .setup-title { font-size: 1.5rem; font-weight: 700; color: var(--tc-heading); margin: 0.25rem 0 0; }
    .setup-header-right { display: flex; align-items: center; gap: 0.75rem; }
    .setup-year-controls { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .setup-year-dropdown { min-width: 160px; }
    .setup-content { display: grid; grid-template-columns: 280px 1fr; gap: 1rem; flex: 1; min-height: 0; }
    .setup-tree-panel { background: var(--tc-surface-card); border: 1px solid var(--tc-border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .setup-panel-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1rem; border-bottom: 1px solid var(--tc-border); font-weight: 600; color: var(--tc-heading); font-size: 0.9rem; }
    .setup-panel-header i { color: var(--tc-primary-600); }
    .setup-tree-container { flex: 1; overflow: auto; padding: 0.5rem; }
    .setup-tree { width: 100%; }
    .setup-tab-panel { background: var(--tc-surface-card); border: 1px solid var(--tc-border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .setup-tabs { display: flex; border-bottom: 1px solid var(--tc-border); overflow-x: auto; }
    .setup-tab { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border: none; background: transparent; color: var(--tc-text-muted); font-size: 0.85rem; font-weight: 500; cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .setup-tab:hover { color: var(--tc-heading); background: var(--tc-bg-muted); }
    .setup-tab.active { color: var(--tc-primary-600); border-bottom-color: var(--tc-primary-600); }
    .setup-tab-content { flex: 1; overflow: auto; padding: 1rem; }
    .setup-tab-pane { }
    .setup-tab-actions { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .setup-table { width: 100%; }
    .setup-table-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.5rem 0; }
    .setup-table-title { font-weight: 600; color: var(--tc-heading); }
    .setup-search-input { padding: 0.5rem 0.75rem; border: 1px solid var(--tc-border); border-radius: 8px; background: var(--tc-bg); color: var(--tc-text); min-width: 240px; }
    .setup-search-input:focus { outline: none; border-color: var(--tc-primary-600); }
    .setup-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
    .setup-btn-primary { background: var(--tc-primary-600); color: #fff; border-color: var(--tc-primary-600); }
    .setup-btn-primary:hover { opacity: 0.9; }
    .setup-btn-outline { background: transparent; color: var(--tc-text); border-color: var(--tc-border); }
    .setup-btn-outline:hover { background: var(--tc-bg-muted); }
    .setup-btn-ghost { background: transparent; color: var(--tc-text-muted); border-color: transparent; }
    .setup-btn-ghost:hover { background: var(--tc-bg-muted); }
    .setup-icon-btn { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--tc-border); background: transparent; color: var(--tc-text-muted); cursor: pointer; transition: all 0.2s; }
    .setup-icon-btn:hover { background: var(--tc-bg-muted); color: var(--tc-heading); }
    .setup-action-btns { display: flex; gap: 0.35rem; }
    .setup-status-badge { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; background: var(--tc-bg-muted); color: var(--tc-text-muted); }
    .setup-status-badge.active { background: rgba(16, 185, 129, 0.12); color: #10B981; }
    .setup-code-badge { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; background: var(--tc-bg-muted); color: var(--tc-primary-600); font-family: monospace; }
    .setup-empty { text-align: center; padding: 3rem 1rem; color: var(--tc-text-muted); }
    .setup-empty i { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; opacity: 0.5; }
    .setup-empty p { margin: 0; }
    .setup-dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .setup-form-row { display: flex; flex-direction: column; gap: 0.35rem; }
    .setup-form-row label { font-size: 0.85rem; font-weight: 500; color: var(--tc-text); }
    .required { color: #EF4444; }
    .setup-form-input { padding: 0.6rem 0.75rem; border: 1px solid var(--tc-border); border-radius: 8px; background: var(--tc-bg); color: var(--tc-text); }
    .setup-form-input:focus { outline: none; border-color: var(--tc-primary-600); }
    .setup-form-dropdown { width: 100%; }
    .setup-shifts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
    .setup-shift-card { background: var(--tc-bg); border: 1px solid var(--tc-border); border-radius: 12px; padding: 1rem; }
    .setup-shift-card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .setup-shift-card-header i { font-size: 1.25rem; color: var(--tc-primary-600); }
    .setup-shift-card-header h3 { margin: 0; font-size: 1rem; font-weight: 600; }
    .setup-shift-timing { margin-left: auto; font-size: 0.8rem; color: var(--tc-text-muted); }
    .setup-shift-card-body { }
    .setup-shift-stat { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--tc-border); margin-bottom: 0.5rem; }
    .setup-shift-stat span { font-size: 0.85rem; color: var(--tc-text-muted); }
    .setup-shift-stat strong { font-size: 1.1rem; }
    .setup-shift-templates { display: flex; flex-direction: column; gap: 0.35rem; }
    .setup-template-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 6px; background: var(--tc-surface-card); font-size: 0.8rem; }
    .setup-template-period { font-weight: 600; color: var(--tc-primary-600); min-width: 24px; }
    .setup-template-break { margin-left: auto; font-size: 0.7rem; color: #F59E0B; font-weight: 600; }
    .setup-shift-card-actions { display: flex; justify-content: flex-end; margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--tc-border); }
    .setup-shift-card-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 3rem 1rem; color: var(--tc-text-muted); }
    .setup-shift-card-empty i { font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5; }
    @media (max-width: 1024px) { .setup-content { grid-template-columns: 1fr; } }
  `]
})
export class AcademicSetupPageComponent implements OnInit {
  private readonly workspaceService = inject(AcademicsWorkspaceService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();
  @Output() dataChanged = new EventEmitter<void>();

  activeTab: 'classes' | 'subjects' | 'teachers' | 'shifts' = 'classes';
  saving = false;

  // Tree
  treeNodes: TreeNode[] = [];
  selectedTreeNode: any = null;
  selectedYearId: number | null = null;

  // Dialog visibility
  showAddClassDialog = false;
  showAddSubjectDialog = false;
  showAssignTeacherDialog = false;
  showCreateYearDialog = false;
  showCloneYearDialog = false;
  showAddSectionDialog = false;
  showCreateShiftDialog = false;
  showCreateTemplateDialog = false;

  // Forms
  classForm: any = { className: '', academicStage: null, displayOrder: null, isActive: true };
  subjectForm: any = { subjectCode: '', subjectName: '', subjectType: null, applicableLevels: '', weeklyPeriods: null, isActive: true };
  allocationForm: any = { classId: null, sectionId: null, subjectId: null, teacherId: null, periodsPerWeek: null, effectiveFrom: '', effectiveTo: '' };
  yearForm: any = { yearCode: '', yearName: '', startDate: '', endDate: '' };
  cloneForm: any = { sourceYearId: null, newYearCode: '' };
  sectionForm: any = { classId: null, sectionName: '', capacity: null };
  shiftForm: any = { shiftName: '', startTime: '', endTime: '', totalPeriods: null };
  templateForm: any = { templateName: '', shiftId: null, periodNumber: null, startTime: '', endTime: '', durationMinutes: null, isBreak: null };

  // Options
  academicStageOptions = ACADEMICS_ACADEMIC_STAGES.map(s => ({ label: s.replace(/_/g, ' '), value: s }));
  subjectTypeOptions = ACADEMICS_SUBJECT_TYPES.map(s => ({ label: s.replace(/_/g, ' '), value: s }));
  statusOptions = [{ label: 'Active', value: true }, { label: 'Inactive', value: false }];
  booleanOptions = [{ label: 'Yes', value: true }, { label: 'No', value: false }];

  ngOnInit() {
    this.buildTree();
    if (this.data.currentYear) {
      this.selectedYearId = this.data.currentYear.academicYearId ?? this.data.currentYear.id ?? null;
    }
  }

  get academicYearOptions() {
    return this.data.academicYears.map(y => ({
      label: y.yearCode || y.yearName || `Year ${y.academicYearId}`,
      value: y.academicYearId ?? y.id
    }));
  }

  get classOptions() {
    return this.data.classes.map(c => ({ label: c.className, value: c.classId }));
  }

  get sectionOptions() {
    return this.data.sections.map(s => ({ label: `${s.sectionName} (${s.classEntity?.className || ''})`, value: s.sectionId }));
  }

  get subjectOptions() {
    return this.data.subjects.map(s => ({ label: `${s.subjectName} (${s.subjectCode})`, value: s.subjectId }));
  }

  get teacherOptions() {
    return this.data.staff.map(t => ({
      label: `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Staff #${t.staffId}`,
      value: t.staffId ?? t.id
    }));
  }

  get shiftOptions() {
    return this.data.shifts.map(s => ({ label: s.shiftName, value: s.shiftId }));
  }

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
        stageMap[stage] = { label: stage.replace(/_/g, ' '), data: stage, expandedIcon: 'pi pi-folder-open', collapsedIcon: 'pi pi-folder', children: [], type: 'stage' };
      }
      const classNode: TreeNode = {
        label: cls.className,
        data: cls.className,
        expandedIcon: 'pi pi-sitemap',
        collapsedIcon: 'pi pi-sitemap',
        children: [],
        type: 'class',
        classId: cls.classId
      };
      const sections = this.data.sections.filter(s => Number(s.classId) === Number(cls.classId));
      for (const sec of sections) {
        classNode.children!.push({
          label: `${sec.sectionName}`,
          data: sec.sectionName,
          icon: 'pi pi-th-large',
          type: 'section',
          sectionId: sec.sectionId
        });
      }
      stageMap[stage].children!.push(classNode);
    }
    this.treeNodes = Object.values(stageMap);
  }

  onTreeNodeSelect(event: any) {
    const node = event.node;
    if (node.type === 'class') {
      this.activeTab = 'classes';
    }
  }

  onYearChange() {
    this.dataChanged.emit();
  }

  // ─── Class ─────────────────────────────────────────────────────────
  openAddClassDialog() {
    this.classForm = { className: '', academicStage: null, displayOrder: null, isActive: true };
    this.showAddClassDialog = true;
  }

  saveClass() {
    if (!this.classForm.className) return;
    this.saving = true;
    this.workspaceService.createClass(this.classForm)
      .pipe(finalize(() => { this.saving = false; this.showAddClassDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Class created', detail: 'Class has been created successfully.' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Could not create class.' }) });
  }

  // ─── Section ───────────────────────────────────────────────────────
  openAddSectionDialog() {
    this.sectionForm = { classId: null, sectionName: '', capacity: null };
    this.showAddSectionDialog = true;
  }

  saveSection() {
    if (!this.sectionForm.classId || !this.sectionForm.sectionName) return;
    this.saving = true;
    this.workspaceService.createSection(this.sectionForm)
      .pipe(finalize(() => { this.saving = false; this.showAddSectionDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Section created' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  openEditSectionDialog(section: any) {
    this.messageService.add({ severity: 'info', summary: 'Edit', detail: `Edit section: ${section.sectionName}` });
  }

  confirmDeactivateSection(section: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to deactivate section "${section.sectionName}"?`,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.workspaceService.deactivateSection(Number(section.sectionId))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Deactivated' }); this.dataChanged.emit(); } });
      }
    });
  }

  // ─── Subject ───────────────────────────────────────────────────────
  openAddSubjectDialog() {
    this.subjectForm = { subjectCode: '', subjectName: '', subjectType: null, applicableLevels: '', weeklyPeriods: null, isActive: true };
    this.showAddSubjectDialog = true;
  }

  saveSubject() {
    if (!this.subjectForm.subjectCode || !this.subjectForm.subjectName) return;
    this.saving = true;
    this.workspaceService.createSubject(this.subjectForm)
      .pipe(finalize(() => { this.saving = false; this.showAddSubjectDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Subject added' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  openEditSubjectDialog(subject: any) {
    this.messageService.add({ severity: 'info', summary: 'Edit', detail: `Edit subject: ${subject.subjectName}` });
  }

  confirmDeactivateSubject(subject: any) {
    this.confirmationService.confirm({
      message: `Deactivate subject "${subject.subjectName}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.workspaceService.deactivateSubject(Number(subject.subjectId))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Deactivated' }); this.dataChanged.emit(); } });
      }
    });
  }

  // ─── Teacher Allocation ────────────────────────────────────────────
  openAssignTeacherDialog() {
    this.allocationForm = { classId: null, sectionId: null, subjectId: null, teacherId: null, periodsPerWeek: null, effectiveFrom: '', effectiveTo: '' };
    this.showAssignTeacherDialog = true;
  }

  saveAllocation() {
    if (!this.allocationForm.classId || !this.allocationForm.subjectId || !this.allocationForm.teacherId) return;
    this.saving = true;
    this.workspaceService.allocateTeacher(this.allocationForm)
      .pipe(finalize(() => { this.saving = false; this.showAssignTeacherDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Teacher assigned' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  openReassignTeacherDialog(allocation: any) {
    this.allocationForm = { ...allocation };
    this.showAssignTeacherDialog = true;
  }

  confirmRemoveAllocation(allocation: any) {
    this.confirmationService.confirm({
      message: `Remove teacher assignment for "${allocation.subjectName}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.workspaceService.removeAllocation(Number(allocation.allocationId))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Removed' }); this.dataChanged.emit(); } });
      }
    });
  }

  // ─── Year ──────────────────────────────────────────────────────────
  openCreateYearDialog() {
    this.yearForm = { yearCode: '', yearName: '', startDate: '', endDate: '' };
    this.showCreateYearDialog = true;
  }

  saveYear() {
    if (!this.yearForm.yearCode || !this.yearForm.startDate || !this.yearForm.endDate) return;
    this.saving = true;
    this.workspaceService.createAcademicYear(this.yearForm)
      .pipe(finalize(() => { this.saving = false; this.showCreateYearDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Year created' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  openCloneYearDialog() {
    this.cloneForm = { sourceYearId: null, newYearCode: '' };
    this.showCloneYearDialog = true;
  }

  cloneYear() {
    if (!this.cloneForm.sourceYearId || !this.cloneForm.newYearCode) return;
    this.saving = true;
    this.workspaceService.cloneAcademicYear(this.cloneForm.sourceYearId, this.cloneForm.newYearCode)
      .pipe(finalize(() => { this.saving = false; this.showCloneYearDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Year cloned' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  // ─── Shift ─────────────────────────────────────────────────────────
  openCreateShiftDialog() {
    this.shiftForm = { shiftName: '', startTime: '', endTime: '', totalPeriods: null };
    this.showCreateShiftDialog = true;
  }

  saveShift() {
    if (!this.shiftForm.shiftName || !this.shiftForm.startTime || !this.shiftForm.endTime) return;
    this.saving = true;
    this.workspaceService.createShift(this.shiftForm)
      .pipe(finalize(() => { this.saving = false; this.showCreateShiftDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Shift created' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  // ─── Template ──────────────────────────────────────────────────────
  openCreateTemplateDialog() {
    this.templateForm = { templateName: '', shiftId: null, periodNumber: null, startTime: '', endTime: '', durationMinutes: null, isBreak: null };
    this.showCreateTemplateDialog = true;
  }

  saveTemplate() {
    if (!this.templateForm.templateName) return;
    this.saving = true;
    this.workspaceService.createPeriodTemplate(this.templateForm)
      .pipe(finalize(() => { this.saving = false; this.showCreateTemplateDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Template created' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  openEditTemplateDialog(shift: any) {
    this.messageService.add({ severity: 'info', summary: 'Edit Template', detail: `Edit templates for ${shift.shiftName}` });
  }

  getTemplatesForShift(shiftId?: number) {
    return this.data.periodTemplates.filter(t => t.shiftId === shiftId);
  }

  // ─── Search handlers ───────────────────────────────────────────────
  onSectionSearch(event: any) {
    const table = (event.target as HTMLElement).closest('p-table') as any;
    if (table) table.filterGlobal(event.target.value, 'contains');
  }

  onSubjectSearch(event: any) {
    const table = (event.target as HTMLElement).closest('p-table') as any;
    if (table) table.filterGlobal(event.target.value, 'contains');
  }

  onTeacherSearch(event: any) {
    const table = (event.target as HTMLElement).closest('p-table') as any;
    if (table) table.filterGlobal(event.target.value, 'contains');
  }
}