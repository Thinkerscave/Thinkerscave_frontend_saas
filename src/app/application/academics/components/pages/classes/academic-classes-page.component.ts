import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AcademicsActionMode, AcademicsWorkspaceData, AcademicClass, AcademicSection } from '../../../models/academics-workspace.model';
import { AcademicsInsightsService } from '../../../services/academics-insights.service';
import { AcademicEmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-academic-classes-page',
  standalone: true,
  imports: [CommonModule, AcademicEmptyStateComponent],
  template: `
    <section class="acad-page-grid structure-layout">
      <aside class="acad-panel acad-class-navigator">
        <div class="acad-section-head compact">
          <div>
            <span>Class navigator</span>
            <h2>Structure</h2>
          </div>
        </div>
        <button *ngFor="let classItem of data.classes" type="button" [class.is-active]="classItem.classId === selectedClassId" (click)="selectedClassId = classItem.classId">
          <i class="pi pi-sitemap"></i>
          <span>{{ classItem.className }}</span>
          <small>{{ sectionsFor(classItem).length }} sections</small>
        </button>
      </aside>

      <main class="acad-panel acad-section-matrix">
        <div class="acad-section-head">
          <div>
            <span>Section matrix</span>
            <h2>{{ selectedClass?.className || 'Classes & sections' }}</h2>
          </div>
          <div class="acad-button-cluster">
            <button type="button" class="acad-ghost-button" (click)="actionRequested.emit('section')"><i class="pi pi-th-large"></i>Add section</button>
            <button type="button" class="acad-primary-button" (click)="actionRequested.emit('class')"><i class="pi pi-plus"></i>Create class</button>
          </div>
        </div>

        <app-academic-empty-state *ngIf="!data.classes.length" icon="pi pi-sitemap" title="No classes configured" description="Create the first class, then add sections and class teacher ownership." actionLabel="Create class" (action)="actionRequested.emit('class')"></app-academic-empty-state>

        <div class="acad-matrix-grid" *ngIf="selectedClass">
          <article *ngFor="let section of sectionsFor(selectedClass)" class="acad-section-cell">
            <div class="acad-row-between">
              <strong>{{ section.sectionName }}</strong>
              <span>{{ ownerFor(section) }}</span>
            </div>
            <div class="acad-capacity-bar"><i [style.width.%]="capacityFor(section)"></i></div>
            <small>{{ capacityFor(section) }}% capacity signal · {{ roomFor(section) }}</small>
          </article>
        </div>
      </main>

      <aside class="acad-panel acad-class-analytics">
        <div class="acad-section-head compact">
          <div>
            <span>Analytics</span>
            <h2>Class health</h2>
          </div>
        </div>
        <div class="acad-analytics-stack">
          <article>
            <span>Total sections</span>
            <strong>{{ data.sections.length }}</strong>
            <small>Across {{ data.classes.length }} classes</small>
          </article>
          <article>
            <span>Homeroom coverage</span>
            <strong>{{ coverage() }}%</strong>
            <small>{{ data.classTeacherAssignments.length }} ownership records</small>
          </article>
          <article>
            <span>Hierarchy nodes</span>
            <strong>{{ data.containers.length }}</strong>
            <small>School, wing, stream, class and section</small>
          </article>
        </div>
      </aside>
    </section>
  `
})
export class AcademicClassesPageComponent {
  private readonly insights = inject(AcademicsInsightsService);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();

  selectedClassId: number | string | undefined;

  get selectedClass(): AcademicClass | undefined {
    if (!this.selectedClassId) {
      return this.data.classes[0];
    }

    return this.data.classes.find(item => item.classId === this.selectedClassId) ?? this.data.classes[0];
  }

  sectionsFor(classItem: AcademicClass): AcademicSection[] {
    return this.data.sections.filter(section => Number(section.classId ?? section.classEntity?.classId) === Number(classItem.classId));
  }

  ownerFor(section: AcademicSection): string {
    const owner = this.data.classTeacherAssignments.find(item => Number(item.sectionId) === Number(section.sectionId));
    return owner?.teacherName || 'Ownership pending';
  }

  capacityFor(section: AcademicSection): number {
    const container = this.data.containers.find(item => item.containerName === section.sectionName || Number(item.currentStrength) > 0);
    return this.insights.percent(container?.currentStrength ?? 18, container?.capacity ?? 40);
  }

  roomFor(section: AcademicSection): string {
    const slot = this.data.timetableSlots.find(item => Number(item.sectionId) === Number(section.sectionId));
    return slot?.roomName || 'Room pending';
  }

  coverage(): number {
    return this.insights.percent(this.data.classTeacherAssignments.length, Math.max(this.data.classes.length, 1));
  }
}
