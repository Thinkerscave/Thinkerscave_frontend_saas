import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of, Subject } from 'rxjs';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearContextService } from '../../../../../shared/services/academic-year-context.service';
import { TimetableApiService } from '../../../services/timetable-api.service';
import { TeacherAllocationApiService } from '../../../services/teacher-allocation-api.service';
import { TimetableGrid, TimetableWorkspace } from '../../../models/timetable.model';
import { TimetablePageComponent } from './timetable.component';

describe('TimetablePageComponent issue details', () => {
  let component: TimetablePageComponent;
  let timetableApi: jasmine.SpyObj<TimetableApiService>;

  beforeEach(async () => {
    timetableApi = jasmine.createSpyObj<TimetableApiService>('TimetableApiService', ['getConflicts', 'getView']);
    timetableApi.getConflicts.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TimetablePageComponent],
      providers: [
        { provide: TimetableApiService, useValue: timetableApi },
        { provide: TeacherAllocationApiService, useValue: {} },
        { provide: AcademicYearContextService, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: PermissionService, useValue: {} },
        { provide: MessageService, useValue: { add: jasmine.createSpy('add') } },
        ConfirmationService
      ]
    })
      .overrideComponent(TimetablePageComponent, { set: { template: '', providers: [] } })
      .compileComponents();

    component = TestBed.createComponent(TimetablePageComponent).componentInstance;
    component.workspace = {
      academicYearId: 1,
      academicYearName: '2026',
      academicYearStatus: 'ACTIVE',
      yearReadOnly: false,
      state: 'DRAFT',
      overallStatus: 'READY',
      canGenerate: true,
      setup: [],
      issues: [],
      blockingIssueCount: 0,
      warningIssueCount: 0,
      unscheduledLessonCount: 0,
      workingVersion: {
        timetableVersionId: 21,
        academicYearId: 1,
        versionNumber: 1,
        generationStatus: 'GENERATED',
        status: 'DRAFT'
      },
      versions: []
    } as TimetableWorkspace;
    component.state = 'DRAFT';
  });

  it('opens the details panel and loads an empty conflict list', () => {
    component.openIssueDetails();

    expect(component.showIssueDetails).toBeTrue();
    expect(timetableApi.getConflicts).toHaveBeenCalledOnceWith(21);
    expect(component.conflicts).toEqual([]);
    expect(component.conflictLoadError).toBeNull();
  });

  it('switches to the selected teacher grid and ignores a late class-grid response', () => {
    const classResponse = new Subject<TimetableGrid>();
    const teacherResponse = new Subject<TimetableGrid>();
    timetableApi.getView.and.returnValues(classResponse, teacherResponse);
    component.selectedVersionId = 21;
    component.selectedGroupId = 5;
    component.selectedStaffId = 9;
    component.grid = {
      timetableVersionId: 21,
      view: 'ACADEMIC_GROUP',
      periods: [],
      workingDays: [],
      cells: [],
      editable: false,
      weekDates: []
    };

    component.loadGrid();
    component.setView('TEACHER');

    expect(timetableApi.getView).toHaveBeenCalledTimes(2);
    expect(timetableApi.getView).toHaveBeenCalledWith(
      21,
      'TEACHER',
      jasmine.objectContaining({ staffId: 9 })
    );
    expect(component.grid).toBeNull();
    expect(component.loadingGrid).toBeTrue();

    const teacherGrid: TimetableGrid = {
      timetableVersionId: 21,
      view: 'TEACHER',
      periods: [],
      workingDays: [],
      cells: [],
      editable: false,
      weekDates: []
    };
    const classGrid: TimetableGrid = {
      timetableVersionId: 21,
      view: 'ACADEMIC_GROUP',
      periods: [],
      workingDays: [],
      cells: [],
      editable: false,
      weekDates: []
    };
    classResponse.next(classGrid);
    expect(component.grid).toBeNull();

    teacherResponse.next(teacherGrid);
    teacherResponse.complete();
    classResponse.next(classGrid);
    classResponse.complete();

    expect(component.grid).toBe(teacherGrid);
    expect(component.loadingGrid).toBeFalse();
  });
});
