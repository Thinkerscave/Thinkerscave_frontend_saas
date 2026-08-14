import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';
import { ACADEMICS_PAGES, pageConfig } from '../../data/academics-workspace.config';
import {
  AcademicsWorkspaceData,
  AcademicsWorkspacePage
} from '../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../services/academics-workspace.service';
import { AcademicYearPageComponent } from '../pages/academic-year/academic-year.component';
import { ClassesSectionsPageComponent } from '../pages/classes-sections/classes-sections.component';
import { AcademicTimetablePageComponent } from '../pages/timetable/timetable.component';
import { AcademicTeacherArrangementPageComponent } from '../pages/teacher-arrangement/teacher-arrangement.component';
import { AcademicCalendarPageComponent } from '../pages/calendar/calendar.component';
import { AcademicSyllabusPageComponent } from '../pages/syllabus/syllabus.component';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';

@Component({
  selector: 'app-academics-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    ToastModule,
    SaasPageHeaderComponent,
    AcademicYearPageComponent,
    ClassesSectionsPageComponent,
    AcademicTimetablePageComponent,
    AcademicTeacherArrangementPageComponent,
    AcademicCalendarPageComponent,
    AcademicSyllabusPageComponent
  ],
  template: `
    <div class="academics-workspace">
      <tc-saas-page-header
        *ngIf="!isStandalonePage"
        [title]="currentPage.title"
        [subtitle]="currentPage.description">
      </tc-saas-page-header>

      <nav class="academics-nav">
        <a *ngFor="let item of pages"
           [routerLink]="item.route"
           routerLinkActive="is-active"
           class="academics-nav__link">
          <i [class]="item.icon"></i>
          {{ item.label }}
        </a>
      </nav>

      <main class="academics-main">
        <ng-container *ngIf="activePage === 'academic-year'">
          <app-academic-year-page></app-academic-year-page>
        </ng-container>

        <ng-container *ngIf="activePage === 'classes-sections'">
          <app-classes-sections-page></app-classes-sections-page>
        </ng-container>

        <ng-container *ngIf="!isStandalonePage">
          <div class="academics-loading" *ngIf="loading">
            <div class="loading-spinner"></div>
            <span>Loading academics data...</span>
          </div>

          <ng-container *ngIf="!loading">
            <ng-container [ngSwitch]="activePage">
              <app-academic-timetable-page
                *ngSwitchCase="'timetable'"
                [data]="data"
                (dataChanged)="refresh(selectedYearId)">
              </app-academic-timetable-page>

              <app-academic-teacher-arrangement-page
                *ngSwitchCase="'teacher-arrangement'"
                [data]="data"
                (dataChanged)="refresh(selectedYearId)">
              </app-academic-teacher-arrangement-page>

              <app-academic-calendar-page
                *ngSwitchCase="'calendar'"
                [data]="data"
                (dataChanged)="refresh(selectedYearId)">
              </app-academic-calendar-page>

              <app-academic-syllabus-page
                *ngSwitchCase="'syllabus'"
                [data]="data"
                (dataChanged)="refresh(selectedYearId)">
              </app-academic-syllabus-page>
            </ng-container>
          </ng-container>
        </ng-container>
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
    .academics-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 0.75rem; color: var(--tc-text-muted); font-size: 0.9rem; }
    .loading-spinner { width: 32px; height: 32px; border: 3px solid var(--tc-border); border-top-color: var(--tc-primary-600); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AcademicsWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly workspaceService = inject(AcademicsWorkspaceService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pages = ACADEMICS_PAGES;

  data: AcademicsWorkspaceData = this.emptyData();
  activePage: AcademicsWorkspacePage = 'academic-year';
  selectedYearId?: number;
  loading = true;

  get currentPage() {
    return pageConfig(this.activePage);
  }

  get isStandalonePage(): boolean {
    return this.activePage === 'academic-year' || this.activePage === 'classes-sections';
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.activePage = (data['workspacePage'] as AcademicsWorkspacePage | undefined) ?? 'academic-year';
      this.cdr.markForCheck();
      if (this.isStandalonePage) {
        this.loading = false;
      } else {
        this.refresh();
      }
    });
  }

  onYearChanged(yearId: number): void {
    this.selectedYearId = yearId;
    this.refresh(yearId);
  }

  refresh(yearId?: number): void {
    this.loading = true;
    this.workspaceService.loadWorkspaceData(yearId ?? this.selectedYearId)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.data = data;
          if (!this.selectedYearId && data.currentYear) {
            this.selectedYearId = data.currentYear.academicYearId ?? data.currentYear.id;
          }
        },
        error: () => {
          this.data = this.emptyData();
          this.messageService.add({ severity: 'error', summary: 'Academics unavailable', detail: 'Unable to load academic workspace data.' });
        }
      });
  }

  private emptyData(): AcademicsWorkspaceData {
    return {
      academicYears: [], currentYear: null, classes: [], sections: [], subjects: [],
      staff: [], teacherAllocations: [], classTeacherAssignments: [], timetableSlots: [],
      calendarEvents: [], academicSettings: [], syllabi: [], shifts: [], periodTemplates: [],
      teacherAbsences: [], timetableConflicts: [], syllabusProgress: null
    };
  }
}

