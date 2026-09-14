import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit } from '@angular/core';
import {
  LOADING_LAYOUT_PRESETS,
  LoadingLayout,
  LoadingLayoutPreset
} from './loading-state';

/**
 * Structural skeleton that mirrors a page/section layout.
 * Prefer [layout] presets over ad-hoc variant + arbitrary counts.
 *
 * @deprecated Prefer `layout` input. Legacy `variant` still maps for compatibility.
 */
export type TcPageSkeletonVariant =
  | 'list'
  | 'kpi'
  | 'table'
  | 'cards'
  | 'detail'
  | 'tabs'
  | 'chart'
  | 'form'
  | 'dashboard'
  | LoadingLayout;

const VARIANT_TO_LAYOUT: Record<string, LoadingLayout> = {
  list: 'directory-table',
  kpi: 'directory-table',
  table: 'table-only',
  cards: 'cards-only',
  detail: 'detail',
  tabs: 'detail-section',
  chart: 'dashboard',
  form: 'form',
  dashboard: 'dashboard',
  'directory-table': 'directory-table',
  'directory-cards': 'directory-cards',
  'table-only': 'table-only',
  'cards-only': 'cards-only',
  'detail-section': 'detail-section',
  modal: 'modal'
};

@Component({
  selector: 'tc-page-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="tc-page-skeleton"
      [attr.data-layout]="resolved.layout"
      role="status"
      aria-live="polite"
      aria-busy="true">
      <span class="tc-sr-only">Loading content…</span>

      <!-- KPI strip -->
      <div class="tc-page-skeleton__kpis" *ngIf="resolved.showKpis && resolved.kpis > 0">
        <div class="tc-page-skeleton__kpi" *ngFor="let _ of slots(resolved.kpis)">
          <span class="tc-sk tc-sk--icon"></span>
          <span class="tc-sk tc-sk--line tc-sk--w40"></span>
          <span class="tc-sk tc-sk--line tc-sk--w70 tc-sk--lg"></span>
        </div>
      </div>

      <!-- Directory / dashboard panel -->
      <div
        class="tc-page-skeleton__panel"
        *ngIf="isDirectory || resolved.layout === 'dashboard' || resolved.layout === 'table-only' || resolved.layout === 'form' || resolved.layout === 'modal' || resolved.layout === 'detail-section'">

        <div class="tc-page-skeleton__toolbar" *ngIf="resolved.showFilter">
          <span class="tc-sk tc-sk--search"></span>
          <span class="tc-sk tc-sk--chip"></span>
          <span class="tc-sk tc-sk--chip"></span>
          <span class="tc-sk tc-sk--chip"></span>
        </div>

        <!-- Charts (dashboard) -->
        <div class="tc-page-skeleton__charts" *ngIf="resolved.layout === 'dashboard' && resolved.charts > 0">
          <div class="tc-page-skeleton__chart" *ngFor="let _ of slots(resolved.charts)">
            <span class="tc-sk tc-sk--line tc-sk--w50"></span>
            <span class="tc-sk tc-sk--block tc-sk--chart"></span>
          </div>
        </div>

        <!-- Table rows -->
        <div
          class="tc-page-skeleton__table"
          *ngIf="showTable">
          <div class="tc-page-skeleton__tr tc-page-skeleton__tr--head">
            <span class="tc-sk tc-sk--line" *ngFor="let _ of slots(resolved.columns)"></span>
          </div>
          <div class="tc-page-skeleton__tr" *ngFor="let _ of slots(resolved.rows)">
            <span class="tc-sk tc-sk--avatar" *ngIf="resolved.layout === 'directory-table'"></span>
            <span class="tc-sk tc-sk--line" *ngFor="let __ of slots(resolved.columns)"></span>
          </div>
        </div>

        <!-- Form fields -->
        <div class="tc-page-skeleton__form-grid" *ngIf="resolved.layout === 'form' || resolved.layout === 'modal'">
          <div class="tc-page-skeleton__stack" *ngFor="let _ of slots(resolved.sections || 6)">
            <span class="tc-sk tc-sk--line tc-sk--w30"></span>
            <span class="tc-sk tc-sk--input"></span>
          </div>
        </div>

        <!-- Detail section blocks -->
        <div class="tc-page-skeleton__sections" *ngIf="resolved.layout === 'detail-section'">
          <div class="tc-page-skeleton__section" *ngFor="let _ of slots(resolved.sections || 2)">
            <span class="tc-sk tc-sk--line tc-sk--w40 tc-sk--lg"></span>
            <span class="tc-sk tc-sk--block" style="height: 5.5rem; margin-top: 0.55rem;"></span>
          </div>
        </div>
      </div>

      <!-- Card grid (outside panel so it matches real grid pages) -->
      <div class="tc-page-skeleton__grid" *ngIf="showCards">
        <div class="tc-page-skeleton__card" *ngFor="let _ of slots(resolved.cards)">
          <div class="tc-page-skeleton__card-head">
            <span class="tc-sk tc-sk--avatar"></span>
            <div class="tc-page-skeleton__stack">
              <span class="tc-sk tc-sk--line tc-sk--w70"></span>
              <span class="tc-sk tc-sk--line tc-sk--w40"></span>
            </div>
          </div>
          <span class="tc-sk tc-sk--line tc-sk--w90"></span>
          <span class="tc-sk tc-sk--line tc-sk--w60"></span>
          <span class="tc-sk tc-sk--line tc-sk--w50"></span>
        </div>
      </div>

      <!-- Full detail profile -->
      <ng-container *ngIf="resolved.layout === 'detail'">
        <div class="tc-page-skeleton__hero">
          <span class="tc-sk tc-sk--avatar tc-sk--avatar-xl"></span>
          <div class="tc-page-skeleton__stack">
            <span class="tc-sk tc-sk--line tc-sk--w40 tc-sk--lg"></span>
            <span class="tc-sk tc-sk--line tc-sk--w60"></span>
            <div class="tc-page-skeleton__chips">
              <span class="tc-sk tc-sk--chip"></span>
              <span class="tc-sk tc-sk--chip"></span>
              <span class="tc-sk tc-sk--chip"></span>
            </div>
          </div>
        </div>
        <div class="tc-page-skeleton__tabs">
          <span class="tc-sk tc-sk--tab" *ngFor="let _ of slots(resolved.tabs)"></span>
        </div>
        <div class="tc-page-skeleton__panel">
          <div class="tc-page-skeleton__detail-grid">
            <div class="tc-page-skeleton__stack" *ngFor="let _ of slots(resolved.sections || 3)">
              <span class="tc-sk tc-sk--line tc-sk--w30"></span>
              <span class="tc-sk tc-sk--line tc-sk--w80"></span>
              <span class="tc-sk tc-sk--block" style="height: 4.5rem;"></span>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styleUrl: './tc-page-skeleton.component.scss'
})
export class TcPageSkeletonComponent implements OnInit, OnChanges {
  /** Preferred: layout preset that mirrors the final UI. */
  @Input() layout: LoadingLayout | null = null;

  /** @deprecated Use `layout`. Mapped for backward compatibility. */
  @Input() variant: TcPageSkeletonVariant = 'directory-table';

  @Input() rows?: number;
  @Input() columns?: number;
  @Input() kpis?: number;
  @Input() cards?: number;
  @Input() tabs?: number;
  @Input() charts?: number;
  @Input() sections?: number;
  @Input() showKpis?: boolean;
  @Input() showFilter?: boolean;

  resolved: LoadingLayoutPreset = { ...LOADING_LAYOUT_PRESETS['directory-table'] };

  ngOnInit(): void {
    this.resolved = this.buildPreset();
  }

  ngOnChanges(): void {
    this.resolved = this.buildPreset();
  }

  get isDirectory(): boolean {
    return this.resolved.layout === 'directory-table' || this.resolved.layout === 'directory-cards';
  }

  get showTable(): boolean {
    return (
      this.resolved.layout === 'directory-table' ||
      this.resolved.layout === 'table-only' ||
      (this.resolved.layout === 'dashboard' && this.resolved.rows > 0)
    );
  }

  get showCards(): boolean {
    return (
      this.resolved.layout === 'directory-cards' ||
      this.resolved.layout === 'cards-only'
    );
  }

  slots(count: number): number[] {
    return Array.from({ length: Math.max(0, count) });
  }

  private buildPreset(): LoadingLayoutPreset {
    const key = this.layout ?? VARIANT_TO_LAYOUT[this.variant] ?? 'directory-table';
    const base = { ...LOADING_LAYOUT_PRESETS[key] };
    if (this.kpis != null) base.kpis = this.kpis;
    if (this.showKpis != null) base.showKpis = this.showKpis;
    if (this.showFilter != null) base.showFilter = this.showFilter;
    if (this.rows != null) base.rows = this.rows;
    if (this.columns != null) base.columns = this.columns;
    if (this.cards != null) base.cards = this.cards;
    if (this.tabs != null) base.tabs = this.tabs;
    if (this.charts != null) base.charts = this.charts;
    if (this.sections != null) base.sections = this.sections;
    // When KPIs forced off for results-only, also hide filter unless asked.
    if (base.showKpis === false && this.showFilter == null && (key === 'directory-table' || key === 'directory-cards')) {
      // results-only under already-visible chrome
      if (this.layout == null && (this.variant === 'list' || this.variant === 'table' || this.variant === 'cards')) {
        // keep explicit overrides from callers using showKpis=false
        if (this.showKpis === false) base.showFilter = false;
      }
    }
    return base;
  }
}
