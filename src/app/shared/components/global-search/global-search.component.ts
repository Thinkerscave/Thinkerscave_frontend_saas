import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild,
  inject, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Subject, debounceTime, switchMap } from 'rxjs';
import {
  DefaultGlobalSearchProvider, GlobalSearchProvider, GlobalSearchResult
} from './global-search.provider';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

/**
 * Command-palette style omni-search rendered in the top bar.
 *
 *  - Opens with Ctrl+K / Cmd+K, closes on Escape
 *  - Debounced search (250 ms) through a {@link GlobalSearchProvider}
 *  - Arrow-key navigation + Enter to select
 *  - Results grouped by `category`
 *
 * Pages can override the provider by supplying a custom implementation of
 * {@link GlobalSearchProvider} at any injector level.
 */
@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [
    CommonModule, FormsModule, InputTextModule, ButtonModule,
    EmptyStateComponent, SkeletonComponent
  ],
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalSearchComponent {
  private readonly router = inject(Router);
  private readonly provider = inject(GlobalSearchProvider, { optional: true }) ?? inject(DefaultGlobalSearchProvider);
  private readonly term$ = new Subject<string>();

  visible = signal(false);
  loading = signal(false);
  term = signal('');
  results = signal<GlobalSearchResult[]>([]);
  highlighted = signal(0);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  constructor() {
    this.term$
      .pipe(
        debounceTime(250),
        switchMap(term => {
          this.loading.set(true);
          return this.provider.search(term);
        })
      )
      .subscribe(results => {
        this.results.set(results);
        this.highlighted.set(0);
        this.loading.set(false);
      });
  }

  @HostListener('window:keydown', ['$event'])
  onShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.open();
    }
  }

  open(): void {
    this.visible.set(true);
    queueMicrotask(() => this.searchInput?.nativeElement.focus());
  }

  close(): void {
    this.visible.set(false);
    this.term.set('');
    this.results.set([]);
    this.highlighted.set(0);
  }

  onTermChange(value: string): void {
    this.term.set(value);
    if (!value || value.trim().length < 2) {
      this.results.set([]);
      this.loading.set(false);
      return;
    }
    this.term$.next(value.trim());
  }

  onKey(event: KeyboardEvent): void {
    const max = this.results().length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlighted.set(Math.min(max, this.highlighted() + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlighted.set(Math.max(0, this.highlighted() - 1));
    } else if (event.key === 'Enter') {
      const current = this.results()[this.highlighted()];
      if (current) this.select(current);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }

  select(result: GlobalSearchResult): void {
    if (result.link) {
      const commands = Array.isArray(result.link) ? result.link : [result.link];
      this.router.navigate(commands).catch(() => void 0);
    }
    this.close();
  }

  get groupedResults(): { category: string; items: GlobalSearchResult[] }[] {
    const buckets = new Map<string, GlobalSearchResult[]>();
    for (const r of this.results()) {
      const list = buckets.get(r.category) ?? [];
      list.push(r);
      buckets.set(r.category, list);
    }
    return Array.from(buckets.entries()).map(([category, items]) => ({ category, items }));
  }

  isHighlighted(result: GlobalSearchResult): boolean {
    return this.results()[this.highlighted()] === result;
  }
}
