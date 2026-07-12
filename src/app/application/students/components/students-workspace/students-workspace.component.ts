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
    <div class="tc-page-shell">
      <nav class="tc-workspace-nav" aria-label="Students module">
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
      <main class="students-workspace-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tc-page-shell {
      padding: var(--tc-space-2) 0;
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
