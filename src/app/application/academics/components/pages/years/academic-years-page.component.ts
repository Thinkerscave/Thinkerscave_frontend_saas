import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AcademicsActionMode, AcademicsWorkspaceData } from '../../../models/academics-workspace.model';
import { AcademicEmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-academic-years-page',
  standalone: true,
  imports: [CommonModule, AcademicEmptyStateComponent],
  template: `
    <section class="acad-page-grid timeline-layout">
      <div class="acad-panel acad-session-timeline">
        <div class="acad-section-head">
          <div>
            <span>Session lifecycle</span>
            <h2>Academic year timeline</h2>
          </div>
          <button type="button" class="acad-primary-button" (click)="actionRequested.emit('year')"><i class="pi pi-plus"></i>Create academic year</button>
        </div>

        <app-academic-empty-state *ngIf="!data.academicYears.length" icon="pi pi-calendar-clock" title="No academic sessions created" description="Create an academic year to start classes, syllabus and timetables." actionLabel="Create academic year" (action)="actionRequested.emit('year')"></app-academic-empty-state>

        <div class="acad-timeline-large" *ngIf="data.academicYears.length">
          <article *ngFor="let year of data.academicYears" [class.is-current]="year.isCurrent">
            <span></span>
            <div>
              <div class="acad-row-between">
                <strong>{{ year.yearName || year.yearCode }}</strong>
                <em>{{ year.isCurrent ? 'Current session' : 'Archive' }}</em>
              </div>
              <p>{{ year.description || 'Academic session ready for planning.' }}</p>
              <small>{{ year.startDate | date }} - {{ year.endDate | date }}</small>
            </div>
          </article>
        </div>
      </div>

      <aside class="acad-panel acad-session-side">
        <div class="acad-section-head compact">
          <div>
            <span>Promotion readiness</span>
            <h2>Workflow signals</h2>
          </div>
        </div>
        <div class="acad-rule-list">
          <article>
            <i class="pi pi-copy"></i>
            <div><strong>Year cloning</strong><p>Duplicate structure and subjects into the next session.</p></div>
          </article>
          <article>
            <i class="pi pi-users"></i>
            <div><strong>Promotion window</strong><p>Prepare class promotions after term closure.</p></div>
          </article>
          <article>
            <i class="pi pi-archive"></i>
            <div><strong>Archive history</strong><p>Keep previous sessions visible without mixing active data.</p></div>
          </article>
        </div>
      </aside>
    </section>
  `
})
export class AcademicYearsPageComponent {
  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();
}
