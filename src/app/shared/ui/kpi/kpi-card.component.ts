import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type KpiTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Canonical compact KPI/metric card used across all list & dashboard pages.
 * Renders as a `<button>` when `clickable` is true (e.g. KPI-as-filter chips
 * on directory pages), otherwise as a static `<article>`.
 */
@Component({
  selector: 'tc-kpi-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *ngIf="clickable; else staticTpl">
      <button type="button" class="tc-kpi-card" [class.is-active]="active"
              [attr.data-tone]="tone" [title]="hint || label"
              (click)="select.emit()">
        <ng-container *ngTemplateOutlet="bodyTpl"></ng-container>
      </button>
    </ng-container>
    <ng-template #staticTpl>
      <article class="tc-kpi-card" [class.is-active]="active" [attr.data-tone]="tone" [title]="hint || label">
        <ng-container *ngTemplateOutlet="bodyTpl"></ng-container>
      </article>
    </ng-template>
    <ng-template #bodyTpl>
      <span class="tc-kpi-card__icon" *ngIf="icon"><i [class]="icon"></i></span>
      <span class="tc-kpi-card__body">
        <strong class="tc-kpi-card__value">{{ value }}</strong>
        <span class="tc-kpi-card__label">{{ label }}</span>
      </span>
      <span class="tc-kpi-card__delta" *ngIf="delta" [attr.data-tone]="deltaTone || 'neutral'">
        <i class="pi" [ngClass]="deltaTone === 'danger' ? 'pi-arrow-down' : 'pi-arrow-up'"></i>{{ delta }}
      </span>
    </ng-template>
  `,
  styleUrl: './kpi-card.component.scss'
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() icon?: string;
  @Input() tone: KpiTone = 'neutral';
  @Input() hint?: string;
  @Input() delta?: string;
  @Input() deltaTone?: KpiTone;
  @Input() active = false;
  @Input() clickable = false;
  @Output() select = new EventEmitter<void>();
}

/** Responsive grid wrapper for a row of `tc-kpi-card`s. */
@Component({
  selector: 'tc-kpi-group',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="tc-kpi-group"
                  [class.tc-kpi-group--equal]="mode === 'equal'"
                  [style.--tc-kpi-group-columns]="columns"
                  role="group"
                  [attr.aria-label]="ariaLabel"><ng-content></ng-content></div>`,
  styleUrl: './kpi-card.component.scss'
})
export class KpiGroupComponent {
  @Input() ariaLabel = 'Key metrics';
  @Input() mode: 'auto' | 'equal' = 'auto';
  @Input() columns = 4;
}
