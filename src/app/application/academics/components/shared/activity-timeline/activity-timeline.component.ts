import { CommonModule } from '@angular/common';
import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { AcademicsActivityItem } from '../../../models/academics-workspace.model';

@Component({
  selector: 'app-academic-activity-timeline',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="acad-panel acad-activity-panel">
      <div class="acad-section-head">
        <div>
          <span>Live operations</span>
          <h2>Recent academic activity</h2>
        </div>
      </div>

      <div *ngIf="!items.length" class="acad-empty-state">
        <span><i class="pi pi-history"></i></span>
        <strong>No academic activity yet</strong>
        <p>Create timetable periods, class ownership or calendar events to build an activity feed.</p>
      </div>

      <div *ngIf="items.length" class="acad-timeline">
        <article *ngFor="let item of items" [class]="'tone-' + item.tone">
          <span><i [ngClass]="item.icon"></i></span>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
            <small>{{ item.meta }}</small>
          </div>
        </article>
      </div>
    </section>
  `
})
export class AcademicActivityTimelineComponent {
  @Input() items: AcademicsActivityItem[] = [];
}
