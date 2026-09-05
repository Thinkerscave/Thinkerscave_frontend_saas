import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { COMMUNICATION_PAGES } from '../../data/communication-workspace.config';

@Component({
  selector: 'app-communication-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="comm-shell">
      <nav class="comm-nav" aria-label="Communication workspace">
        @for (item of pages; track item.page) {
          <a
            [routerLink]="item.route"
            routerLinkActive="is-active"
            class="comm-nav__link"
            [attr.aria-current]="activePage === item.page ? 'page' : null"
          >
            <i [class]="item.icon" aria-hidden="true"></i>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
      <main class="comm-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .comm-shell {
      min-height: calc(100vh - 72px);
      padding: 0.75rem 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .comm-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      padding: 0.35rem;
      border-bottom: 1px solid var(--tc-border);
      position: sticky;
      top: 0;
      z-index: 5;
      background: color-mix(in srgb, var(--tc-surface-0) 92%, transparent);
      backdrop-filter: blur(8px);
    }
    .comm-nav__link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 0.9rem;
      border-radius: 10px;
      color: var(--tc-text-muted);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: background 0.15s ease, color 0.15s ease;
      white-space: nowrap;
    }
    .comm-nav__link:hover {
      background: var(--tc-surface-hover, var(--tc-bg-muted));
      color: var(--tc-text);
    }
    .comm-nav__link.is-active {
      background: color-mix(in srgb, var(--tc-primary-600) 12%, transparent);
      color: var(--tc-primary-600);
      font-weight: 600;
    }
    .comm-main { flex: 1; min-width: 0; }
    @media (max-width: 640px) {
      .comm-shell { padding: 0.5rem 0.75rem 1rem; }
      .comm-nav { overflow-x: auto; flex-wrap: nowrap; }
    }
  `]
})
export class CommunicationWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pages = COMMUNICATION_PAGES;
  activePage = 'notices';

  ngOnInit(): void {
    this.route.firstChild?.url
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(segments => {
        this.activePage = segments[0]?.path ?? 'notices';
        this.cdr.markForCheck();
      });
  }
}

