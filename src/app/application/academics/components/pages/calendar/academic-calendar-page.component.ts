import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AcademicCalendarEventModel, AcademicsActionMode, AcademicsWorkspaceData } from '../../../models/academics-workspace.model';
import { AcademicEmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-academic-calendar-page',
  standalone: true,
  imports: [CommonModule, AcademicEmptyStateComponent],
  template: `
    <section class="acad-page-grid calendar-layout">
      <main class="acad-panel acad-calendar-board">
        <div class="acad-section-head">
          <div>
            <span>Month · week · agenda</span>
            <h2>Academic calendar</h2>
          </div>
          <button type="button" class="acad-primary-button" (click)="actionRequested.emit('calendar-event')"><i class="pi pi-calendar-plus"></i>Add event</button>
        </div>

        <app-academic-empty-state *ngIf="!data.calendarEvents.length" icon="pi pi-calendar" title="No calendar events created yet" description="Add exams, holidays, PTMs or activities so school staff can plan ahead." actionLabel="Add event" (action)="actionRequested.emit('calendar-event')"></app-academic-empty-state>

        <div class="acad-calendar-grid" *ngIf="data.calendarEvents.length">
          <article *ngFor="let day of daysInView" class="acad-calendar-day">
            <strong>{{ day }}</strong>
            <div *ngFor="let event of eventsFor(day)" [ngClass]="typeClass(event)">
              <span>{{ event.eventType }}</span>
              <small>{{ event.title }}</small>
            </div>
          </article>
        </div>
      </main>

      <aside class="acad-panel acad-agenda-panel">
        <div class="acad-section-head compact">
          <div>
            <span>Agenda</span>
            <h2>Upcoming</h2>
          </div>
        </div>
        <div class="acad-event-list">
          <article *ngFor="let event of data.calendarEvents">
            <span>{{ event.startDate | date: 'dd' }}</span>
            <div><strong>{{ event.title }}</strong><small>{{ event.eventType }} · {{ event.startDate | date: 'MMM yyyy' }}</small></div>
          </article>
        </div>
        <div class="acad-legend compact">
          <div><span class="exam"></span><strong>Exams</strong></div>
          <div><span class="holiday"></span><strong>Holidays</strong></div>
          <div><span class="event"></span><strong>Events</strong></div>
        </div>
      </aside>
    </section>
  `
})
export class AcademicCalendarPageComponent {
  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();

  readonly daysInView = Array.from({ length: 35 }, (_, index) => index + 1);

  eventsFor(day: number): AcademicCalendarEventModel[] {
    return this.data.calendarEvents.filter(event => Number((event.startDate || '').slice(-2)) === day).slice(0, 3);
  }

  typeClass(event: AcademicCalendarEventModel): string {
    const type = (event.eventType || 'EVENT').toLowerCase();
    return `acad-calendar-event ${type}`;
  }
}
