import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Structural page skeletons for initial data loads.
 * Variants mirror real layouts so content does not jump when data arrives.
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
  | 'dashboard';

@Component({
  selector: 'tc-page-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="tc-page-skeleton"
      [attr.data-variant]="variant"
      role="status"
      aria-live="polite"
      aria-busy="true">
      <span class="tc-sr-only">Loading…</span>

      <!-- Directory / list page: KPI strip + toolbar + table -->
      <ng-container *ngIf="variant === 'list' || variant === 'dashboard'">
        <div class="tc-page-skeleton__kpis" *ngIf="showKpis">
          <div class="tc-page-skeleton__kpi" *ngFor="let _ of kpiSlots">
            <span class="tc-sk tc-sk--icon"></span>
            <span class="tc-sk tc-sk--line tc-sk--w40"></span>
            <span class="tc-sk tc-sk--line tc-sk--w70 tc-sk--lg"></span>
          </div>
        </div>
        <div class="tc-page-skeleton__panel">
          <div class="tc-page-skeleton__toolbar">
            <span class="tc-sk tc-sk--search"></span>
            <span class="tc-sk tc-sk--chip"></span>
            <span class="tc-sk tc-sk--chip"></span>
            <span class="tc-sk tc-sk--chip"></span>
          </div>
          <div class="tc-page-skeleton__table" *ngIf="variant === 'list'">
            <div class="tc-page-skeleton__tr tc-page-skeleton__tr--head">
              <span class="tc-sk tc-sk--line" *ngFor="let _ of colSlots"></span>
            </div>
            <div class="tc-page-skeleton__tr" *ngFor="let _ of rowSlots">
              <span class="tc-sk tc-sk--line" *ngFor="let __ of colSlots"></span>
            </div>
          </div>
          <div class="tc-page-skeleton__charts" *ngIf="variant === 'dashboard'">
            <div class="tc-page-skeleton__chart" *ngFor="let _ of chartSlots">
              <span class="tc-sk tc-sk--line tc-sk--w50"></span>
              <span class="tc-sk tc-sk--block tc-sk--chart"></span>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- KPI only -->
      <div class="tc-page-skeleton__kpis" *ngIf="variant === 'kpi'">
        <div class="tc-page-skeleton__kpi" *ngFor="let _ of kpiSlots">
          <span class="tc-sk tc-sk--icon"></span>
          <span class="tc-sk tc-sk--line tc-sk--w40"></span>
          <span class="tc-sk tc-sk--line tc-sk--w70 tc-sk--lg"></span>
        </div>
      </div>

      <!-- Table only -->
      <div class="tc-page-skeleton__panel" *ngIf="variant === 'table'">
        <div class="tc-page-skeleton__table">
          <div class="tc-page-skeleton__tr tc-page-skeleton__tr--head">
            <span class="tc-sk tc-sk--line" *ngFor="let _ of colSlots"></span>
          </div>
          <div class="tc-page-skeleton__tr" *ngFor="let _ of rowSlots">
            <span class="tc-sk tc-sk--line" *ngFor="let __ of colSlots"></span>
          </div>
        </div>
      </div>

      <!-- Card grid -->
      <div class="tc-page-skeleton__grid" *ngIf="variant === 'cards'">
        <div class="tc-page-skeleton__card" *ngFor="let _ of cardSlots">
          <div class="tc-page-skeleton__card-head">
            <span class="tc-sk tc-sk--avatar"></span>
            <div class="tc-page-skeleton__stack">
              <span class="tc-sk tc-sk--line tc-sk--w70"></span>
              <span class="tc-sk tc-sk--line tc-sk--w40"></span>
            </div>
          </div>
          <span class="tc-sk tc-sk--line tc-sk--w90"></span>
          <span class="tc-sk tc-sk--line tc-sk--w60"></span>
        </div>
      </div>

      <!-- Detail / profile -->
      <ng-container *ngIf="variant === 'detail'">
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
          <span class="tc-sk tc-sk--tab" *ngFor="let _ of tabSlots"></span>
        </div>
        <div class="tc-page-skeleton__panel">
          <div class="tc-page-skeleton__detail-grid">
            <div class="tc-page-skeleton__stack" *ngFor="let _ of detailSlots">
              <span class="tc-sk tc-sk--line tc-sk--w30"></span>
              <span class="tc-sk tc-sk--line tc-sk--w80"></span>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Tabs / section body -->
      <ng-container *ngIf="variant === 'tabs'">
        <div class="tc-page-skeleton__tabs">
          <span class="tc-sk tc-sk--tab" *ngFor="let _ of tabSlots"></span>
        </div>
        <div class="tc-page-skeleton__panel">
          <span class="tc-sk tc-sk--line tc-sk--w50 tc-sk--lg"></span>
          <span class="tc-sk tc-sk--block" style="height: 9rem; margin-top: 0.75rem;"></span>
        </div>
      </ng-container>

      <!-- Chart -->
      <div class="tc-page-skeleton__panel" *ngIf="variant === 'chart'">
        <span class="tc-sk tc-sk--line tc-sk--w40"></span>
        <span class="tc-sk tc-sk--block tc-sk--chart" style="margin-top: 0.75rem;"></span>
      </div>

      <!-- Form / modal -->
      <div class="tc-page-skeleton__panel" *ngIf="variant === 'form'">
        <div class="tc-page-skeleton__form-grid">
          <div class="tc-page-skeleton__stack" *ngFor="let _ of formSlots">
            <span class="tc-sk tc-sk--line tc-sk--w30"></span>
            <span class="tc-sk tc-sk--input"></span>
          </div>
        </div>
        <div class="tc-page-skeleton__form-actions">
          <span class="tc-sk tc-sk--btn"></span>
          <span class="tc-sk tc-sk--btn tc-sk--btn-primary"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .tc-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }

    .tc-page-skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--tc-page-row-gap, 0.75rem);
      width: 100%;
      min-width: 0;
    }

    .tc-sk {
      display: block;
      border-radius: var(--tc-radius-sm, 6px);
      background: linear-gradient(
        90deg,
        var(--tc-surface-100, #f1f5f9) 0%,
        var(--tc-surface-50, #f8fafc) 45%,
        var(--tc-surface-100, #f1f5f9) 90%
      );
      background-size: 200% 100%;
      animation: tc-page-skel-shimmer 1.35s ease-in-out infinite;
    }

    .tc-sk--line { height: 0.7rem; width: 100%; }
    .tc-sk--lg { height: 1.05rem; }
    .tc-sk--w30 { width: 30%; }
    .tc-sk--w40 { width: 40%; }
    .tc-sk--w50 { width: 50%; }
    .tc-sk--w60 { width: 60%; }
    .tc-sk--w70 { width: 70%; }
    .tc-sk--w80 { width: 80%; }
    .tc-sk--w90 { width: 90%; }
    .tc-sk--icon {
      width: 2rem;
      height: 2rem;
      border-radius: var(--tc-radius-md, 8px);
    }
    .tc-sk--avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .tc-sk--avatar-xl {
      width: 4.5rem;
      height: 4.5rem;
    }
    .tc-sk--search {
      flex: 1 1 14rem;
      height: 2.25rem;
      border-radius: var(--tc-radius-md, 8px);
      min-width: 10rem;
    }
    .tc-sk--chip {
      width: 5.5rem;
      height: 2rem;
      border-radius: 999px;
      flex-shrink: 0;
    }
    .tc-sk--tab {
      width: 5rem;
      height: 2rem;
      border-radius: var(--tc-radius-md, 8px);
    }
    .tc-sk--block {
      width: 100%;
      height: 6rem;
      border-radius: var(--tc-radius-md, 8px);
    }
    .tc-sk--chart { height: 14rem; }
    .tc-sk--input {
      width: 100%;
      height: 2.35rem;
      border-radius: var(--tc-radius-md, 8px);
    }
    .tc-sk--btn {
      width: 6rem;
      height: 2.25rem;
      border-radius: var(--tc-radius-md, 8px);
    }
    .tc-sk--btn-primary { width: 7.5rem; }

    .tc-page-skeleton__kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
      gap: 0.65rem;
    }

    .tc-page-skeleton__kpi {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      min-height: 4.5rem;
      padding: 0.75rem 0.9rem;
      border: 1px solid var(--tc-border, #e2e8f0);
      border-radius: var(--tc-radius-lg, 12px);
      background: var(--tc-surface-card, #fff);
    }

    .tc-page-skeleton__panel {
      padding: 0.9rem 1rem;
      border: 1px solid var(--tc-border, #e2e8f0);
      border-radius: var(--tc-radius-lg, 12px);
      background: var(--tc-surface-card, #fff);
      min-width: 0;
    }

    .tc-page-skeleton__toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 0.65rem;
      margin-bottom: 0.85rem;
    }

    .tc-page-skeleton__table { display: flex; flex-direction: column; gap: 0.65rem; }
    .tc-page-skeleton__tr {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(4rem, 1fr));
      gap: 0.75rem;
      align-items: center;
    }
    .tc-page-skeleton__tr--head .tc-sk { height: 0.55rem; opacity: 0.7; }

    .tc-page-skeleton__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      gap: 0.75rem;
    }

    .tc-page-skeleton__card {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      padding: 0.9rem;
      border: 1px solid var(--tc-border, #e2e8f0);
      border-radius: var(--tc-radius-lg, 12px);
      background: var(--tc-surface-card, #fff);
    }

    .tc-page-skeleton__card-head,
    .tc-page-skeleton__hero {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .tc-page-skeleton__hero {
      padding: 1rem 1.1rem;
      border: 1px solid var(--tc-border, #e2e8f0);
      border-radius: var(--tc-radius-lg, 12px);
      background: var(--tc-surface-card, #fff);
    }

    .tc-page-skeleton__stack {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .tc-page-skeleton__chips,
    .tc-page-skeleton__tabs,
    .tc-page-skeleton__form-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }

    .tc-page-skeleton__detail-grid,
    .tc-page-skeleton__form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 0.85rem 1rem;
    }

    .tc-page-skeleton__charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      gap: 0.85rem;
    }

    .tc-page-skeleton__chart {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }

    .tc-page-skeleton__form-actions {
      justify-content: flex-end;
      margin-top: 1rem;
    }

    @keyframes tc-page-skel-shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    :host-context(.tc-theme-dark) .tc-sk {
      background: linear-gradient(
        90deg,
        rgba(148, 163, 184, 0.12) 0%,
        rgba(148, 163, 184, 0.22) 45%,
        rgba(148, 163, 184, 0.12) 90%
      );
      background-size: 200% 100%;
    }

    @media (prefers-reduced-motion: reduce) {
      .tc-sk { animation: tc-page-skel-pulse 1.6s ease-in-out infinite; }
    }

    @keyframes tc-page-skel-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.55; }
    }
  `]
})
export class TcPageSkeletonComponent {
  @Input() variant: TcPageSkeletonVariant = 'list';
  @Input() rows = 6;
  @Input() columns = 5;
  @Input() kpis = 4;
  @Input() cards = 6;
  @Input() tabs = 5;
  @Input() showKpis = true;

  get rowSlots(): number[] {
    return Array.from({ length: Math.max(1, this.rows) });
  }
  get colSlots(): number[] {
    return Array.from({ length: Math.max(2, this.columns) });
  }
  get kpiSlots(): number[] {
    return Array.from({ length: Math.max(1, this.kpis) });
  }
  get cardSlots(): number[] {
    return Array.from({ length: Math.max(1, this.cards) });
  }
  get tabSlots(): number[] {
    return Array.from({ length: Math.max(2, this.tabs) });
  }
  get detailSlots(): number[] {
    return Array.from({ length: 6 });
  }
  get formSlots(): number[] {
    return Array.from({ length: 6 });
  }
  get chartSlots(): number[] {
    return Array.from({ length: 2 });
  }
}
