import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { STAFF_PAGES, staffPageConfig } from '../../data/staff-workspace.config';
import { StaffWorkspacePage } from '../../models/staff-workspace.model';

@Component({
  selector: 'app-staff-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="tc-page-shell">
      <nav class="tc-workspace-nav" aria-label="Staff module">
        @for (item of pages; track item.page) {
          <a
            [routerLink]="item.route"
            routerLinkActive="is-active"
            class="tc-workspace-nav__link"
            [attr.aria-current]="activePage === item.page ? 'page' : null"
          >
            <i [class]="item.icon" aria-hidden="true"></i>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
      <main class="tc-workspace-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tc-workspace-main { flex: 1; min-width: 0; }
  `]
})
export class StaffWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly pages = STAFF_PAGES;
  activePage: StaffWorkspacePage = 'directory';

  ngOnInit(): void {
    this.route.firstChild?.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.activePage = (data['workspacePage'] as StaffWorkspacePage) ?? 'directory';
        this.cdr.markForCheck();
      });
  }

  currentConfig() {
    return staffPageConfig(this.activePage);
  }
}
