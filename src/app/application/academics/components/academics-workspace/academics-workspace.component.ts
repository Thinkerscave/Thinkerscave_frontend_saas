import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { ACADEMICS_PAGES, ACADEMICS_PAGE_RESOURCE, pageConfig } from '../../data/academics-workspace.config';
import { AcademicsPageConfig, AcademicsWorkspacePage } from '../../models/academics-workspace.model';
import { AcademicsOverviewPageComponent } from '../pages/overview/overview.component';
import { AcademicYearPageComponent } from '../pages/academic-year/academic-year.component';
import { ClassesSectionsPageComponent } from '../pages/classes-sections/classes-sections.component';
import { SubjectsMappingPageComponent } from '../pages/subjects-mapping/subjects-mapping.component';
import { TeacherAllocationPageComponent } from '../pages/teacher-allocation/teacher-allocation.component';
import { TimetablePageComponent } from '../pages/timetable/timetable.component';
import { MyClassesPageComponent } from '../pages/my-classes/my-classes.component';
import { MyTimetablePageComponent } from '../pages/my-timetable/my-timetable.component';
import { AcademicStructurePageComponent } from '../pages/academic-structure/academic-structure.component';
import { MyAcademicsPageComponent } from '../pages/my-academics/my-academics.component';
import { PermissionService } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-academics-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    AcademicsOverviewPageComponent,
    AcademicYearPageComponent,
    ClassesSectionsPageComponent,
    SubjectsMappingPageComponent,
    TeacherAllocationPageComponent,
    TimetablePageComponent,
    MyClassesPageComponent,
    MyTimetablePageComponent,
    AcademicStructurePageComponent,
    MyAcademicsPageComponent
  ],
  template: `
    <div class="academics-workspace">
      <nav class="academics-nav" *ngIf="pages.length > 1">
        <a *ngFor="let item of pages"
           [routerLink]="item.route"
           routerLinkActive="is-active"
           class="academics-nav__link">
          <i [class]="item.icon"></i>
          {{ item.label }}
        </a>
      </nav>

      <main class="academics-main">
        <ng-container *ngIf="activePage === 'overview'"><app-academics-overview-page></app-academics-overview-page></ng-container>
        <ng-container *ngIf="activePage === 'academic-year'"><app-academic-year-page></app-academic-year-page></ng-container>
        <ng-container *ngIf="activePage === 'classes-sections'"><app-classes-sections-page></app-classes-sections-page></ng-container>
        <ng-container *ngIf="activePage === 'subjects-mapping'"><app-subjects-mapping-page></app-subjects-mapping-page></ng-container>
        <ng-container *ngIf="activePage === 'teacher-allocation'"><app-teacher-allocation-page></app-teacher-allocation-page></ng-container>
        <ng-container *ngIf="activePage === 'timetable'"><app-timetable-page></app-timetable-page></ng-container>
        <ng-container *ngIf="activePage === 'my-classes'"><app-my-classes-page></app-my-classes-page></ng-container>
        <ng-container *ngIf="activePage === 'my-timetable'"><app-my-timetable-page></app-my-timetable-page></ng-container>
        <ng-container *ngIf="activePage === 'academic-structure'"><app-academic-structure-page></app-academic-structure-page></ng-container>
        <ng-container *ngIf="activePage === 'my-academics'"><app-my-academics-page></app-my-academics-page></ng-container>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .academics-workspace { min-height: calc(100vh - 72px); padding: 1rem 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .academics-nav { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.25rem; border-bottom: 1px solid var(--tc-border); }
    .academics-nav__link { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.55rem 0.9rem; border-radius: 8px; color: var(--tc-text-muted); text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: all 0.15s; }
    .academics-nav__link:hover { background: var(--tc-bg-muted); color: var(--tc-text); }
    .academics-nav__link.is-active { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
    .academics-main { flex: 1; }
  `]
})
export class AcademicsWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly permissions = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  pages: AcademicsPageConfig[] = [];
  activePage: AcademicsWorkspacePage = 'overview';

  get currentPage() {
    return pageConfig(this.activePage);
  }

  ngOnInit(): void {
    this.refreshPages();
    this.permissions.loadPermissions().subscribe({
      next: () => this.refreshPages(),
      error: () => this.refreshPages()
    });

    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.activePage = (data['workspacePage'] as AcademicsWorkspacePage | undefined) ?? 'overview';
      this.cdr.markForCheck();
    });
  }

  private refreshPages(): void {
    const allowed = ACADEMICS_PAGES.filter((p) =>
      this.permissions.canView(ACADEMICS_PAGE_RESOURCE[p.page])
    );
    // Never dump every role page into the nav. If permissions are still empty,
    // show the admin core set only (matches Figma operator shell).
    this.pages = allowed.length
      ? allowed
      : ACADEMICS_PAGES.filter((p) =>
          ['overview', 'academic-year', 'classes-sections', 'subjects-mapping', 'teacher-allocation', 'timetable']
            .includes(p.page)
        );
    this.cdr.markForCheck();
  }
}
