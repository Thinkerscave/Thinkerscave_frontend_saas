import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild,
  computed, inject, signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, finalize, of, switchMap } from 'rxjs';
import {
  DefaultGlobalSearchProvider, GlobalSearchProvider, GlobalSearchResult
} from './global-search.provider';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { LoginService } from '../../../core/services/login.service';
import {
  globalSearchPlaceholder,
  resolveGlobalSearchScope,
  roleTokensFromUser
} from '../../../core/utils/workspace-home';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, SkeletonComponent],
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalSearchComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly provider = inject(GlobalSearchProvider, { optional: true }) ?? inject(DefaultGlobalSearchProvider);
  private readonly term$ = new Subject<string>();

  readonly open = signal(false);
  readonly loading = signal(false);
  readonly term = signal('');
  readonly results = signal<GlobalSearchResult[]>([]);
  readonly highlighted = signal(0);

  readonly scope = computed(() =>
    resolveGlobalSearchScope(roleTokensFromUser(this.loginService.getUser()), this.loginService.getLoginContext() === 'PLATFORM')
  );
  readonly visible = computed(() => this.scope() !== 'hidden');
  readonly placeholder = computed(() => globalSearchPlaceholder(this.scope()));

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  constructor() {
    this.term$
      .pipe(
        debounceTime(250),
        switchMap(term => {
          this.loading.set(true);
          return this.provider.search(term).pipe(
            catchError(() => of([])),
            finalize(() => this.loading.set(false))
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(results => {
        this.results.set(results);
        this.highlighted.set(0);
      });
  }

  @HostListener('window:keydown', ['$event'])
  onShortcut(event: KeyboardEvent): void {
    if (!this.visible()) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusInput();
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.closePanel();
    }
  }

  focusInput(): void {
    this.open.set(true);
    queueMicrotask(() => this.searchInput?.nativeElement.focus());
    if (this.term().trim().length >= 2 && !this.results().length && !this.loading()) {
      this.term$.next(this.term().trim());
    }
  }

  closePanel(): void {
    this.open.set(false);
    this.highlighted.set(0);
  }

  clear(): void {
    this.term.set('');
    this.results.set([]);
    this.highlighted.set(0);
    this.searchInput?.nativeElement.focus();
  }

  onTermChange(value: string): void {
    this.term.set(value);
    this.open.set(true);
    if (!value || value.trim().length < 2) {
      this.results.set([]);
      this.loading.set(false);
      return;
    }
    this.term$.next(value.trim());
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closePanel();
      this.searchInput?.nativeElement.blur();
      return;
    }
    const max = this.results().length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open.set(true);
      this.highlighted.set(Math.min(max, this.highlighted() + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlighted.set(Math.max(0, this.highlighted() - 1));
    } else if (event.key === 'Enter') {
      const current = this.results()[this.highlighted()];
      if (current) this.select(current);
    }
  }

  select(result: GlobalSearchResult): void {
    if (result.link) {
      const commands = Array.isArray(result.link) ? result.link : [result.link];
      this.router.navigate(commands).catch(() => void 0);
    }
    this.closePanel();
  }

  get groupedResults(): { category: string; items: GlobalSearchResult[] }[] {
    const buckets = new Map<string, GlobalSearchResult[]>();
    for (const result of this.results()) {
      const list = buckets.get(result.category) ?? [];
      list.push(result);
      buckets.set(result.category, list);
    }
    return Array.from(buckets.entries()).map(([category, items]) => ({ category, items }));
  }

  isHighlighted(result: GlobalSearchResult): boolean {
    return this.results()[this.highlighted()] === result;
  }
}
