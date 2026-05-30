import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output , ChangeDetectionStrategy} from '@angular/core';
import { AcademicYear, AcademicsMetric, AcademicsPageConfig } from '../../../models/academics-workspace.model';
import { AcademicProgressRingComponent } from '../progress-ring/progress-ring.component';

@Component({
  selector: 'app-academic-smart-hero',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, AcademicProgressRingComponent],
  template: `
    <section class="acad-smart-hero">
      <div class="acad-breadcrumbs">
        <span>Workspace</span>
        <i class="pi pi-chevron-right"></i>
        <span>Academics</span>
        <i class="pi pi-chevron-right"></i>
        <strong>{{ page.label }}</strong>
      </div>

      <div class="acad-hero-grid">
        <div class="acad-hero-copy">
          <span class="acad-eyebrow"><i [ngClass]="page.icon"></i>{{ page.eyebrow }}</span>
          <h1>{{ page.title }}</h1>
          <p>{{ page.description }}</p>
          <div class="acad-hero-meta">
            <span><i class="pi pi-calendar"></i>{{ currentYear?.yearName || currentYear?.yearCode || 'Academic year pending' }}</span>
            <span><i class="pi pi-database"></i>Live API data</span>
            <button type="button" class="acad-command-chip" (click)="commandRequested.emit()">
              <i class="pi pi-search"></i>
              Command search
              <kbd>Ctrl K</kbd>
            </button>
          </div>
        </div>

        <div class="acad-health-panel">
          <app-academic-progress-ring [value]="health" tone="primary"></app-academic-progress-ring>
          <div>
            <span>Academic health</span>
            <strong>{{ health }}%</strong>
            <small>Structure, delivery, timetable and planning readiness</small>
          </div>
        </div>
      </div>

      <div class="acad-hero-stats">
        <article *ngFor="let metric of metrics.slice(1, 5)" [class]="'tone-' + metric.tone">
          <i [ngClass]="metric.icon"></i>
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
        </article>
      </div>
    </section>
  `
})
export class AcademicSmartHeroComponent {
  @Input({ required: true }) page!: AcademicsPageConfig;
  @Input() currentYear: AcademicYear | null = null;
  @Input() metrics: AcademicsMetric[] = [];
  @Input() health = 0;
  @Output() commandRequested = new EventEmitter<void>();
}
