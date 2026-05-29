import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ActivityItem, KpiMetric } from '../../models/school-operations.model';

export interface OpsNavItem {
  label: string;
  description: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'tc-ops-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="ops-nav" aria-label="Workspace navigation">
      <a *ngFor="let item of items" [routerLink]="item.route" routerLinkActive="is-active" class="ops-nav-item">
        <i [class]="item.icon"></i>
        <span>{{ item.label }}</span>
        <small>{{ item.description }}</small>
      </a>
    </nav>
  `
})
export class OpsNavComponent {
  @Input() items: OpsNavItem[] = [];
}

@Component({
  selector: 'tc-ops-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="ops-hero">
      <div>
        <span class="ops-eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
      <div class="ops-hero-actions">
        <ng-content></ng-content>
      </div>
    </header>
  `
})
export class OpsHeaderComponent {
  @Input() eyebrow = 'School operations';
  @Input({ required: true }) title!: string;
  @Input({ required: true }) subtitle!: string;
}

@Component({
  selector: 'tc-ops-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="ops-kpi-card" [attr.data-tone]="metric.tone">
      <span><i [class]="metric.icon"></i></span>
      <div>
        <small>{{ metric.label }}</small>
        <strong>{{ metric.value }}</strong>
        <em>{{ metric.helper }}</em>
      </div>
    </article>
  `
})
export class OpsKpiCardComponent {
  @Input({ required: true }) metric!: KpiMetric;
}

@Component({
  selector: 'tc-ops-filter-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="ops-filter-panel">
      <header>
        <span>{{ eyebrow }}</span>
        <h2>{{ title }}</h2>
      </header>
      <ng-content></ng-content>
    </aside>
  `
})
export class OpsFilterPanelComponent {
  @Input() eyebrow = 'Filters';
  @Input() title = 'Refine results';
}

@Component({
  selector: 'tc-ops-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="ops-drawer" [class.is-open]="open" aria-live="polite">
      <div class="ops-drawer-panel">
        <header>
          <div>
            <span>{{ eyebrow }}</span>
            <h2>{{ title }}</h2>
          </div>
          <button type="button" class="ops-icon-button" (click)="closed.emit()" aria-label="Close panel">
            <i class="pi pi-times"></i>
          </button>
        </header>
        <ng-content></ng-content>
      </div>
    </aside>
  `
})
export class OpsDrawerComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() eyebrow = 'Details';
  @Output() closed = new EventEmitter<void>();
}

@Component({
  selector: 'tc-ops-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="ops-panel ops-timeline-panel">
      <header class="ops-section-header">
        <div>
          <span>{{ eyebrow }}</span>
          <h2>{{ title }}</h2>
        </div>
      </header>
      <div *ngIf="!items.length" class="ops-empty-state">
        <span><i class="pi pi-history"></i></span>
        <strong>{{ emptyTitle }}</strong>
        <p>{{ emptyMessage }}</p>
      </div>
      <div *ngIf="items.length" class="ops-timeline">
        <article *ngFor="let item of items" [attr.data-tone]="item.tone">
          <span><i [class]="item.icon"></i></span>
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
export class OpsTimelineComponent {
  @Input() eyebrow = 'Live operations';
  @Input() title = 'Recent activity';
  @Input() emptyTitle = 'No activity yet';
  @Input() emptyMessage = 'Activity will appear as records are updated.';
  @Input() items: ActivityItem[] = [];
}
