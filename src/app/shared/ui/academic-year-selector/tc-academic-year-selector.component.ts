import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicYearContextService } from '../../services/academic-year-context.service';

/**
 * Compact Figma-style Academic Year control for `tc-saas-page-header` actions.
 * Place LEFT of primary page actions. Breadcrumb stays in the shell (top-right).
 */
@Component({
  selector: 'tc-academic-year-selector',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tc-ay" [class.is-open]="open" [class.is-disabled]="disabled || !years.length">
      <button
        type="button"
        class="tc-ay__trigger"
        [attr.aria-expanded]="open"
        aria-haspopup="listbox"
        [disabled]="disabled || loading"
        (click)="toggle($event)">
        <span class="tc-ay__icon" aria-hidden="true"><i class="pi pi-calendar"></i></span>
        <span class="tc-ay__copy">
          <span class="tc-ay__label">Academic Year</span>
          <span class="tc-ay__value">{{ displayLabel }}</span>
        </span>
        <span class="tc-ay__chevron" aria-hidden="true"><i class="pi pi-chevron-down"></i></span>
      </button>

      <ul
        *ngIf="open"
        class="tc-ay__menu"
        role="listbox"
        [attr.aria-label]="'Academic year options'">
        <li *ngIf="allowAll">
          <button
            type="button"
            role="option"
            class="tc-ay__option"
            [class.is-active]="selectedYearId == null"
            (click)="choose(null)">
            All years
          </button>
        </li>
        <li *ngFor="let y of years">
          <button
            type="button"
            role="option"
            class="tc-ay__option"
            [class.is-active]="y.academicYearId === selectedYearId"
            (click)="choose(y.academicYearId)">
            <span>{{ y.name }}</span>
            <span class="tc-ay__status" *ngIf="y.status === 'CURRENT'">Current</span>
          </button>
        </li>
        <li *ngIf="!years.length" class="tc-ay__empty">No academic years available</li>
      </ul>
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
      flex: 0 0 auto;
      max-width: 100%;
    }

    .tc-ay {
      position: relative;
      min-width: 0;
    }

    .tc-ay__trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      min-height: 2.5rem;
      max-width: min(100%, 13.5rem);
      padding: 0.35rem 0.7rem 0.35rem 0.55rem;
      border: 1px solid var(--tc-border, #e2e8f0);
      border-radius: 0.65rem;
      background: #fff;
      color: var(--tc-text, #0f172a);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .tc-ay__trigger:hover:not(:disabled) {
      border-color: #cbd5e1;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    }

    .tc-ay__trigger:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--tc-primary, #2563eb) 45%, transparent);
      outline-offset: 2px;
    }

    .tc-ay__trigger:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .tc-ay__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.65rem;
      height: 1.65rem;
      border-radius: 0.45rem;
      color: var(--tc-primary, #2563eb);
      background: color-mix(in srgb, var(--tc-primary, #2563eb) 10%, #fff);
      flex: 0 0 auto;
    }

    .tc-ay__icon .pi {
      font-size: 0.85rem;
    }

    .tc-ay__copy {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.05rem;
      min-width: 0;
      text-align: left;
    }

    .tc-ay__label {
      font-size: 0.68rem;
      line-height: 1.1;
      font-weight: 500;
      letter-spacing: 0.01em;
      color: #94a3b8;
      white-space: nowrap;
    }

    .tc-ay__value {
      font-size: 0.875rem;
      line-height: 1.2;
      font-weight: 600;
      color: #0f172a;
      max-width: 8.5rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tc-ay__chevron {
      margin-left: 0.15rem;
      color: #94a3b8;
      flex: 0 0 auto;
      transition: transform 0.15s ease;
    }

    .tc-ay__chevron .pi {
      font-size: 0.7rem;
    }

    .tc-ay.is-open .tc-ay__chevron {
      transform: rotate(180deg);
    }

    .tc-ay__menu {
      position: absolute;
      top: calc(100% + 0.35rem);
      left: 0;
      z-index: 40;
      min-width: 100%;
      width: max-content;
      max-width: min(18rem, 80vw);
      max-height: 16rem;
      overflow: auto;
      margin: 0;
      padding: 0.35rem;
      list-style: none;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      background: #fff;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
    }

    .tc-ay__option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      width: 100%;
      padding: 0.55rem 0.65rem;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      color: #0f172a;
      font-size: 0.875rem;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
    }

    .tc-ay__option:hover,
    .tc-ay__option.is-active {
      background: #f1f5f9;
    }

    .tc-ay__option.is-active {
      color: var(--tc-primary, #2563eb);
    }

    .tc-ay__status {
      font-size: 0.68rem;
      font-weight: 600;
      color: #16a34a;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .tc-ay__empty {
      padding: 0.65rem;
      color: #94a3b8;
      font-size: 0.8125rem;
    }

    @media (max-width: 640px) {
      .tc-ay__trigger {
        max-width: min(100%, 11.5rem);
        min-height: 2.35rem;
        padding: 0.3rem 0.55rem 0.3rem 0.45rem;
        gap: 0.45rem;
      }

      .tc-ay__value {
        max-width: 6.5rem;
        font-size: 0.8125rem;
      }
    }
  `]
})
export class TcAcademicYearSelectorComponent implements OnInit {
  private readonly ctx = inject(AcademicYearContextService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);

  /** When true, include an “All years” option that emits null. */
  @Input() allowAll = false;
  @Input() disabled = false;

  /** Fired when the effective year changes (including first resolve). */
  @Output() readonly yearChange = new EventEmitter<number | null>();

  open = false;
  private lastEmitted: number | null | undefined = undefined;

  get years() {
    return this.ctx.years();
  }

  get selectedYearId() {
    return this.ctx.selectedYearId();
  }

  get loading() {
    return this.ctx.loading();
  }

  get displayLabel(): string {
    if (this.allowAll && this.selectedYearId == null) {
      return 'All years';
    }
    return this.ctx.selectedYearLabel();
  }

  ngOnInit(): void {
    this.ctx.ensureLoaded().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.emitIfChanged(this.ctx.selectedYearId());
      this.cdr.markForCheck();
    });

    this.ctx.selectedYearId$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      this.emitIfChanged(id);
      this.cdr.markForCheck();
    });
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled || this.loading) return;
    this.open = !this.open;
  }

  choose(id: number | null): void {
    this.open = false;
    if (this.allowAll) {
      this.ctx.selectYear(id);
    } else if (id != null) {
      this.ctx.selectYear(id);
    }
    this.emitIfChanged(this.ctx.selectedYearId());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open = false;
      this.cdr.markForCheck();
    }
  }

  private emitIfChanged(id: number | null): void {
    if (this.lastEmitted === id) return;
    this.lastEmitted = id;
    this.yearChange.emit(id);
  }
}
