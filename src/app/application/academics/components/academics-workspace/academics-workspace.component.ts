import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ACADEMICS_PAGES, ACADEMICS_PAGE_RESOURCE } from '../../data/academics-workspace.config';
import { AcademicsPageConfig } from '../../models/academics-workspace.model';
import { PermissionService } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-academics-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="academics-workspace">
      <nav class="academics-nav" *ngIf="pages.length > 1" aria-label="Academics sections">
        <a *ngFor="let item of pages"
           [routerLink]="item.route"
           routerLinkActive="is-active"
           class="academics-nav__link">
          <i [class]="item.icon"></i>
          <span>{{ item.label }}</span>
        </a>
      </nav>

      <main class="academics-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .academics-workspace { display: flex; flex-direction: column; gap: var(--tc-space-4, 1rem); }
    .academics-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      padding: 0.35rem;
      border-bottom: 1px solid var(--tc-border);
    }
    .academics-nav__link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 0.95rem;
      border-radius: var(--tc-radius-md, 8px);
      color: var(--tc-text-muted);
      font-size: var(--tc-font-size-sm, 0.875rem);
      font-weight: 500;
      white-space: nowrap;
      text-decoration: none;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .academics-nav__link i { font-size: 1rem; }
    .academics-nav__link:hover:not(.is-active) { background: var(--tc-surface-hover, var(--tc-bg-muted)); color: var(--tc-text); }
    .academics-nav__link.is-active { background: var(--tc-primary-50, rgba(37,99,235,.1)); color: var(--tc-primary-600, #2563eb); }
    .academics-main { flex: 1; min-width: 0; }
  `]
})
export class AcademicsWorkspaceComponent implements OnInit {
  private readonly permissions = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  pages: AcademicsPageConfig[] = [];

  ngOnInit(): void {
    this.refreshPages();
    this.permissions.loadPermissions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.refreshPages(),
        error: () => this.refreshPages()
      });
  }

  private refreshPages(): void {
    this.pages = ACADEMICS_PAGES.filter((p) =>
      this.permissions.canView(ACADEMICS_PAGE_RESOURCE[p.page])
    );
    this.cdr.markForCheck();
  }
}
