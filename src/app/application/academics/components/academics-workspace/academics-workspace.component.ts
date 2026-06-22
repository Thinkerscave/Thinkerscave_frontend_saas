import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';
import {
  ACADEMICS_PAGES,
} from '../../data/academics-workspace.config';
import {
  AcademicsActionMode,
  AcademicsWorkspaceData,
  AcademicsWorkspacePage
} from '../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../services/academics-workspace.service';
import { AcademicSetupPageComponent } from '../pages/setup/setup.component';
import { AcademicTimetablePageComponent } from '../pages/timetable/timetable.component';
import { AcademicTeacherArrangementPageComponent } from '../pages/teacher-arrangement/teacher-arrangement.component';
import { AcademicCalendarPageComponent } from '../pages/calendar/calendar.component';
import { AcademicSyllabusPageComponent } from '../pages/syllabus/syllabus.component';

@Component({
  selector: 'app-academics-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    AcademicSetupPageComponent,
    AcademicTimetablePageComponent,
    AcademicTeacherArrangementPageComponent,
    AcademicCalendarPageComponent,
    AcademicSyllabusPageComponent
  ],
  template: `
    <div class="academics-workspace">
      <main class="academics-main">
        <div class="academics-loading" *ngIf="loading">
          <div class="loading-spinner"></div>
          <span>Loading academics data...</span>
        </div>

        <ng-container *ngIf="!loading">
          <ng-container [ngSwitch]="activePage">
            <app-academic-setup-page
              *ngSwitchCase="'setup'"
              [data]="data"
              (dataChanged)="refresh()">
            </app-academic-setup-page>

            <app-academic-timetable-page
              *ngSwitchCase="'timetable'"
              [data]="data"
              (dataChanged)="refresh()">
            </app-academic-timetable-page>

            <app-academic-teacher-arrangement-page
              *ngSwitchCase="'teacher-arrangement'"
              [data]="data"
              (dataChanged)="refresh()">
            </app-academic-teacher-arrangement-page>

            <app-academic-calendar-page
              *ngSwitchCase="'calendar'"
              [data]="data"
              (dataChanged)="refresh()">
            </app-academic-calendar-page>

            <app-academic-syllabus-page
              *ngSwitchCase="'syllabus'"
              [data]="data"
              (dataChanged)="refresh()">
            </app-academic-syllabus-page>
          </ng-container>
        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .academics-workspace { min-height: calc(100vh - 72px); }
    .academics-main { padding: 1rem 1.25rem; }
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
  activePage: AcademicsWorkspacePage = 'setup';
  loading = true;

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.activePage = (data['workspacePage'] as AcademicsWorkspacePage | undefined) ?? 'setup';
      this.cdr.markForCheck();
    });
    this.refresh();
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

  onAction(_mode: AcademicsActionMode): void {}

  private emptyData(): AcademicsWorkspaceData {
    return {
      academicYears: [], currentYear: null, classes: [], sections: [], subjects: [],
      staff: [], teacherAllocations: [], classTeacherAssignments: [], timetableSlots: [],
      calendarEvents: [], academicSettings: [], syllabi: [], shifts: [], periodTemplates: [],
      teacherAbsences: [], timetableConflicts: [], syllabusProgress: null
    };
  }
}