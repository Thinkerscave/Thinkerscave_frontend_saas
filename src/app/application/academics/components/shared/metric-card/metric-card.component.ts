import { CommonModule } from '@angular/common';
import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { AcademicsMetric } from '../../../models/academics-workspace.model';
import { AcademicProgressRingComponent } from '../progress-ring/progress-ring.component';

@Component({
  selector: 'app-academic-metric-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, AcademicProgressRingComponent],
  template: `
    <article class="acad-metric-card" [ngClass]="'tone-' + metric.tone">
      <div class="acad-metric-icon"><i [ngClass]="metric.icon"></i></div>
      <div class="acad-metric-content">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.helper }}</small>
      </div>
      <app-academic-progress-ring *ngIf="metric.progress !== undefined" [value]="metric.progress" [tone]="metric.tone"></app-academic-progress-ring>
    </article>
  `
})
export class AcademicMetricCardComponent {
  @Input({ required: true }) metric!: AcademicsMetric;
}
