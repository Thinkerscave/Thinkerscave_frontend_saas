import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BreadCrumbService } from '../../../core/services/bread-crumb.service';

/* ============================================================
   ThinkersCave SaaS premium primitives — match inspired images.
   Light theme, white cards, blue primary, soft shadows.
   ============================================================ */

export interface SaasBreadcrumb { label: string; route?: string; }
export interface SaasStat {
  key: string;
  label: string;
  value: string | number;
  helper?: string;
  delta?: string;
  deltaTone?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}
export interface SaasTab { key: string; label: string; icon?: string; }
export interface SaasStep { key: string; label: string; }

/* -------- Page toolbar (actions only; title + subtitle live in layout shell) -------- */
@Component({
  selector: 'tc-saas-page-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="saas-page-header" [class.saas-page-header--actions-only]="!showTitle">
      <div class="saas-page-header__main" *ngIf="showTitle">
        <h1>{{ title }}</h1>
      </div>
      <div class="saas-page-header__actions"><ng-content></ng-content></div>
    </header>
  `
})
export class SaasPageHeaderComponent implements OnChanges {
  private readonly pageHeader = inject(BreadCrumbService);

  /** When false (default), page title is shown only in the layout shell breadcrumb. */
  @Input() showTitle = false;
  @Input() title = '';
  /** Dynamic subtitle override — registers with shell header (static pages use route data). */
  @Input() subtitle?: string;
  /** @deprecated Breadcrumbs are rendered once in the layout shell. */
  @Input() breadcrumbs: SaasBreadcrumb[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if ('subtitle' in changes && this.subtitle) {
      this.pageHeader.setPageSubtitle(this.subtitle);
    }
  }
}

/* -------- KPI stat card -------- */
@Component({
  selector: 'tc-saas-stat-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="saas-stat-card" [attr.data-tone]="stat.tone">
      <div class="saas-stat-card__body">
        <small>{{ stat.label }}</small>
        <strong>{{ stat.value }}</strong>
        <span *ngIf="stat.helper" class="saas-stat-card__helper">{{ stat.helper }}</span>
        <span *ngIf="stat.delta" class="saas-stat-card__delta" [attr.data-tone]="stat.deltaTone || 'neutral'">
          <i class="pi" [ngClass]="stat.deltaTone === 'danger' ? 'pi-arrow-down' : 'pi-arrow-up'"></i>{{ stat.delta }}
        </span>
      </div>
      <span class="saas-stat-card__icon"><i [class]="stat.icon"></i></span>
    </article>
  `
})
export class SaasStatCardComponent {
  @Input({ required: true }) stat!: SaasStat;
}

/* -------- Stat grid wrapper -------- */
@Component({
  selector: 'tc-saas-stat-grid',
  standalone: true,
  imports: [CommonModule, SaasStatCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="saas-stat-grid">
      <tc-saas-stat-card *ngFor="let stat of stats" [stat]="stat"></tc-saas-stat-card>
    </section>
  `
})
export class SaasStatGridComponent {
  @Input() stats: SaasStat[] = [];
}

/* -------- Tab strip -------- */
@Component({
  selector: 'tc-saas-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="saas-tabs">
      <button type="button" *ngFor="let tab of tabs"
              [class.is-active]="tab.key === active"
              (click)="changeTab.emit(tab.key)">
        <i *ngIf="tab.icon" [class]="tab.icon"></i>{{ tab.label }}
      </button>
    </nav>
  `
})
export class SaasTabsComponent {
  @Input() tabs: SaasTab[] = [];
  @Input() active = '';
  @Output() changeTab = new EventEmitter<string>();
}

/* -------- Wizard stepper -------- */
@Component({
  selector: 'tc-saas-stepper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="saas-stepper">
      <li *ngFor="let step of steps; let i = index"
          [class.is-active]="i === activeIndex"
          [class.is-done]="i < activeIndex">
        <span class="saas-stepper__bullet">{{ i + 1 }}</span>
        <span class="saas-stepper__label">{{ step.label }}</span>
        <i *ngIf="!isLast(i)" class="pi pi-minus saas-stepper__line"></i>
      </li>
    </ol>
  `
})
export class SaasStepperComponent {
  @Input() steps: SaasStep[] = [];
  @Input() activeIndex = 0;
  isLast(i: number): boolean { return i === this.steps.length - 1; }
}

/* -------- Status pill -------- */
@Component({
  selector: 'tc-saas-pill',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="saas-pill" [attr.data-tone]="tone">
      <i *ngIf="icon" [class]="icon"></i>{{ label }}
    </span>
  `
})
export class SaasPillComponent {
  @Input() label = '';
  @Input() tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' = 'neutral';
  @Input() icon?: string;
}

/* -------- Card panel wrapper -------- */
@Component({
  selector: 'tc-saas-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { display: block; width: 100%; min-width: 0; }`],
  template: `
    <section class="saas-panel" [class.is-elevated]="elevated">
      <header class="saas-panel__header" *ngIf="title || actions">
        <div>
          <h2>{{ title }}</h2>
          <p *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <div class="saas-panel__actions"><ng-content select="[panel-actions]"></ng-content></div>
      </header>
      <div class="saas-panel__body"><ng-content></ng-content></div>
    </section>
  `
})
export class SaasPanelComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() elevated = true;
  @Input() actions = false;
}

/* -------- Filter bar (one row of label+select/input controls) -------- */
@Component({
  selector: 'tc-saas-filter-row',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="saas-filter-row"><ng-content></ng-content></div>
  `
})
export class SaasFilterRowComponent {}
