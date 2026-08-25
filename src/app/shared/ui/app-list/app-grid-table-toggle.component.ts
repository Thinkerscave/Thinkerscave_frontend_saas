import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject
} from '@angular/core';
import { AppListViewMode } from '../../config/ui-standards';

export type { AppListViewMode };

@Component({
  selector: 'app-grid-table-toggle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-grid-table-toggle" role="group" [attr.aria-label]="ariaLabel">
      <button
        type="button"
        class="app-grid-table-toggle__btn"
        [class.is-active]="mode === 'grid'"
        [attr.aria-pressed]="mode === 'grid'"
        title="Grid view"
        (click)="setMode('grid')">
        <i class="pi pi-th-large" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="app-grid-table-toggle__btn"
        [class.is-active]="mode === 'table'"
        [attr.aria-pressed]="mode === 'table'"
        title="Table view"
        (click)="setMode('table')">
        <i class="pi pi-list" aria-hidden="true"></i>
      </button>
    </div>
  `,
  styleUrl: './app-grid-table-toggle.component.scss'
})
export class AppGridTableToggleComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  /** @deprecated Parent owns view state. Kept so existing templates keep compiling. */
  @Input() pageKey?: string;
  /** @deprecated Use pageKey. Kept so existing templates keep compiling. */
  @Input() storageKey?: string;
  @Input() mode: AppListViewMode = 'table';
  @Input() ariaLabel = 'View mode';
  @Output() modeChange = new EventEmitter<AppListViewMode>();

  setMode(next: AppListViewMode): void {
    if (this.mode === next) {
      return;
    }
    this.mode = next;
    this.modeChange.emit(next);
    this.cdr.markForCheck();
  }
}
