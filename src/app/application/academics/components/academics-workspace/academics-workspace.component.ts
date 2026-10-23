import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AcademicYearContextService } from '../../../../shared/services/academic-year-context.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { ACADEMIC_YEAR_RESOURCE } from '../../models/academic-year.model';
import { ACADEMICS_PAGES } from '../../data/academics-workspace.config';

/**
 * Thin Academics shell — navigation lives in the app side menu only
 * (matches Organization / Customer UX; no duplicate top tabs).
 * Year-scoped routes (`requiresYear`) show a single empty state when no academic year exists.
 */
@Component({
  selector: 'app-academics-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet, EmptyStateComponent, TcPageSkeletonComponent],
  template: `
    <div class="academics-workspace">
      @switch (gate().state) {
        @case ('loading') {
          <tc-page-skeleton variant="dashboard" [kpis]="4"></tc-page-skeleton>
        }
        @case ('empty') {
          <app-empty-state
            icon="pi pi-calendar"
            [title]="gate().title"
            [message]="gate().message"
            [actionLabel]="gate().canCreate ? 'Set up academic year' : null"
            (action)="setupAcademicYear()">
          </app-empty-state>
        }
        @default {
          <router-outlet></router-outlet>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .academics-workspace {
      min-width: 0;
      animation: acad-shell-in 260ms var(--tc-anim-easing, cubic-bezier(0.22, 1, 0.36, 1));
    }
    @keyframes acad-shell-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AcademicsWorkspaceComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly yearContext = inject(AcademicYearContextService);
  private readonly permissions = inject(PermissionService);

  private readonly pageData = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.deepestRouteData())
    ),
    { initialValue: this.deepestRouteData() }
  );

  /** Re-evaluates the gate when effective permissions are (re)loaded. */
  private readonly permissionsVersion = toSignal(this.permissions.permissionsLoaded$, {
    initialValue: this.permissions.isLoaded()
  });

  readonly gate = computed(() => {
    const data = this.pageData();
    this.permissionsVersion();
    const pageTitle = ACADEMICS_PAGES.find((p) => p.page === data['workspacePage'])?.title ?? 'This page';
    const canCreate = this.permissions.canManage(ACADEMIC_YEAR_RESOURCE);
    if (data['requiresYear'] !== true) {
      return { state: 'open' as const, title: '', message: '', canCreate };
    }
    if (!this.yearContext.ready()) {
      return { state: 'loading' as const, title: '', message: '', canCreate };
    }
    if (this.yearContext.years().length) {
      return { state: 'open' as const, title: '', message: '', canCreate };
    }
    return {
      state: 'empty' as const,
      title: `${pageTitle} needs an academic year`,
      message: canCreate
        ? 'No academic year is set up yet. Create one first, then this page will show its data.'
        : 'No academic year is set up yet. Ask an administrator to set up an academic year.',
      canCreate
    };
  });

  constructor() {
    this.yearContext.ensureLoaded().subscribe();
  }

  setupAcademicYear(): void {
    this.router.navigateByUrl('/app/academics/academic-year');
  }

  private deepestRouteData(): Record<string, unknown> {
    let snapshot = this.route.snapshot;
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }
    return snapshot.data ?? {};
  }
}

