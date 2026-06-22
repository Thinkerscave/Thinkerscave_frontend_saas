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
import { AcademicsActionMode, AcademicsWorkspaceData, SyllabusModel, SyllabusUnitModel, SyllabusChapterModel, SyllabusTopicModel, SyllabusProgressModel } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';
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
  type?: 'unit' | 'chapter' | 'topic';
  dataRef?: any;
}

@Component({
  selector: 'app-academic-syllabus-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, TableModule, TreeModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="syllabus-page">
      <!-- Header -->
      <div class="syllabus-header">
        <div>
          <div class="syllabus-eyebrow">Syllabus & Progress Tracking</div>
          <h1 class="syllabus-title">Teaching Progress</h1>
        </div>
        <div class="syllabus-actions">
          <p-dropdown [options]="classOptions" [(ngModel)]="filterClassId" optionLabel="label" optionValue="value" placeholder="Select Class" (onChange)="onFilterChange()" styleClass="syllabus-filter"></p-dropdown>
          <p-dropdown [options]="sectionOptions" [(ngModel)]="filterSectionId" optionLabel="label" optionValue="value" placeholder="Select Section" (onChange)="onFilterChange()" styleClass="syllabus-filter"></p-dropdown>
          <p-dropdown [options]="subjectOptions" [(ngModel)]="filterSubjectId" optionLabel="label" optionValue="value" placeholder="Select Subject" (onChange)="onFilterChange()" styleClass="syllabus-filter"></p-dropdown>
        </div>
      </div>

      <!-- Main Content -->
      <div class="syllabus-content">
        <!-- Left: Syllabus Tree -->
        <div class="syllabus-tree-panel">
          <div class="syllabus-panel-header">
            <i class="pi pi-sitemap"></i>
            <span>Syllabus Structure</span>
          </div>
          <div class="syllabus-tree-container">
            <p-tree [value]="syllabusTreeNodes" selectionMode="single" [(selection)]="selectedSyllabusNode"
              (onNodeSelect)="onSyllabusNodeSelect($event)"
              styleClass="syllabus-tree">
            </p-tree>
            <div class="syllabus-tree-empty" *ngIf="!syllabusTreeNodes.length">
              <i class="pi pi-book"></i>
              <p>Select a subject to view its syllabus structure.</p>
            </div>
          </div>
        </div>

        <!-- Right: Progress Table -->
        <div class="syllabus-table-panel">
          <div class="syllabus-panel-header">
            <i class="pi pi-list-check"></i>
            <span>Topic Progress</span>
          </div>
          <div class="syllabus-table-container">
            <p-table [value]="selectedTopics" [paginator]="true" [rows]="10"
              [globalFilterFields]="['topicName', 'status', 'remarks']"
              styleClass="syllabus-table">
              <ng-template pTemplate="caption">
                <div class="syllabus-table-header">
                  <span class="syllabus-table-title">{{ selectedSubjectName || 'Topics' }}</span>
                  <input pInputText type="text" (input)="onSearch($event)" placeholder="Search topics..." class="syllabus-search-input">
                </div>
              </ng-template>
              <ng-template pTemplate="header">
                <tr>
                  <th>Topic</th>
                  <th>Estimated Hours</th>
                  <th>Status</th>
                  <th>Completed On</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-topic>
                <tr>
                  <td><strong>{{ topic.topicName }}</strong></td>
                  <td>{{ topic.estimatedHours || '—' }}</td>
                  <td>
                    <span class="syllabus-status" [class.not-started]="topic.status === 'NOT_STARTED' || !topic.status"
                      [class.in-progress]="topic.status === 'IN_PROGRESS'"
                      [class.completed]="topic.status === 'COMPLETED'">
                      {{ topic.status || 'NOT_STARTED' | titlecase }}
                    </span>
                  </td>
                  <td>{{ topic.completedOn ? (topic.completedOn | date:'mediumDate') : '—' }}</td>
                  <td>{{ topic.remarks || '—' }}</td>
                  <td>
                    <div class="syllabus-action-btns">
                      <button class="syllabus-icon-btn" pTooltip="Mark In Progress" *ngIf="topic.status !== 'IN_PROGRESS'" (click)="updateTopicStatus(topic, 'IN_PROGRESS')">
                        <i class="pi pi-play"></i>
                      </button>
                      <button class="syllabus-icon-btn success" pTooltip="Mark Completed" *ngIf="topic.status !== 'COMPLETED'" (click)="openCompleteTopicDialog(topic)">
                        <i class="pi pi-check"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6" class="syllabus-empty">
                    <i class="pi pi-list-check"></i>
                    <p>No topics found. Select a subject and chapter to view topics.</p>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <!-- Bottom Summary -->
          <div class="syllabus-summary" *ngIf="syllabusProgress">
            <div class="syllabus-summary-card">
              <span>Total Topics</span>
              <strong>{{ syllabusProgress.totalTopics }}</strong>
            </div>
            <div class="syllabus-summary-card completed">
              <span>Completed</span>
              <strong>{{ syllabusProgress.completedTopics }}</strong>
            </div>
            <div class="syllabus-summary-card in-progress">
              <span>In Progress</span>
              <strong>{{ syllabusProgress.inProgressTopics }}</strong>
            </div>
            <div class="syllabus-summary-card pending">
              <span>Pending</span>
              <strong>{{ syllabusProgress.pendingTopics }}</strong>
            </div>
            <div class="syllabus-summary-card progress">
              <span>Completion</span>
              <strong>{{ syllabusProgress.completionPercentage }}%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Complete Topic Dialog -->
    <p-dialog header="Mark Topic Completed" [(visible)]="showCompleteDialog" [modal]="true" [style]="{width: '600px'}" [draggable]="false" [resizable]="false">
      <div class="syllabus-dialog-form">
        <p>Mark "<strong>{{ completingTopic?.topicName }}</strong>" as completed?</p>
        <div class="syllabus-form-row">
          <label>Remarks</label>
          <textarea pInputTextarea [(ngModel)]="completeRemarks" rows="3" placeholder="Optional remarks..." class="syllabus-form-input"></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="syllabus-btn syllabus-btn-ghost" (click)="showCompleteDialog = false">Cancel</button>
        <button class="syllabus-btn syllabus-btn-primary" (click)="confirmCompleteTopic()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Mark Completed' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-toast position="top-right"></p-toast>
  `,
  styles: [`
    :host { display: block; }
    .syllabus-page { display: flex; flex-direction: column; gap: 1.25rem; padding: 0.25rem; }
    .syllabus-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .syllabus-eyebrow { font-size: 0.8rem; color: var(--tc-text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .syllabus-title { font-size: 1.5rem; font-weight: 700; color: var(--tc-heading); margin: 0.25rem 0 0; }
    .syllabus-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .syllabus-filter { min-width: 140px; }
    .syllabus-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
    .syllabus-btn-primary { background: var(--tc-primary-600); color: #fff; border-color: var(--tc-primary-600); }
    .syllabus-btn-ghost { background: transparent; color: var(--tc-text-muted); border-color: transparent; }
    .syllabus-btn-ghost:hover { background: var(--tc-bg-muted); }
    .syllabus-content { display: grid; grid-template-columns: 300px 1fr; gap: 1rem; flex: 1; min-height: 0; }
    .syllabus-tree-panel { background: var(--tc-surface-card); border: 1px solid var(--tc-border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .syllabus-panel-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1rem; border-bottom: 1px solid var(--tc-border); font-weight: 600; color: var(--tc-heading); font-size: 0.9rem; }
    .syllabus-panel-header i { color: var(--tc-primary-600); }
    .syllabus-tree-container { flex: 1; overflow: auto; padding: 0.5rem; }
    .syllabus-tree { width: 100%; }
    .syllabus-tree-empty { text-align: center; padding: 3rem 1rem; color: var(--tc-text-muted); }
    .syllabus-tree-empty i { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; opacity: 0.5; }
    .syllabus-table-panel { background: var(--tc-surface-card); border: 1px solid var(--tc-border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .syllabus-table-container { flex: 1; overflow: auto; padding: 1rem; }
    .syllabus-table { width: 100%; }
    .syllabus-table-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.5rem 0; }
    .syllabus-table-title { font-weight: 600; color: var(--tc-heading); }
    .syllabus-search-input { padding: 0.5rem 0.75rem; border: 1px solid var(--tc-border); border-radius: 8px; background: var(--tc-bg); color: var(--tc-text); min-width: 240px; }
    .syllabus-status { display: inline-flex; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .syllabus-status.not-started { background: rgba(148, 163, 184, 0.12); color: #94A3B8; }
    .syllabus-status.in-progress { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }
    .syllabus-status.completed { background: rgba(16, 185, 129, 0.12); color: #10B981; }
    .syllabus-action-btns { display: flex; gap: 0.35rem; }
    .syllabus-icon-btn { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--tc-border); background: transparent; color: var(--tc-text-muted); cursor: pointer; transition: all 0.2s; }
    .syllabus-icon-btn:hover { background: var(--tc-bg-muted); }
    .syllabus-icon-btn.success:hover { color: #10B981; border-color: #10B981; }
    .syllabus-empty { text-align: center; padding: 3rem 1rem; color: var(--tc-text-muted); }
    .syllabus-empty i { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; opacity: 0.5; }
    .syllabus-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid var(--tc-border); }
    .syllabus-summary-card { text-align: center; padding: 0.5rem; border-radius: 8px; background: var(--tc-bg); }
    .syllabus-summary-card span { display: block; font-size: 0.75rem; color: var(--tc-text-muted); }
    .syllabus-summary-card strong { font-size: 1.25rem; color: var(--tc-heading); }
    .syllabus-summary-card.completed strong { color: #10B981; }
    .syllabus-summary-card.in-progress strong { color: #F59E0B; }
    .syllabus-summary-card.pending strong { color: #94A3B8; }
    .syllabus-summary-card.progress strong { color: var(--tc-primary-600); }
    .syllabus-dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .syllabus-form-row { display: flex; flex-direction: column; gap: 0.35rem; }
    .syllabus-form-row label { font-size: 0.85rem; font-weight: 500; color: var(--tc-text); }
    .syllabus-form-input { padding: 0.6rem 0.75rem; border: 1px solid var(--tc-border); border-radius: 8px; background: var(--tc-bg); color: var(--tc-text); }
    .syllabus-form-input:focus { outline: none; border-color: var(--tc-primary-600); }
    @media (max-width: 1024px) { .syllabus-content { grid-template-columns: 1fr; } }
  `]
})
export class AcademicSyllabusPageComponent implements OnInit {
  private readonly workspaceService = inject(AcademicsWorkspaceService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();
  @Output() dataChanged = new EventEmitter<void>();

  filterClassId: any = null;
  filterSectionId: any = null;
  filterSubjectId: any = null;
  showCompleteDialog = false;
  saving = false;

  selectedSyllabusNode: any = null;
  selectedSubjectName = '';
  selectedTopics: SyllabusTopicModel[] = [];
  completingTopic: SyllabusTopicModel | null = null;
  completeRemarks = '';

  get classOptions() { return this.data.classes.map(c => ({ label: c.className, value: c.classId })); }
  get sectionOptions() { return this.data.sections.map(s => ({ label: s.sectionName, value: s.sectionId })); }
  get subjectOptions() { return this.data.subjects.map(s => ({ label: `${s.subjectName} (${s.subjectCode})`, value: s.subjectId })); }

  get syllabusProgress(): SyllabusProgressModel | null {
    return this.data.syllabusProgress;
  }

  get syllabusTreeNodes(): TreeNode[] {
    const filteredSyllabi = this.filterSubjectId
      ? this.data.syllabi.filter(s => Number(s.subjectId) === Number(this.filterSubjectId))
      : this.data.syllabi;

    return filteredSyllabi.map(syllabus => {
      const subjectNode: TreeNode = {
        label: syllabus.subjectName || syllabus.title || 'Syllabus',
        data: syllabus.syllabusCode || '',
        expandedIcon: 'pi pi-book',
        collapsedIcon: 'pi pi-book',
        type: 'unit',
        children: (syllabus.units || syllabus.chapters || []).map((unit: any, uIndex: number) => {
          const unitNode: TreeNode = {
            label: unit.unitName || unit.chapterName || `Unit ${uIndex + 1}`,
            data: unit.description || '',
            icon: 'pi pi-folder',
            type: 'chapter',
            children: (unit.chapters || unit.topics || []).map((chapter: any, cIndex: number) => {
              const chapterNode: TreeNode = {
                label: chapter.chapterName || `Chapter ${cIndex + 1}`,
                data: chapter.description || '',
                icon: 'pi pi-file',
                type: 'topic',
                children: (chapter.topics || []).map((topic: SyllabusTopicModel) => ({
                  label: topic.topicName,
                  data: topic.status || 'NOT_STARTED',
                  icon: topic.status === 'COMPLETED' ? 'pi pi-check-circle' : topic.status === 'IN_PROGRESS' ? 'pi pi-play-circle' : 'pi pi-circle',
                  type: 'topic' as const,
                  dataRef: topic
                }))
              };
              return chapterNode;
            })
          };
          return unitNode;
        })
      };
      return subjectNode;
    });
  }

  ngOnInit() {}

  onSyllabusNodeSelect(event: any) {
    const node = event.node;
    if (node.type === 'topic' && node.dataRef) {
      this.selectedTopics = [node.dataRef];
    } else if (node.children) {
      this.selectedTopics = this.collectTopics(node);
    }
    this.selectedSubjectName = this.getRootLabel(node);
  }

  private collectTopics(node: TreeNode): SyllabusTopicModel[] {
    const topics: SyllabusTopicModel[] = [];
    if (node.type === 'topic' && node.dataRef) {
      topics.push(node.dataRef);
    }
    if (node.children) {
      for (const child of node.children) {
        topics.push(...this.collectTopics(child));
      }
    }
    return topics;
  }

  private getRootLabel(node: TreeNode): string {
    let current = node;
    const labels: string[] = [];
    while (current) {
      labels.unshift(current.label);
      current = (current as any).parent;
    }
    return labels.join(' > ');
  }

  onFilterChange() {
    this.selectedSyllabusNode = null;
    this.selectedTopics = [];
  }

  updateTopicStatus(topic: SyllabusTopicModel, status: string) {
    if (!topic.topicId) {
      this.messageService.add({ severity: 'warn', summary: 'Cannot update', detail: 'Topic ID not available.' });
      return;
    }
    this.workspaceService.updateTopicProgress(Number(topic.topicId), status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: `Topic marked as ${status}` }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed to update' }) });
  }

  openCompleteTopicDialog(topic: SyllabusTopicModel) {
    this.completingTopic = topic;
    this.completeRemarks = '';
    this.showCompleteDialog = true;
  }

  confirmCompleteTopic() {
    if (!this.completingTopic?.topicId) return;
    this.saving = true;
    this.workspaceService.updateTopicProgress(Number(this.completingTopic.topicId), 'COMPLETED', this.completeRemarks)
      .pipe(finalize(() => { this.saving = false; this.showCompleteDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Topic completed' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  onSearch(event: any) {
    const table = (event.target as HTMLElement).closest('p-table') as any;
    if (table) table.filterGlobal(event.target.value, 'contains');
  }
}