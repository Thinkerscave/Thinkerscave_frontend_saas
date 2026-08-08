import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output
} from '@angular/core';

export type AppListViewMode = 'table' | 'grid';

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
        [class.is-active]="mode === 'table'"
        [attr.aria-pressed]="mode === 'table'"
        title="Table view"
        (click)="setMode('table')">
        <i class="pi pi-list" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="app-grid-table-toggle__btn"
        [class.is-active]="mode === 'grid'"
        [attr.aria-pressed]="mode === 'grid'"
        title="Grid view"
        (click)="setMode('grid')">
        <i class="pi pi-th-large" aria-hidden="true"></i>
      </button>
    </div>
  `,
  styleUrl: './app-grid-table-toggle.component.scss'
})
export class AppGridTableToggleComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) storageKey!: string;
  @Input() mode: AppListViewMode = 'grid';
  @Input() ariaLabel = 'View mode';
  @Output() modeChange = new EventEmitter<AppListViewMode>();

  ngOnInit(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'table' || saved === 'grid') {
      this.mode = saved;
      this.modeChange.emit(this.mode);
      this.cdr.markForCheck();
    } else if (saved === 'cards') {
      this.mode = 'grid';
      localStorage.setItem(this.storageKey, 'grid');
      this.modeChange.emit(this.mode);
      this.cdr.markForCheck();
    }
  }

  setMode(next: AppListViewMode): void {
    if (this.mode === next) return;
    this.mode = next;
    localStorage.setItem(this.storageKey, next);
    this.modeChange.emit(next);
    this.cdr.markForCheck();
  }
}
