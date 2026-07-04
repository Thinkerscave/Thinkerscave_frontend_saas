import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadCrumbService } from '../../../core/services/bread-crumb.service';
import { RoleDashboardRendererComponent } from '../components/shared/dashboard-primitives.component';
import { DashboardActionTarget, DashboardSearchResult, DashboardWorkspace } from '../models/dashboard-workspace.model';
import { DashboardWorkspaceService } from '../services/dashboard-workspace.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RoleDashboardRendererComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  workspace: DashboardWorkspace | null = null;
  loading = true;
  errorMessage = '';
  searchQuery = '';
  searchResults: DashboardSearchResult[] = [];
  searchLoading = false;
  selectedResult: DashboardSearchResult | null = null;

  constructor(
    private breadcrumbService: BreadCrumbService,
    private dashboardService: DashboardWorkspaceService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumb('Dashboard', '');
    this.setGreeting();
    this.loadWorkspace();
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️ Good morning,';
    if (hour < 17) return '🌤️ Good afternoon,';
    return '🌙 Good evening,';
  }

  private setGreeting() {
    // Just a placeholder method if we need interval updates later
  }

  getPrimaryActionLabel(): string {
    if (!this.workspace) return 'New Action';
    const role = this.workspace.context.primaryRoleName.toLowerCase();
    if (role.includes('admin')) return 'New Inquiry';
    if (role.includes('teacher')) return 'Mark Attendance';
    if (role.includes('student')) return 'Submit Assignment';
    return 'New Request';
  }

  primaryActionClicked(): void {
    if (!this.workspace) return;
    const role = this.workspace.context.primaryRoleName.toLowerCase();
    if (role.includes('admin')) {
      this.router.navigate(['/app/admissions/leads']);
    } else if (role.includes('teacher')) {
      this.router.navigate(['/app/attendance/students']);
    } else if (role.includes('student')) {
      this.router.navigate(['/app/students/directory']);
    } else {
      this.loadWorkspace();
    }
  }

  loadWorkspace(): void {
    this.loading = true;
    this.errorMessage = '';

    this.dashboardService.loadWorkspace()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: workspace => this.workspace = workspace,
        error: () => this.errorMessage = 'Dashboard could not be loaded'
      });
  }

  onSearchChanged(query: string): void {
    this.searchQuery = query;
    this.selectedResult = null;

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    if (query.trim().length < 2) {
      this.searchResults = [];
      this.searchLoading = false;
      return;
    }

    this.searchLoading = true;
    this.searchTimer = setTimeout(() => {
      this.dashboardService.search(query)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.searchLoading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: response => this.searchResults = response.results,
          error: () => this.searchResults = []
        });
    }, 220);
  }

  onResultSelected(result: DashboardSearchResult): void {
    this.selectedResult = result;
  }

  closeResult(): void {
    this.selectedResult = null;
  }

  openRoute(route: string | null): void {
    if (!route) {
      return;
    }
    this.selectedResult = null;
    this.router.navigateByUrl(route);
  }

  onActionSelected(target: DashboardActionTarget): void {
    const route = this.valueOf(target, 'route');
    if (route) {
      this.openRoute(route);
      return;
    }

    this.selectedResult = this.targetToResult(target);
  }

  private targetToResult(target: DashboardActionTarget): DashboardSearchResult {
    const title = this.valueOf(target, 'label') || this.valueOf(target, 'title') || 'Dashboard item';
    const detail = this.valueOf(target, 'description') || this.valueOf(target, 'detail');
    const entityType = this.valueOf(target, 'entityType') || 'Dashboard';
    const entityId = this.valueOf(target, 'entityId') || this.valueOf(target, 'key') || title;
    const subtitle = this.valueOf(target, 'dueLabel') || this.valueOf(target, 'status') || this.countLabel(target);
    const icon = this.valueOf(target, 'icon') || 'pi pi-arrow-up-right';
    const route = this.valueOf(target, 'route');
    const tone = this.valueOf(target, 'tone') || 'neutral';

    return {
      key: `dashboard-${entityId}`,
      entityType,
      entityId,
      title,
      subtitle,
      detail,
      icon,
      route,
      tone,
      metadata: this.targetMetadata(target)
    };
  }

  metadataEntries(result: DashboardSearchResult): {key: string, value: string}[] {
    if (!result || !result.metadata) return [];
    return Object.entries(result.metadata).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  }

  private targetMetadata(target: DashboardActionTarget): Record<string, unknown> {
    const record = target as unknown as Record<string, unknown>;
    return Object.entries(record)
      .filter(([key, value]) => value !== null && value !== undefined && !['icon', 'route', 'tone'].includes(key))
      .reduce<Record<string, unknown>>((metadata, [key, value]) => {
        metadata[key] = value;
        return metadata;
      }, {});
  }

  private valueOf(target: DashboardActionTarget, key: string): string | null {
    const value = (target as unknown as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim().length ? value : null;
  }

  private countLabel(target: DashboardActionTarget): string | null {
    const count = (target as unknown as Record<string, unknown>)['count'];
    return typeof count === 'number' ? String(count) : null;
  }
}
