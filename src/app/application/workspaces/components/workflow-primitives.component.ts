import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WorkspaceMetric, WorkspaceNavItem } from '../models/workflow-workspace.model';

@Component({
  selector: 'tc-workspace-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="tc-workspace-nav" aria-label="Workspace navigation">
      <a *ngFor="let item of items" [routerLink]="item.route" routerLinkActive="is-active" class="tc-nav-item">
        <i [class]="item.icon"></i>
        <span>{{ item.label }}</span>
        <small>{{ item.description }}</small>
      </a>
    </nav>
  `
})
export class WorkflowNavComponent {
  @Input() items: WorkspaceNavItem[] = [];
}

@Component({
  selector: 'tc-workspace-metric',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="tc-metric" [attr.data-tone]="metric.tone || 'neutral'">
      <span class="tc-metric__icon"><i [class]="metric.icon"></i></span>
      <div>
        <small>{{ metric.label }}</small>
        <strong>{{ metric.value }}</strong>
        <em *ngIf="metric.trend">{{ metric.trend }}</em>
      </div>
    </article>
  `
})
export class WorkflowMetricComponent {
  @Input({ required: true }) metric!: WorkspaceMetric;
}

@Component({
  selector: 'tc-workspace-empty',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tc-empty-state">
      <span><i [class]="icon"></i></span>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
    </div>
  `
})
export class WorkflowEmptyStateComponent {
  @Input() title = 'No records found';
  @Input() message = 'The workspace will populate as soon as data is available.';
  @Input() icon = 'pi pi-inbox';
}

@Component({
  selector: 'tc-workspace-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="tc-drawer" [class.is-open]="open" aria-live="polite">
      <div class="tc-drawer__panel">
        <header>
          <span>{{ eyebrow }}</span>
          <h2>{{ title }}</h2>
          <button type="button" class="tc-icon-button" (click)="close.emit()" aria-label="Close panel">
            <i class="pi pi-times"></i>
          </button>
        </header>
        <ng-content></ng-content>
      </div>
    </aside>
  `
})
export class WorkflowDrawerComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() eyebrow = 'Workspace action';
  @Output() close = new EventEmitter<void>();
}