import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AcademicsActionMode, AcademicsWorkspaceData, SyllabusModel } from '../../../models/academics-workspace.model';
import { AcademicEmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-academic-syllabus-page',
  standalone: true,
  imports: [CommonModule, AcademicEmptyStateComponent],
  template: `
    <section class="acad-page-grid delivery-layout">
      <aside class="acad-panel acad-delivery-list">
        <div class="acad-section-head compact">
          <div>
            <span>Teacher view</span>
            <h2>Published syllabi</h2>
          </div>
        </div>
        <button *ngFor="let syllabus of data.syllabi" type="button" [class.is-active]="syllabus.syllabusId === selectedId" (click)="selectedId = syllabus.syllabusId">
          <strong>{{ syllabus.title || syllabus.subjectName }}</strong>
          <small>{{ syllabus.status }} · v{{ syllabus.version }}</small>
        </button>
      </aside>

      <main class="acad-panel acad-delivery-workspace">
        <div class="acad-section-head">
          <div>
            <span>Teaching delivery workspace</span>
            <h2>{{ selectedSyllabus?.title || 'Syllabus delivery' }}</h2>
          </div>
          <button type="button" class="acad-primary-button" (click)="actionRequested.emit('subject')"><i class="pi pi-plus"></i>Add syllabus subject</button>
        </div>

        <app-academic-empty-state *ngIf="!data.syllabi.length" icon="pi pi-list-check" title="No syllabus published yet" description="Publish syllabus records to track chapters, topics and lesson readiness." actionLabel="Add subject" (action)="actionRequested.emit('subject')"></app-academic-empty-state>

        <div class="acad-chapter-stack" *ngIf="selectedSyllabus">
          <article *ngFor="let chapter of selectedSyllabus.chapters || []; let index = index">
            <div class="acad-row-between">
              <strong>{{ chapter.chapterNumber || index + 1 }}. {{ chapter.chapterName }}</strong>
              <span>{{ chapter.topics?.length || 0 }} topics</span>
            </div>
            <p>{{ chapter.description || chapter.learningObjectives || 'Lesson outcomes pending.' }}</p>
            <div class="acad-topic-pills">
              <span *ngFor="let topic of chapter.topics || []">{{ topic.topicName }}</span>
            </div>
          </article>
        </div>
      </main>

      <aside class="acad-panel acad-delivery-side">
        <div class="acad-section-head compact">
          <div>
            <span>Progress visualization</span>
            <h2>Topic readiness</h2>
          </div>
        </div>
        <div class="acad-analytics-stack">
          <article><span>Syllabi</span><strong>{{ data.syllabi.length }}</strong><small>Latest published records</small></article>
          <article><span>Chapters</span><strong>{{ chapterCount }}</strong><small>Available for delivery</small></article>
          <article><span>Topics</span><strong>{{ topicCount }}</strong><small>Ready for lesson tracking</small></article>
        </div>
      </aside>
    </section>
  `
})
export class AcademicSyllabusPageComponent {
  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();

  selectedId: number | undefined;

  get selectedSyllabus(): SyllabusModel | undefined {
    if (!this.selectedId) {
      return this.data.syllabi[0];
    }

    return this.data.syllabi.find(item => item.syllabusId === this.selectedId) ?? this.data.syllabi[0];
  }

  get chapterCount(): number {
    return this.data.syllabi.reduce((sum, item) => sum + (item.chapters?.length ?? 0), 0);
  }

  get topicCount(): number {
    return this.data.syllabi.reduce((sum, item) => sum + (item.chapters || []).reduce((chapterSum, chapter) => chapterSum + (chapter.topics?.length ?? 0), 0), 0);
  }
}
