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
  let canApprovePermission: jasmine.Spy;

  beforeEach(async () => {
    timetableApi = jasmine.createSpyObj<TimetableApiService>(
      'TimetableApiService',
      ['getConflicts', 'getView', 'validateVersion']
    );
    timetableApi.getConflicts.and.returnValue(of([]));
    timetableApi.validateVersion.and.returnValue(of([]));
    const permissionService = {
      canApprove: jasmine.createSpy('canApprove').and.returnValue(true)
    };
    canApprovePermission = permissionService.canApprove;

    await TestBed.configureTestingModule({
      imports: [TimetablePageComponent],
      providers: [
        { provide: TimetableApiService, useValue: timetableApi },
        { provide: TeacherAllocationApiService, useValue: {} },
        { provide: AcademicYearContextService, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: PermissionService, useValue: permissionService },
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
      yearActive: true,
      yearReadOnly: false,
      state: 'DRAFT',
      overallStatus: 'READY',
      canGenerate: true,
      readiness: {
        ready: true,
        summary: {
          sections: 0,
          subjects: 0,
          requirements: 0,
          teachers: 0,
          resources: 0,
          weeklySlots: 0,
          unscheduledSubjects: 0
        },
        checks: [],
        blockingIssues: [],
        warnings: []
      },
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

  it('only enables publication after the timetable is approved', () => {
    expect(component.canPublish).toBeFalse();

    component.workspace = {
      ...component.workspace!,
      workingVersion: { ...component.workspace!.workingVersion!, status: 'READY_FOR_REVIEW' }
    };
    expect(component.canPublish).toBeFalse();

    component.workspace = {
      ...component.workspace!,
      workingVersion: { ...component.workspace!.workingVersion!, status: 'APPROVED' }
    };
    expect(component.canPublish).toBeTrue();

    canApprovePermission.and.returnValue(false);
    expect(component.canPublish).toBeFalse();
  });

  it('keeps a pending approval version selected and disables generation', () => {
    const pending = {
      ...component.workspace!.workingVersion!,
      status: 'PENDING_APPROVAL' as const,
      editable: false
    };
    component.workspace = {
      ...component.workspace!,
      workingVersion: pending,
      canGenerate: false
    };

    expect(component.primaryVersion).toEqual(pending);
    expect(component.generateDisabled).toBeTrue();
  });

  it('does not offer validation for versions locked by approval', () => {
    component.selectedVersionId = 21;

    for (const status of ['PENDING_APPROVAL', 'APPROVED'] as const) {
      component.workspace = {
        ...component.workspace!,
        workingVersion: { ...component.workspace!.workingVersion!, status }
      };

      expect(component.canValidate).toBeFalse();
      component.validate();
    }

    expect(timetableApi.validateVersion).not.toHaveBeenCalled();
  });

  it('respects the workspace generation gate when readiness passes', () => {
    component.workspace = {
      ...component.workspace!,
      canGenerate: false
    };

    expect(component.workspace!.readiness!.ready).toBeTrue();
    expect(component.generateDisabled).toBeTrue();
  });

  it('blocks manual entry for inactive years and unresolved approval versions', () => {
    expect(component.canManualEntry).toBeTrue();

    component.workspace = { ...component.workspace!, yearActive: false };
    expect(component.canManualEntry).toBeFalse();

    component.workspace = {
      ...component.workspace!,
      yearActive: true,
      workingVersion: { ...component.workspace!.workingVersion!, status: 'APPROVED' }
    };
    expect(component.canManualEntry).toBeFalse();
  });

  it('keeps every schedule period, including breaks, in the teacher timeline', () => {
    component.view = 'TEACHER';
    component.grid = {
      timetableVersionId: 21,
      view: 'TEACHER',
      periods: [],
      periodsByDay: {
        MONDAY: [
          { timetablePeriodId: 1, periodNumber: 1, name: 'Period 1', startTime: '08:00', endTime: '08:45', slotKind: 'TEACHING', schedulePatternName: 'Standard School Day' },
          { timetablePeriodId: 2, periodNumber: 2, name: 'Break', startTime: '08:45', endTime: '09:00', slotKind: 'BREAK', schedulePatternName: 'Standard School Day' },
          { timetablePeriodId: 3, periodNumber: 3, name: 'Period 2', startTime: '09:00', endTime: '09:45', slotKind: 'TEACHING', schedulePatternName: 'Standard School Day' }
        ]
      },
      workingDays: ['MONDAY'],
      cells: [],
      editable: false,
      weekDates: []
    };

    expect(component.rowsForDay('MONDAY').map(row => row.name))
      .toEqual(['Period 1', 'Break', 'Period 2']);
  });

  it('deduplicates non-blocking conflicts already shown by readiness and paginates remaining conflicts', () => {
    component.workspace = {
      ...component.workspace!,
      issues: [{
        code: 'PREFERENCE',
        title: 'Preferred time',
        severity: 'WARNING',
        message: 'Teacher prefers the first half of the day.'
      }]
    };
    component.conflicts = [
      { timetableConflictId: 1, conflictType: 'PREFERENCE', blocking: false, status: 'OPEN', message: ' Teacher prefers the first half of the day. ' },
      ...Array.from({ length: 11 }, (_, index) => ({
        timetableConflictId: index + 2,
        conflictType: 'OTHER',
        blocking: false,
        status: 'OPEN' as const,
        message: `Conflict ${index + 1}`
      }))
    ];

    expect(component.visibleConflicts.length).toBe(11);
    expect(component.pagedConflicts.length).toBe(10);

    component.onConflictPageChange({ page: 1, first: 10, rows: 10, pageCount: 2 });

    expect(component.pagedConflicts.map(conflict => conflict.timetableConflictId)).toEqual([12]);
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
