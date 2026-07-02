import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { STUDENTS_PAGES } from '../../data/students-workspace.config';
import { StudentsWorkspacePage } from '../../models/students-workspace-nav.model';

@Component({
  selector: 'app-students-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="students-workspace-shell">
      <nav class="students-workspace-nav" aria-label="Students module">
        @for (item of pages; track item.page) {
          <a
            [routerLink]="item.route"
            routerLinkActive="is-active"
            class="students-workspace-nav__link"
            [attr.aria-current]="activePage === item.page ? 'page' : null"
          >
            <i [class]="item.icon" aria-hidden="true"></i>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
      <main class="students-workspace-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .students-workspace-shell {
      min-height: calc(100vh - 72px);
      padding: 0.75rem 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .students-workspace-nav {
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
    .students-workspace-nav__link {
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
    .students-workspace-nav__link:hover {
      background: var(--tc-surface-hover, var(--tc-bg-muted));
      color: var(--tc-text);
    }
    .students-workspace-nav__link.is-active {
      background: color-mix(in srgb, var(--tc-primary-600) 12%, transparent);
      color: var(--tc-primary-600);
      font-weight: 600;
    }
    .students-workspace-main { flex: 1; min-width: 0; }
    @media (max-width: 640px) {
      .students-workspace-shell { padding: 0.5rem 0.75rem 1rem; }
      .students-workspace-nav { gap: 0.25rem; overflow-x: auto; flex-wrap: nowrap; }
      .students-workspace-nav__link { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
    }
  `]
})
export class StudentsWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly pages = STUDENTS_PAGES;
  activePage: StudentsWorkspacePage = 'directory';

  ngOnInit(): void {
    this.route.firstChild?.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.activePage = (data['workspacePage'] as StudentsWorkspacePage) ?? 'directory';
        this.cdr.markForCheck();
      });
  }
}
