import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AcademicsActionMode, AcademicsWorkspaceData, SyllabusChapterModel, SyllabusModel } from '../../../models/academics-workspace.model';
import { AcademicsInsightsService } from '../../../services/academics-insights.service';
import { AcademicEmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-academic-curriculum-page',
  standalone: true,
  imports: [CommonModule, AcademicEmptyStateComponent],
  template: `
    <section class="acad-page-grid planner-layout">
      <main class="acad-panel acad-kanban-planner">
        <div class="acad-section-head">
          <div>
            <span>Kanban + timeline planner</span>
            <h2>Curriculum pacing</h2>
          </div>
          <button type="button" class="acad-primary-button" (click)="actionRequested.emit('subject')"><i class="pi pi-upload"></i>Import curriculum</button>
        </div>

        <app-academic-empty-state *ngIf="!data.syllabi.length" icon="pi pi-sliders-h" title="No syllabus content available" description="Publish syllabus data to unlock pacing, units and chapter planning." actionLabel="Add subject" (action)="actionRequested.emit('subject')"></app-academic-empty-state>

        <div class="acad-kanban" *ngIf="data.syllabi.length">
          <section *ngFor="let column of columns">
            <header>{{ column.label }}</header>
            <article *ngFor="let item of chaptersFor(column.limit)" class="acad-kanban-card">
              <span>{{ item.source }}</span>
              <strong>{{ item.chapter.chapterName }}</strong>
              <p>{{ item.chapter.learningObjectives || item.chapter.description || 'Learning outcomes pending.' }}</p>
              <div class="acad-capacity-bar"><i [style.width.%]="column.progress"></i></div>
            </article>
          </section>
        </div>
      </main>

      <aside class="acad-panel acad-pacing-side">
        <div class="acad-section-head compact">
          <div>
            <span>Smart pacing</span>
            <h2>Coverage heatmap</h2>
          </div>
        </div>
        <div class="acad-heatmap">
          <span *ngFor="let slot of heatmapSlots" [style.opacity]="slot"></span>
        </div>
        <div class="acad-rule-list">
          <article>
            <i class="pi pi-lightbulb"></i>
            <div><strong>{{ recommendationTitle }}</strong><p>{{ recommendationText }}</p></div>
          </article>
        </div>
      </aside>
    </section>
  `
})
export class AcademicCurriculumPageComponent {
  private readonly insights = inject(AcademicsInsightsService);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();

  readonly columns = [
    { label: 'To plan', limit: 0, progress: 22 },
    { label: 'In delivery', limit: 1, progress: 58 },
    { label: 'Ready for assessment', limit: 2, progress: 82 }
  ];

  get heatmapSlots(): number[] {
    const total = Math.max(this.data.syllabi.reduce((sum, syllabus) => sum + (syllabus.chapters?.length ?? 0), 0), 1);
    return Array.from({ length: 28 }, (_, index) => 0.25 + ((index % total) / total) * 0.75);
  }

  get recommendationTitle(): string {
    return this.data.syllabi.length ? 'Pacing is ready for weekly allocation' : 'Syllabus setup required';
  }

  get recommendationText(): string {
    const coverage = this.insights.percent(this.data.syllabi.length, Math.max(this.data.subjects.length, 1));
    return `${coverage}% of subject library has syllabus data. Use this signal before locking weekly teaching plans.`;
  }

  chaptersFor(offset: number): { source: string; chapter: SyllabusChapterModel }[] {
    return this.data.syllabi
      .flatMap((syllabus: SyllabusModel) => (syllabus.chapters || []).map(chapter => ({ source: syllabus.title || syllabus.subjectName || 'Syllabus', chapter })))
      .filter((_, index) => index % 3 === offset)
      .slice(0, 5);
  }
}
