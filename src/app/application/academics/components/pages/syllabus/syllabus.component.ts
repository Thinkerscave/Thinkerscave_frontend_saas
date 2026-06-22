import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
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
import { AcademicsWorkspaceData, SyllabusTopicModel, SyllabusProgressModel } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';

interface TreeNode {
  label: string;
  data: string;
  expandedIcon?: string;
  collapsedIcon?: string;
  icon?: string;
  children?: TreeNode[];
  type?: string;
  dataRef?: any;
  expanded?: boolean;
}

@Component({
  selector: 'app-academic-syllabus-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, TableModule, TreeModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './syllabus.component.html',
  styleUrls: ['./syllabus.component.scss']
})
export class AcademicSyllabusPageComponent implements OnInit {
  private readonly ws = inject(AcademicsWorkspaceService);
  private readonly cs = inject(ConfirmationService);
  private readonly ms = inject(MessageService);
  private readonly dr = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() dataChanged = new EventEmitter<void>();

  filterClassId: any = null;
  filterSectionId: any = null;
  filterSubjectId: any = null;
  showDialog = false;
  saving = false;

  selectedNode: any = null;
  selectedTopics: SyllabusTopicModel[] = [];
  selectedSubjectName = '';
  completingTopic: SyllabusTopicModel | null = null;
  completeRemarks = '';

  get classOptions() { return this.data.classes.map(c => ({ label: c.className, value: c.classId })); }
  get sectionOptions() { return this.data.sections.map(s => ({ label: s.sectionName, value: s.sectionId })); }
  get subjectOptions() { return this.data.subjects.map(s => ({ label: `${s.subjectName} (${s.subjectCode})`, value: s.subjectId })); }
  get progress(): SyllabusProgressModel | null { return this.data.syllabusProgress; }

  get treeNodes(): TreeNode[] {
    const filtered = this.filterSubjectId ? this.data.syllabi.filter(s => Number(s.subjectId) === Number(this.filterSubjectId)) : this.data.syllabi;
    return filtered.map(syllabus => {
      const subjectNode: TreeNode = {
        label: syllabus.subjectName || syllabus.title || 'Syllabus', data: syllabus.syllabusCode || '',
        expandedIcon: 'pi pi-book', collapsedIcon: 'pi pi-book', type: 'subject', expanded: true,
        children: (syllabus.units || syllabus.chapters || []).map((unit: any, uIdx: number) => ({
          label: unit.unitName || unit.chapterName || `Unit ${uIdx + 1}`, data: unit.description || '',
          icon: 'pi pi-folder', type: 'unit', expanded: true,
          children: (unit.chapters || unit.topics || []).map((chapter: any, cIdx: number) => ({
            label: chapter.chapterName || `Chapter ${cIdx + 1}`, data: chapter.description || '',
            icon: 'pi pi-file', type: 'chapter', expanded: true,
            children: (chapter.topics || []).map((topic: SyllabusTopicModel) => ({
              label: topic.topicName, data: topic.status || 'NOT_STARTED',
              icon: topic.status === 'COMPLETED' ? 'pi pi-check-circle' : topic.status === 'IN_PROGRESS' ? 'pi pi-play-circle' : 'pi pi-circle',
              type: 'topic', dataRef: topic
            }))
          }))
        }))
      };
      return subjectNode;
    });
  }

  ngOnInit() {}

  onNodeSelect(event: any) {
    const node = event.node;
    if (node.type === 'topic' && node.dataRef) {
      this.selectedTopics = [node.dataRef];
    } else if (node.children) {
      this.selectedTopics = this.collectTopics(node);
    }
    this.selectedSubjectName = this.getBreadcrumb(node);
  }

  private collectTopics(node: TreeNode): SyllabusTopicModel[] {
    const topics: SyllabusTopicModel[] = [];
    if (node.type === 'topic' && node.dataRef) topics.push(node.dataRef);
    if (node.children) for (const c of node.children) topics.push(...this.collectTopics(c));
    return topics;
  }

  private getBreadcrumb(node: TreeNode): string {
    const parts: string[] = [node.label];
    let current: TreeNode | undefined = node;
    while (current && (current as any).parent) { current = (current as any).parent as TreeNode; parts.unshift(current.label); }
    return parts.join(' > ');
  }

  onFilterChange() { this.selectedNode = null; this.selectedTopics = []; }

  updateStatus(topic: SyllabusTopicModel, status: string) {
    if (!topic.topicId) return;
    this.ws.updateTopicProgress(Number(topic.topicId), status)
      .pipe(takeUntilDestroyed(this.dr))
      .subscribe({ next: () => { this.ms.add({ severity: 'success', summary: `Marked ${status}` }); this.dataChanged.emit(); }, error: () => this.ms.add({ severity: 'error', summary: 'Failed' }) });
  }

  openCompleteDialog(topic: SyllabusTopicModel) {
    this.completingTopic = topic;
    this.completeRemarks = '';
    this.showDialog = true;
  }

  confirmComplete() {
    if (!this.completingTopic?.topicId) return;
    this.saving = true;
    this.ws.updateTopicProgress(Number(this.completingTopic.topicId), 'COMPLETED', this.completeRemarks)
      .pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.dr))
      .subscribe({ next: () => { this.ms.add({ severity: 'success', summary: 'Completed' }); this.dataChanged.emit(); }, error: () => this.ms.add({ severity: 'error', summary: 'Failed' }) });
  }

  onSearch(event: any, table: any) {
    if (table) table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
}