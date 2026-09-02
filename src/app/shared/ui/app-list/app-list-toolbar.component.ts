import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { AppButtonComponent } from '../app-form/app-button.component';
import { AppListViewMode, UI_SEARCH } from '../../config/ui-standards';
import { ListQuerySession } from '../../utils/list-query.session';
import { AppGridTableToggleComponent } from './app-grid-table-toggle.component';
import { AppSearchBarComponent } from './app-search-bar.component';

@Component({
  selector: 'app-list-toolbar',
  standalone: true,
  imports: [CommonModule, AppSearchBarComponent, AppButtonComponent, AppGridTableToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-list-toolbar">
      <div class="app-list-toolbar__cluster">
        <div class="app-list-toolbar__search" *ngIf="showSearch">
          <app-search-bar
            [placeholder]="searchPlaceholder"
            [ariaLabel]="searchAriaLabel || searchPlaceholder"
            [value]="search"
            (search)="onSearchInput($event)"
            (enter)="onSubmit()">
          </app-search-bar>
        </div>

        <div class="app-list-toolbar__filters">
          <ng-content></ng-content>
        </div>

        <div class="app-list-toolbar__actions" *ngIf="showActions">
          <app-button
            variant="primary"
            size="sm"
            icon="pi pi-search"
            [loading]="searching"
            (clicked)="onSubmit()">
            Search
          </app-button>
          <app-button variant="ghost" size="sm" icon="pi pi-refresh" (clicked)="onReset()">
            Reset
          </app-button>
        </div>
      </div>

      <div class="app-list-toolbar__views">
        <app-grid-table-toggle
          *ngIf="showViewToggle"
          [mode]="view"
          [ariaLabel]="viewAriaLabel"
          (modeChange)="viewChange.emit($event)">
        </app-grid-table-toggle>
        <ng-content select="[toolbarExtra]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './app-list-toolbar.component.scss'
})
export class AppListToolbarComponent implements OnDestroy {
  private readonly query = new ListQuerySession(undefined, UI_SEARCH.debounceMs);

  @Input() search = '';
  @Input() searchPlaceholder = 'Search…';
  @Input() searchAriaLabel = '';
  @Input() searching = false;
  @Input() showSearch = true;
  @Input() showActions = true;
  @Input() showViewToggle = true;
  @Input() view: AppListViewMode = 'table';
  @Input() viewAriaLabel = 'View mode';
  @Input() debounceMs = UI_SEARCH.debounceMs;

  /** Immediate value so the parent can keep the input in sync. Does not query. */
  @Output() searchChange = new EventEmitter<string>();
  /** Fires after the user pauses typing. Parent should query the backend. */
  @Output() searchDebounced = new EventEmitter<void>();
  /** Search button or Enter: apply dropdown filters + current search now. */
  @Output() submitted = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() viewChange = new EventEmitter<AppListViewMode>();

  ngOnDestroy(): void {
    this.query.cancelDebounce();
  }

  onSearchInput(value: string): void {
    this.searchChange.emit(value);
    this.query.debounce(() => this.searchDebounced.emit());
  }

  onSubmit(): void {
    this.query.flush(() => this.submitted.emit());
  }

  onReset(): void {
    this.query.flush(() => this.reset.emit());
  }
}
