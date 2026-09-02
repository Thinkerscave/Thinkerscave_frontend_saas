import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UI_PAGINATION } from '../../config/ui-standards';
import {
  AppPageChangeEvent,
  buildPageItems,
  pageRange,
  toPageChangeEvent
} from '../../utils/paged-result.util';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      *ngIf="totalRecords > 0"
      class="app-paginator"
      role="navigation"
      [attr.aria-label]="ariaLabel">
      <p class="app-paginator__summary">
        Showing {{ range.start }}–{{ range.end }} of {{ totalRecords }} {{ noun }}
      </p>
      <div class="app-paginator__controls">
        <label class="app-paginator__size">
          <span class="app-paginator__sr">Rows per page</span>
          <select
            [ngModel]="rows"
            (ngModelChange)="onSizeChange(+$event)"
            [attr.aria-label]="'Rows per page'">
            <option *ngFor="let option of pageSizeOptions" [ngValue]="option">{{ option }}</option>
          </select>
        </label>
        <button
          type="button"
          class="app-paginator__nav"
          [disabled]="page <= 0"
          (click)="goTo(page - 1)">
          Previous
        </button>
        <div class="app-paginator__pages">
          <ng-container *ngFor="let item of pageItems">
            <span *ngIf="item === 'ellipsis'" class="app-paginator__ellipsis" aria-hidden="true">…</span>
            <button
              *ngIf="item !== 'ellipsis'"
              type="button"
              class="app-paginator__page"
              [class.is-active]="item === page"
              [attr.aria-current]="item === page ? 'page' : null"
              (click)="goTo(item)">
              {{ item + 1 }}
            </button>
          </ng-container>
        </div>
        <button
          type="button"
          class="app-paginator__nav"
          [disabled]="page >= pageCount - 1"
          (click)="goTo(page + 1)">
          Next
        </button>
      </div>
    </nav>
  `,
  styleUrl: './app-paginator.component.scss'
})
export class AppPaginatorComponent {
  @Input() page = 0;
  @Input() rows: number = UI_PAGINATION.defaultSize;
  @Input() totalRecords = 0;
  @Input() pageSizeOptions: readonly number[] | number[] = UI_PAGINATION.options;
  @Input() noun = 'results';
  @Input() ariaLabel = 'Pagination';
  @Output() pageChange = new EventEmitter<AppPageChangeEvent>();

  get pageCount(): number {
    return this.rows > 0 ? Math.max(1, Math.ceil(this.totalRecords / this.rows)) : 1;
  }

  get range(): { start: number; end: number } {
    return pageRange(this.page, this.rows, this.totalRecords);
  }

  get pageItems() {
    return buildPageItems(this.page, this.pageCount);
  }

  goTo(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.pageCount || nextPage === this.page) {
      return;
    }
    this.emit(nextPage, this.rows);
  }

  onSizeChange(size: number): void {
    if (!size || size === this.rows) {
      return;
    }
    this.emit(0, size);
  }

  private emit(page: number, rows: number): void {
    this.pageChange.emit(toPageChangeEvent(page, rows, this.totalRecords));
  }
}
