import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject , ChangeDetectionStrategy} from '@angular/core';
import { ACADEMICS_DAY_OPTIONS, ACADEMICS_PERIODS } from '../../../data/academics-workspace.config';
import { AcademicsActionMode, AcademicsWorkspaceData } from '../../../models/academics-workspace.model';
import { AcademicsInsightsService } from '../../../services/academics-insights.service';
import { AcademicEmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-academic-timetable-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, AcademicEmptyStateComponent],
  template: `
    <section class="acad-panel acad-scheduler-panel">
      <div class="acad-section-head">
        <div>
          <span>Premium scheduling tool</span>
          <h2>Weekly scheduler grid</h2>
        </div>
        <div class="acad-button-cluster">
          <button type="button" class="acad-ghost-button" (click)="actionRequested.emit('timetable')"><i class="pi pi-sparkles"></i>Guided period</button>
          <button type="button" class="acad-primary-button" (click)="actionRequested.emit('timetable')"><i class="pi pi-plus"></i>Add period</button>
        </div>
      </div>

      <app-academic-empty-state *ngIf="!data.timetableSlots.length" icon="pi pi-table" title="No timetable slots created yet" description="Start by adding your first class period. Conflict checks run from the backend." actionLabel="Add period" (action)="actionRequested.emit('timetable')"></app-academic-empty-state>

      <div class="acad-scheduler" *ngIf="data.timetableSlots.length">
        <div class="acad-scheduler-head"></div>
        <div class="acad-scheduler-head" *ngFor="let day of days">{{ formatDay(day) }}</div>

        <ng-container *ngFor="let period of periods">
          <div class="acad-period-label">
            <strong>Period {{ period.periodNumber }}</strong>
            <small>{{ period.startTime }}-{{ period.endTime }}</small>
          </div>
          <div class="acad-period-cell" *ngFor="let day of days">
            <article *ngFor="let slot of slotsFor(day, period.periodNumber)">
              <strong>{{ slot.subjectName }}</strong>
              <span>{{ slot.className }} {{ slot.sectionName || '' }}</span>
              <small>{{ slot.teacherName }} · {{ slot.roomName || 'Room pending' }}</small>
            </article>
          </div>
        </ng-container>
      </div>
    </section>
  `
})
export class AcademicTimetablePageComponent {
  private readonly insights = inject(AcademicsInsightsService);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();

  readonly days = ACADEMICS_DAY_OPTIONS;
  readonly periods = ACADEMICS_PERIODS;

  slotsFor(day: string, periodNumber: number) {
    return this.insights.slotsFor(this.data, day, periodNumber);
  }

  formatDay(day: string): string {
    return this.insights.formatDay(day);
  }
}
