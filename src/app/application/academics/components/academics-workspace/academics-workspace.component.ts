import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject , ChangeDetectionStrategy} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Observable, finalize } from 'rxjs';
import {
  ACADEMICS_NAV_GROUPS,
  ACADEMICS_PAGES,
  ACADEMICS_QUICK_ACTIONS,
  actionModeLabel,
  pageConfig
} from '../../data/academics-workspace.config';
import {
  AcademicCalendarEventModel,
  AcademicClass,
  AcademicSection,
  AcademicSettingModel,
  AcademicYear,
  AcademicsActionMode,
  AcademicsQuickAction,
  AcademicsWorkspaceData,
  AcademicsWorkspacePage,
  ClassTeacherAssignmentModel,
  StaffModel,
  SubjectModel,
  TeacherAllocationModel,
  TimetableSlotModel
} from '../../models/academics-workspace.model';
import { AcademicsInsightsService } from '../../services/academics-insights.service';
import { AcademicsWorkspaceService } from '../../services/academics-workspace.service';
import { AcademicAllocationPageComponent } from '../pages/allocation/academic-allocation-page.component';
import { AcademicCalendarPageComponent } from '../pages/calendar/academic-calendar-page.component';
import { AcademicClassesPageComponent } from '../pages/classes/academic-classes-page.component';
import { AcademicCurriculumPageComponent } from '../pages/curriculum/academic-curriculum-page.component';
import { AcademicDashboardPageComponent } from '../pages/dashboard/academic-dashboard-page.component';
import { AcademicHierarchyPageComponent } from '../pages/hierarchy/academic-hierarchy-page.component';
import { AcademicSettingsPageComponent } from '../pages/settings/academic-settings-page.component';
import { AcademicSubjectsPageComponent } from '../pages/subjects/academic-subjects-page.component';
import { AcademicSyllabusPageComponent } from '../pages/syllabus/academic-syllabus-page.component';
import { AcademicTimetablePageComponent } from '../pages/timetable/academic-timetable-page.component';
import { AcademicYearsPageComponent } from '../pages/years/academic-years-page.component';
import { AcademicActionDrawerComponent } from '../shared/action-drawer/academic-action-drawer.component';
import { AcademicQuickActionBarComponent } from '../shared/quick-action-bar/quick-action-bar.component';
import { AcademicSmartHeroComponent } from '../shared/smart-hero/smart-hero.component';
import { AcademicWorkspaceNavComponent } from '../shared/workspace-nav/workspace-nav.component';
import { AutofocusDirective } from '../../../../shared/directives';

interface AcademicCommand {
  label: string;
  helper: string;
  icon: string;
  route?: string;
  actionMode?: AcademicsActionMode;
}

@Component({
  selector: 'app-academics-workspace',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AcademicSmartHeroComponent,
    AcademicQuickActionBarComponent,
    AcademicWorkspaceNavComponent,
    AcademicActionDrawerComponent,
    AcademicDashboardPageComponent,
    AcademicYearsPageComponent,
    AcademicClassesPageComponent,
    AcademicSubjectsPageComponent,
    AcademicCurriculumPageComponent,
    AcademicSyllabusPageComponent,
    AcademicAllocationPageComponent,
    AcademicTimetablePageComponent,
    AcademicCalendarPageComponent,
    AcademicHierarchyPageComponent,
    AcademicSettingsPageComponent,
    AutofocusDirective
  ],
  templateUrl: './academics-workspace.component.html'
})
export class AcademicsWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workspaceService = inject(AcademicsWorkspaceService);
  private readonly insightsService = inject(AcademicsInsightsService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pages = ACADEMICS_PAGES;
  readonly navGroups = ACADEMICS_NAV_GROUPS;

  data: AcademicsWorkspaceData = this.emptyData();
  activePage: AcademicsWorkspacePage = 'dashboard';
  loading = true;
  saving = false;
  commandOpen = false;
  commandQuery = '';
  drawerOpen = false;
  activeActionMode: AcademicsActionMode = 'class';

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.activePage = (data['workspacePage'] as AcademicsWorkspacePage | undefined) ?? 'dashboard';
    });

    this.refresh();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.commandOpen = true;
    }

    if (event.key === 'Escape') {
      this.commandOpen = false;
    }
  }

  get page() {
    return pageConfig(this.activePage);
  }

  get metrics() {
    return this.insightsService.metrics(this.data);
  }

  get insights() {
    return this.insightsService.insights(this.data);
  }

  get alerts() {
    return this.insightsService.alerts(this.data);
  }

  get activities() {
    return this.insightsService.activities(this.data);
  }

  get distribution() {
    return this.insightsService.subjectDistribution(this.data);
  }

  get workloads() {
    return this.insightsService.workloads(this.data);
  }

  get health(): number {
    return this.insightsService.academicHealth(this.data);
  }

  get quickActions(): AcademicsQuickAction[] {
    const contextual = ACADEMICS_QUICK_ACTIONS.filter(action => action.pages.includes(this.activePage));
    return contextual.length ? contextual : ACADEMICS_QUICK_ACTIONS.slice(0, 5);
  }

  get commands(): AcademicCommand[] {
    const query = this.commandQuery.trim().toLowerCase();
    const pageCommands = this.pages.map(item => ({ label: item.label, helper: item.description, icon: item.icon, route: item.route }));
    const actionCommands = ACADEMICS_QUICK_ACTIONS.map(item => ({ label: item.label, helper: item.helper, icon: item.icon, actionMode: item.actionMode }));
    const classCommands = this.data.classes.map((item: AcademicClass) => ({ label: item.className, helper: 'Open Classes & Sections', icon: 'pi pi-sitemap', route: '/app/academics/classes' }));
    const subjectCommands = this.data.subjects.map((item: SubjectModel) => ({ label: item.subjectName, helper: item.subjectCode, icon: 'pi pi-book', route: '/app/academics/subjects' }));
    const teacherCommands = this.data.staff.map((item: StaffModel) => ({ label: this.insightsService.staffName(item), helper: 'Open Teacher Allocation', icon: 'pi pi-users', route: '/app/academics/teacher-allocation' }));
    const eventCommands = this.data.calendarEvents.map((item: AcademicCalendarEventModel) => ({ label: item.title || 'Academic event', helper: item.eventType || 'Calendar', icon: 'pi pi-calendar', route: '/app/academics/calendar' }));

    return [...pageCommands, ...actionCommands, ...classCommands, ...subjectCommands, ...teacherCommands, ...eventCommands]
      .filter(command => !query || `${command.label} ${command.helper}`.toLowerCase().includes(query))
      .slice(0, 12);
  }

  refresh(): void {
    this.loading = true;
    this.workspaceService.loadWorkspaceData()
      .pipe(finalize(() => this.loading = false), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => this.data = data,
        error: () => {
          this.data = this.emptyData();
          this.messageService.add({ severity: 'error', summary: 'Academics unavailable', detail: 'Unable to load academic workspace data.' });
        }
      });
  }

  openAction(mode: AcademicsActionMode): void {
    this.activeActionMode = mode;
    this.drawerOpen = true;
  }

  openQuickAction(action: AcademicsQuickAction): void {
    this.openAction(action.actionMode);
  }

  runCommand(command: AcademicCommand): void {
    this.commandOpen = false;
    this.commandQuery = '';

    if (command.actionMode) {
      this.openAction(command.actionMode);
      return;
    }

    if (command.route) {
      void this.router.navigateByUrl(command.route);
    }
  }

  saveDrawer(event: { mode: AcademicsActionMode; payload: Record<string, unknown> }): void {
    this.saving = true;
    this.saveRequest(event.mode, event.payload)
      .pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.drawerOpen = false;
          this.messageService.add({ severity: 'success', summary: 'Academic workspace updated', detail: `${actionModeLabel(event.mode)} saved successfully.` });
          this.refresh();
        },
        error: err => {
          const detail = this.errorMessage(err);
          this.messageService.add({ severity: 'error', summary: 'Save failed', detail });
        }
      });
  }

  pageAction(mode: AcademicsActionMode): void {
    this.openAction(mode);
  }

  closeCommand(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('acad-command-overlay')) {
      this.commandOpen = false;
    }
  }

  private saveRequest(mode: AcademicsActionMode, payload: Record<string, unknown>): Observable<unknown> {
    switch (mode) {
      case 'year':
        return this.workspaceService.createAcademicYear(payload as { yearCode: string; startDate: string; endDate: string });
      case 'class':
        return this.workspaceService.createClass(String(payload['className'] ?? ''));
      case 'section':
        return this.workspaceService.createSection(Number(payload['classId']), String(payload['sectionName'] ?? ''));
      case 'subject':
        return this.workspaceService.createSubject(payload as Partial<SubjectModel>);
      case 'allocation':
        return this.workspaceService.allocateTeacher(payload as Partial<TeacherAllocationModel>);
      case 'class-teacher':
        return this.workspaceService.assignClassTeacher(payload as Partial<ClassTeacherAssignmentModel>);
      case 'timetable':
        return this.workspaceService.createTimetableSlot(payload as Partial<TimetableSlotModel>);
      case 'calendar-event':
        return this.workspaceService.createCalendarEvent(payload as Partial<AcademicCalendarEventModel>);
      case 'settings':
        return this.workspaceService.saveAcademicSetting(payload as Partial<AcademicSettingModel>);
    }
  }

  private errorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const objectError = error as { error?: { message?: string; detail?: string }; message?: string };
      return objectError.error?.message || objectError.error?.detail || objectError.message || 'Please review the entered details and try again.';
    }

    return 'Please review the entered details and try again.';
  }

  private emptyData(): AcademicsWorkspaceData {
    return {
      academicYears: [],
      currentYear: null,
      classes: [],
      sections: [],
      courses: [],
      subjects: [],
      containers: [],
      staff: [],
      teacherAllocations: [],
      classTeacherAssignments: [],
      timetableSlots: [],
      calendarEvents: [],
      academicSettings: [],
      syllabi: []
    };
  }
}
