import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import {
  ACADEMICS_NAV_GROUPS,
  ACADEMICS_PAGES,
  pageConfig
} from '../../data/academics-workspace.config';
import {
  AcademicsActionMode,
  AcademicsWorkspaceData,
  AcademicsWorkspacePage
} from '../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../services/academics-workspace.service';
import { AcademicSetupPageComponent } from '../pages/setup/academic-setup-page.component';
import { AcademicTimetablePageComponent } from '../pages/timetable/academic-timetable-page.component';
import { AcademicTeacherArrangementPageComponent } from '../pages/teacher-arrangement/academic-teacher-arrangement-page.component';
import { AcademicCalendarPageComponent } from '../pages/calendar/academic-calendar-page.component';
import { AcademicSyllabusPageComponent } from '../pages/syllabus/academic-syllabus-page.component';

@Component({
  selector: 'app-academics-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AcademicSetupPageComponent,
    AcademicTimetablePageComponent,
    AcademicTeacherArrangementPageComponent,
    AcademicCalendarPageComponent,
    AcademicSyllabusPageComponent
  ],
  template: `
    <div class="academics-workspace">
      <!-- Navigation -->
      <nav class="academics-nav">
        <div class="academics-nav-header">
          <i class="pi pi-book"></i>
          <div>
            <strong>Academics</strong>
            <small>Module</small>
          </div>
        </div>
        <div class="academics-nav-links">
          <a *ngFor="let navPage of pages"
            class="academics-nav-link"
            [class.active]="activePage === navPage.page"
            [routerLink]="navPage.route">
            <i [ngClass]="navPage.icon"></i>
            <span>{{ navPage.label }}</span>
          </a>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="academics-main">
        <div class="academics-loading" *ngIf="loading">
          <div class="academics-loading-spinner"></div>
          <span>Loading academics data...</span>
        </div>

        <ng-container *ngIf="!loading">
          <ng-container [ngSwitch]="activePage">
            <app-academic-setup-page
              *ngSwitchCase="'setup'"
              [data]="data"
              (actionRequested)="onAction($event)"
              (dataChanged)="refresh()">
            </app-academic-setup-page>

            <app-academic-timetable-page
              *ngSwitchCase="'timetable'"
              [data]="data"
              (actionRequested)="onAction($event)"
              (dataChanged)="refresh()">
            </app-academic-timetable-page>

            <app-academic-teacher-arrangement-page
              *ngSwitchCase="'teacher-arrangement'"
              [data]="data"
              (actionRequested)="onAction($event)"
              (dataChanged)="refresh()">
            </app-academic-teacher-arrangement-page>

            <app-academic-calendar-page
              *ngSwitchCase="'calendar'"
              [data]="data"
              (actionRequested)="onAction($event)"
              (dataChanged)="refresh()">
            </app-academic-calendar-page>

            <app-academic-syllabus-page
              *ngSwitchCase="'syllabus'"
              [data]="data"
              (actionRequested)="onAction($event)"
              (dataChanged)="refresh()">
            </app-academic-syllabus-page>
          </ng-container>
        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .academics-workspace { display: grid; grid-template-columns: 220px 1fr; gap: 0; height: 100%; min-height: calc(100vh - 72px); }
    .academics-nav { background: var(--tc-surface-card); border-right: 1px solid var(--tc-border); padding: 1rem 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; }
    .academics-nav-header { display: grid; grid-template-columns: 36px 1fr; gap: 0.65rem; align-items: center; padding: 0.5rem 0.65rem; margin-bottom: 0.5rem; }
    .academics-nav-header i { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1)); color: var(--tc-primary-600); font-size: 1.1rem; }
    .academics-nav-header strong { display: block; font-size: 0.95rem; color: var(--tc-heading); }
    .academics-nav-header small { display: block; font-size: 0.7rem; color: var(--tc-text-muted); margin-top: 0.1rem; }
    .academics-nav-links { display: flex; flex-direction: column; gap: 0.25rem; }
    .academics-nav-link { display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem 0.75rem; border-radius: 8px; color: var(--tc-text); text-decoration: none; font-size: 0.88rem; font-weight: 500; transition: all 0.2s; }
    .academics-nav-link:hover { background: var(--tc-bg-muted); }
    .academics-nav-link.active { background: rgba(99, 102, 241, 0.1); color: var(--tc-primary-600); font-weight: 600; }
    .academics-nav-link i { width: 20px; text-align: center; font-size: 0.95rem; }
    .academics-main { padding: 1.5rem; overflow-y: auto; background: var(--tc-bg); }
    .academics-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1rem; color: var(--tc-text-muted); }
    .academics-loading-spinner { width: 40px; height: 40px; border: 3px solid var(--tc-border); border-top-color: var(--tc-primary-600); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 1024px) { .academics-workspace { grid-template-columns: 1fr; } .academics-nav { display: none; } }
  `]
})
export class AcademicsWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workspaceService = inject(AcademicsWorkspaceService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pages = ACADEMICS_PAGES;
  readonly navGroups = ACADEMICS_NAV_GROUPS;

  data: AcademicsWorkspaceData = this.emptyData();
  activePage: AcademicsWorkspacePage = 'setup';
  loading = true;

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.activePage = (data['workspacePage'] as AcademicsWorkspacePage | undefined) ?? 'setup';
      this.cdr.markForCheck();
    });
    this.refresh();
  }

  get page() {
    return pageConfig(this.activePage);
  }

  refresh(): void {
    this.loading = true;
    this.workspaceService.loadWorkspaceData()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => this.data = data,
        error: () => {
          this.data = this.emptyData();
          this.messageService.add({ severity: 'error', summary: 'Academics unavailable', detail: 'Unable to load academic workspace data.' });
        }
      });
  }

  onAction(mode: AcademicsActionMode): void {
    // Actions are handled within each page component directly
  }

  private emptyData(): AcademicsWorkspaceData {
    return {
      academicYears: [],
      currentYear: null,
      classes: [],
      sections: [],
      subjects: [],
      staff: [],
      teacherAllocations: [],
      classTeacherAssignments: [],
      timetableSlots: [],
      calendarEvents: [],
      academicSettings: [],
      syllabi: [],
      shifts: [],
      periodTemplates: [],
      teacherAbsences: [],
      timetableConflicts: [],
      syllabusProgress: null
    };
  }
}