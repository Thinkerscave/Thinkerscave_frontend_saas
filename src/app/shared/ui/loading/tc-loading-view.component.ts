import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { LoadingLayout, LoadingPhase, LoadingScope } from './loading-state';
import { TcPageSkeletonComponent } from './tc-page-skeleton.component';

/**
 * Declares loading phase + layout for a region of the page.
 * Renders structural skeleton / empty / error; projects content when ready.
 */
@Component({
  selector: 'tc-loading-view',
  standalone: true,
  imports: [CommonModule, TcPageSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="tc-loading-view"
      [attr.data-scope]="scope"
      [attr.data-phase]="phase"
      [class.is-soft]="soft && phase === 'loading'">

      <tc-page-skeleton
        *ngIf="phase === 'loading' && !soft"
        [layout]="layout"
        [kpis]="kpis"
        [showKpis]="showKpis"
        [showFilter]="showFilter"
        [rows]="rows"
        [columns]="columns"
        [cards]="cards"
        [tabs]="tabs">
      </tc-page-skeleton>

      <div class="tc-loading-view__soft" *ngIf="phase === 'loading' && soft" aria-busy="true">
        <div class="tc-loading-view__soft-bar" aria-hidden="true"></div>
        <span class="tc-loading-view__soft-label">{{ busyLabel }}</span>
        <div class="tc-loading-view__soft-content">
          <ng-content></ng-content>
        </div>
      </div>

      <div class="tc-loading-view__empty" *ngIf="phase === 'empty'">
        <i class="pi pi-inbox" aria-hidden="true"></i>
        <p>{{ emptyMessage || 'No results found.' }}</p>
        <ng-content select="[emptyActions]"></ng-content>
      </div>

      <div class="tc-loading-view__error" *ngIf="phase === 'error'">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <p>{{ errorMessage || 'Something went wrong.' }}</p>
        <button type="button" class="tc-btn" (click)="retry.emit()">Retry</button>
      </div>

      <ng-container *ngIf="phase === 'success' || phase === 'idle'">
        <ng-content></ng-content>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; min-width: 0; }

    .tc-loading-view__soft {
      position: relative;
      min-height: 6rem;
    }

    .tc-loading-view__soft-content {
      opacity: 0.55;
      pointer-events: none;
    }

    .tc-loading-view__soft-bar {
      position: absolute;
      top: 0.35rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      width: min(14rem, 50%);
      height: 0.28rem;
      border-radius: 999px;
      background: linear-gradient(
        90deg,
        var(--tc-surface-100) 0%,
        color-mix(in srgb, var(--tc-accent) 40%, var(--tc-surface-50)) 50%,
        var(--tc-surface-100) 100%
      );
      background-size: 200% 100%;
      animation: tc-soft-shimmer 1.1s ease-in-out infinite;
    }

    .tc-loading-view__soft-label {
      position: absolute;
      top: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--tc-text-muted);
    }

    .tc-loading-view__empty,
    .tc-loading-view__error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      min-height: 10rem;
      padding: 1.5rem;
      text-align: center;
      color: var(--tc-text-muted);
      border: 1px dashed var(--tc-border);
      border-radius: var(--tc-radius-lg);
      background: var(--tc-surface-card);
    }

    .tc-loading-view__empty i,
    .tc-loading-view__error i {
      font-size: 1.5rem;
    }

    .tc-loading-view__error i { color: var(--tc-warning); }

    @keyframes tc-soft-shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
  `]
})
export class TcLoadingViewComponent {
  @Input() phase: LoadingPhase = 'idle';
  @Input() scope: LoadingScope = 'page';
  @Input() layout: LoadingLayout = 'directory-table';
  /** Soft = keep prior content visible with overlay (filter/pagination refresh). */
  @Input() soft = false;
  @Input() busyLabel = 'Updating…';
  @Input() emptyMessage = '';
  @Input() errorMessage = '';
  @Input() kpis?: number;
  @Input() showKpis?: boolean;
  @Input() showFilter?: boolean;
  @Input() rows?: number;
  @Input() columns?: number;
  @Input() cards?: number;
  @Input() tabs?: number;

  @Output() readonly retry = new EventEmitter<void>();
}
