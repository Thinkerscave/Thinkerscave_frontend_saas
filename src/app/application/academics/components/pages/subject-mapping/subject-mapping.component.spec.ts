import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, of, throwError } from 'rxjs';
import { BackNavigationService } from '../../../../../core/services/back-navigation.service';
import { NavigationHistoryService } from '../../../../../core/services/navigation-history.service';
import { PageMetaService } from '../../../../../core/services/page-meta.service';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { AcademicGroupsApiService } from '../../../services/academic-groups-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import {
  AvailableSubjectResponse,
  SubjectChoiceGroup,
  SubjectMappingBoard,
  SubjectMappingImpactResponse,
  SubjectResponse
} from '../../../models/subjects-mapping.model';
import { AcademicGroupDto, AcademicGroupsDashboard } from '../../../models/academic-groups.model';
import { AcademicYearDto } from '../../../models/academic-year.model';
import { SubjectMappingPageComponent } from './subject-mapping.component';

const page = <T>(content: T[]) => ({ content, page: 0, number: 0, size: 10, totalElements: content.length, totalPages: 1, first: true, last: true });

const BOARD: SubjectMappingBoard = {
  academicGroupId: 3,
  academicGroupName: 'Class 6',
  academicGroupCode: 'CLS-6',
  academicYearId: 1,
  academicYearName: '2026-27',
  academicYearStatus: 'CURRENT',
  yearReadOnly: false,
  mappings: [{
    mappingId: 101, subjectId: 5, subjectName: 'Mathematics', subjectCode: 'MATH', subjectType: 'ACADEMIC_SUBJECT',
    subjectActive: true, requirement: 'COMPULSORY', weeklyPeriods: 5, timetablePreference: 'ANY',
    teacherAllocationCount: 0, timetableEntryCount: 0
  }],
  mappedCount: 1,
  compulsoryCount: 1,
  optionalCount: 0,
  teacherPendingCount: 0
};

const AVAILABLE: AvailableSubjectResponse[] = [
  { subjectId: 5, subjectName: 'Mathematics', subjectCode: 'MATH', subjectType: 'ACADEMIC_SUBJECT', defaultTimetablePreference: 'SECOND_HALF', subjectActive: true, mapped: true, mappingId: 101 },
  { subjectId: 6, subjectName: 'English', subjectCode: 'ENG', subjectType: 'ACADEMIC_SUBJECT', defaultTimetablePreference: 'FIRST_HALF', subjectActive: true, mapped: false, mappingId: null }
];

const SCIENCE: AvailableSubjectResponse = {
  subjectId: 7, subjectName: 'Science', subjectCode: 'SCI', subjectType: 'ACADEMIC_SUBJECT',
  subjectActive: true, mapped: false, mappingId: null
};

const ENGLISH: SubjectResponse = {
  subjectId: 6, name: 'English', code: 'ENG', subjectType: 'ACADEMIC_SUBJECT', description: null,
  defaultTimetablePreference: 'FIRST_HALF',
  active: true, mappedAcademicGroupCount: 0, mappedSectionCount: 0
};

const CHOICE_GROUP: SubjectChoiceGroup = {
  subjectChoiceGroupId: 11,
  name: 'Second Language',
  subjectType: 'ACADEMIC_SUBJECT',
  active: true,
  subjects: [
    { subjectId: 20, name: 'Hindi', code: 'HIN', active: true },
    { subjectId: 21, name: 'Sanskrit', code: 'SAN', active: true }
  ]
};

describe('SubjectMappingPageComponent', () => {
  let fixture: ComponentFixture<SubjectMappingPageComponent>;
  let component: SubjectMappingPageComponent;
  let subjectsApi: jasmine.SpyObj<SubjectsMappingApiService>;
  let groupsApi: jasmine.SpyObj<AcademicGroupsApiService>;
  let yearApi: jasmine.SpyObj<AcademicYearApiService>;
  let messages: jasmine.SpyObj<MessageService>;
  let confirm: jasmine.SpyObj<ConfirmationService>;
  let canManage: jasmine.Spy;

  async function setup(query: Record<string, string> = {}): Promise<void> {
    subjectsApi = jasmine.createSpyObj('SubjectsMappingApiService', [
      'getMappingBoard', 'listAvailableSubjects', 'listSubjectChoiceGroups', 'previewMappings', 'saveMappings', 'getSubject'
    ]);
    subjectsApi.getMappingBoard.and.returnValue(of(structuredClone(BOARD)));
    subjectsApi.listAvailableSubjects.and.returnValue(of(page(AVAILABLE)));
    subjectsApi.listSubjectChoiceGroups.and.returnValue(of(page([])));
    subjectsApi.previewMappings.and.returnValue(of({ valid: true, requiresConfirmation: false, impacts: [] } as SubjectMappingImpactResponse));
    subjectsApi.saveMappings.and.returnValue(of(structuredClone(BOARD)));
    subjectsApi.getSubject.and.returnValue(of(ENGLISH));

    groupsApi = jasmine.createSpyObj('AcademicGroupsApiService', ['getAcademicGroup', 'getDashboard']);
    groupsApi.getAcademicGroup.and.returnValue(of({ academicGroupId: 3, academicYearId: 1 } as AcademicGroupDto));
    groupsApi.getDashboard.and.returnValue(of({ academicGroups: [{ academicGroupId: 3, name: 'Class 6', code: 'CLS-6', active: true }] } as unknown as AcademicGroupsDashboard));

    yearApi = jasmine.createSpyObj('AcademicYearApiService', ['search']);
    yearApi.search.and.returnValue(of([{ academicYearId: 1, name: '2026-27' }] as unknown as AcademicYearDto[]));

    messages = jasmine.createSpyObj('MessageService', ['add']);
    confirm = new ConfirmationService() as jasmine.SpyObj<ConfirmationService>;
    spyOn(confirm, 'confirm');
    canManage = jasmine.createSpy('canManage').and.returnValue(true);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SubjectMappingPageComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SubjectsMappingApiService, useValue: subjectsApi },
        { provide: AcademicGroupsApiService, useValue: groupsApi },
        { provide: AcademicYearApiService, useValue: yearApi },
        { provide: AcademicsNavService, useValue: { back: jasmine.createSpy('back') } },
        { provide: BackNavigationService, useValue: { back: jasmine.createSpy('back') } },
        { provide: NavigationHistoryService, useValue: { hasPrevious: () => false } },
        { provide: PageMetaService, useValue: { resolve: () => ({ showBack: false, backFallback: null }) } },
        { provide: MessageService, useValue: messages },
        { provide: PermissionService, useValue: { canManage, canView: () => true, canApprove: () => false } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) }, paramMap: of(convertToParamMap({})) } }
      ]
    })
      .overrideComponent(SubjectMappingPageComponent, { set: { providers: [{ provide: ConfirmationService, useValue: confirm }] } })
      .compileComponents();

    fixture = TestBed.createComponent(SubjectMappingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const english = (): AvailableSubjectResponse => AVAILABLE[1];
  const math = (): AvailableSubjectResponse => AVAILABLE[0];

  it('does not load the board until both year and group are selected', async () => {
    await setup();
    expect(subjectsApi.getMappingBoard).not.toHaveBeenCalled();
    expect(subjectsApi.listAvailableSubjects).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Select an academic year and academic group to load subject mapping.');
  });

  it('preselects year and group from query params and auto-loads saved mappings as checked', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    expect(subjectsApi.getMappingBoard).toHaveBeenCalledWith(3);
    expect(component.rows.length).toBe(1);
    expect(component.isChecked(math())).toBeTrue();
    expect(component.isChecked(english())).toBeFalse();
    expect(component.statusLabel(component.rows[0])).toBe('Mapped');
    expect(component.rows[0].timetablePreference).toBe('ANY');
    expect(component.changeCount).toBe(0);
  });

  it('removes section-scope controls and shows the weekly-period total', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Section Scope');
    expect(fixture.nativeElement.querySelector('.sub-period-total')?.textContent).toContain('5 weekly periods');
  });

  it('stages a subject preselected from Subject Details without saving it', async () => {
    await setup({ subjectId: '6' });
    expect(subjectsApi.getMappingBoard).not.toHaveBeenCalled();
    component.onYearChange(1);
    component.onGroupChange(3);
    expect(subjectsApi.getSubject).toHaveBeenCalledWith(6);
    expect(component.staged.has(6)).toBeTrue();
    expect(component.staged.get(6)?.defaultTimetablePreference).toBe('FIRST_HALF');
    expect(component.isChecked(english())).toBeTrue();
    expect(subjectsApi.saveMappings).not.toHaveBeenCalled();
  });

  it('stages a checked subject and adds it with defaults on Add Selected Subjects', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    component.onAvailableToggle(english(), true);
    expect(component.changeCount).toBe(1);
    component.addSelectedSubjects();
    const added = component.rows.find((r) => r.subjectId === 6);
    expect(added).toBeDefined();
    expect(added!.requirement).toBe('COMPULSORY');
    expect(added!.weeklyPeriods).toBe(1);
    expect(added!.timetablePreference).toBe('FIRST_HALF');
    expect(component.statusLabel(added!)).toBe('New');
    expect(subjectsApi.saveMappings).not.toHaveBeenCalled();
  });

  it('selects all matching subjects across every page and supports individual deselection', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    subjectsApi.listAvailableSubjects.and.callFake((_groupId, query) => {
      const content = query.page === 0 ? AVAILABLE : [SCIENCE];
      return of({
        ...page(content),
        page: query.page ?? 0,
        number: query.page ?? 0,
        size: 100,
        totalElements: 3,
        totalPages: 2,
        first: query.page === 0,
        last: query.page === 1
      });
    });

    component.toggleAllAvailable(true);

    expect(subjectsApi.listAvailableSubjects).toHaveBeenCalledWith(
      3, jasmine.objectContaining({ page: 0, size: 100 })
    );
    expect(subjectsApi.listAvailableSubjects).toHaveBeenCalledWith(
      3, jasmine.objectContaining({ page: 1, size: 100 })
    );
    expect(component.staged.has(6)).toBeTrue();
    expect(component.staged.has(7)).toBeTrue();
    expect(component.allAvailableSelected).toBeTrue();

    component.onAvailableToggle(SCIENCE, false);
    expect(component.staged.has(7)).toBeFalse();
    expect(component.allAvailableSelected).toBeFalse();
  });

  it('unchecking a saved mapping stages a removal that Undo reverts', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    component.onAvailableToggle(math(), false);
    expect(component.rows[0].removed).toBeTrue();
    expect(component.statusLabel(component.rows[0])).toBe('Will be removed');
    expect(component.changeCount).toBe(1);

    component.onAvailableToggle(math(), true);
    expect(component.rows[0].removed).toBeFalse();
    expect(component.changeCount).toBe(0);
  });

  it('keeps unsaved-change guards without showing an unsaved-changes header message', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    component.onAvailableToggle(english(), true);
    fixture.detectChanges();
    expect(component.changeCount).toBe(1);
    expect(fixture.nativeElement.textContent).not.toContain('unsaved change');
    component.backToDirectory();
    expect(confirm.confirm).toHaveBeenCalled();
  });

  it('reports success only after the backend returns the saved board', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    const save$ = new Subject<SubjectMappingBoard>();
    subjectsApi.saveMappings.and.returnValue(save$.asObservable());
    component.onAvailableToggle(english(), true);
    component.save();
    expect(messages.add).not.toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));

    save$.next(structuredClone(BOARD));
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success', summary: 'Subject mapping saved' }));
    expect(component.changeCount).toBe(0);
  });

  it('keeps pending changes and shows the backend message when save fails', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    subjectsApi.saveMappings.and.returnValue(throwError(() => ({ message: 'Teacher allocation blocks this change' })));
    component.onAvailableToggle(english(), true);
    component.save();
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      summary: 'Unable to save subject mapping',
      detail: 'Teacher allocation blocks this change'
    }));
    expect(component.changeCount).toBe(1);
    expect(messages.add).not.toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    expect(component.saving).toBeFalse();
  });

  it('blocks save and explains invalid weekly periods without calling the backend', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    component.rows[0].weeklyPeriods = 0;
    component.rows[0].requirement = 'OPTIONAL';
    component.save();
    expect(subjectsApi.previewMappings).not.toHaveBeenCalled();
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      summary: 'Subject mapping needs attention',
      detail: jasmine.stringMatching(/weekly periods/)
    }));
  });

  it('requires confirmation when the preview reports impacts, then saves with confirmImpact', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    subjectsApi.previewMappings.and.returnValue(of({
      valid: true,
      requiresConfirmation: true,
      impacts: [{ subjectId: 5, subjectName: 'Mathematics', type: 'REMOVAL', teacherAllocationCount: 2, timetableEntryCount: 4, message: 'Teacher allocations exist' }]
    }));
    component.onAvailableToggle(math(), false);
    component.save();
    expect(component.impactDialogOpen).toBeTrue();
    expect(subjectsApi.saveMappings).not.toHaveBeenCalled();

    component.confirmImpactSave();
    expect(subjectsApi.saveMappings).toHaveBeenCalledWith(3, jasmine.objectContaining({ confirmImpact: true, removedSubjectIds: [5] }));
  });

  it('read-only users cannot change selections or save', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    canManage.and.returnValue(false);
    fixture.detectChanges();
    expect(component.canToggle(english())).toBeFalse();
    component.onAvailableToggle(english(), true);
    expect(component.changeCount).toBe(0);
    expect(component.canSave).toBeFalse();
    expect(fixture.nativeElement.querySelector('.sub-map-footer')).toBeNull();
  });

  it('adds a selected choice group with Add Selected Subjects and counts it once', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    subjectsApi.listSubjectChoiceGroups.and.returnValue(of(page([CHOICE_GROUP])));
    component.loadChoiceGroupOptions();

    component.onChoiceGroupToggle(CHOICE_GROUP.subjectChoiceGroupId, true);
    expect(component.stagedCount).toBe(1);

    component.addSelectedSubjects();

    expect(component.choiceMappings.length).toBe(1);
    expect(component.choiceMappings[0].subjects.length).toBe(2);
    expect(component.selectedChoiceGroupIds.size).toBe(0);
    expect(component.mappedCount).toBe(2);
    expect(component.totalWeeklyPeriods).toBe(6);
  });

  it('prevents mapping an active choice-group member as an individual subject', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    subjectsApi.listSubjectChoiceGroups.and.returnValue(of(page([CHOICE_GROUP])));
    component.loadChoiceGroupOptions();
    const hindi: AvailableSubjectResponse = {
      subjectId: 20, subjectName: 'Hindi', subjectCode: 'HIN', subjectType: 'ACADEMIC_SUBJECT',
      subjectActive: true, mapped: false, mappingId: null
    };

    expect(component.canToggle(hindi)).toBeFalse();
    component.onAvailableToggle(hindi, true);
    expect(component.staged.has(hindi.subjectId)).toBeFalse();
    expect(component.choiceGroupForSubject(hindi.subjectId)?.name).toBe('Second Language');
  });

  it('saves a choice group with its weekly periods and no member overrides', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    subjectsApi.listSubjectChoiceGroups.and.returnValue(of(page([CHOICE_GROUP])));
    component.loadChoiceGroupOptions();
    component.onChoiceGroupToggle(CHOICE_GROUP.subjectChoiceGroupId, true);
    component.addSelectedSubjects();

    component.onChoiceWeeklyChanged(component.choiceMappings[0], 3);
    component.save();

    const request = subjectsApi.previewMappings.calls.mostRecent().args[1];
    expect(request.choiceGroupUpserts!.length).toBe(1);
    expect(request.choiceGroupUpserts![0].weeklyPeriods).toBe(3);
    expect(request.choiceGroupUpserts![0].subjectPeriods).toBeUndefined();
    expect(subjectsApi.saveMappings).toHaveBeenCalled();
  });

  it('renders each alternative frequency instead of falsely implying it inherits the group workload', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    subjectsApi.listSubjectChoiceGroups.and.returnValue(of(page([CHOICE_GROUP])));
    component.loadChoiceGroupOptions();
    component.onChoiceGroupToggle(CHOICE_GROUP.subjectChoiceGroupId, true);
    component.addSelectedSubjects();
    fixture.detectChanges();

    const mapped = fixture.nativeElement.querySelector('.sub-mapped') as HTMLElement;
    expect(mapped.querySelectorAll('input[type="checkbox"]').length).toBe(0);
    expect(mapped.querySelectorAll('.sub-mapped-group').length).toBe(1);
    expect(mapped.querySelectorAll('.sub-mapped-group__child').length).toBe(2);

    const child = mapped.querySelector('.sub-mapped-group__child') as HTMLElement;
    expect(child.querySelector('input[type="number"]')).not.toBeNull();
    expect(child.textContent).not.toContain('Inherit');

    component.toggleChoiceMapping(component.choiceMappings[0]);
    fixture.detectChanges();
    expect(mapped.querySelectorAll('.sub-mapped-group__child').length).toBe(0);
  });

  it('saves explicit alternative weekly-period overrides', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    subjectsApi.listSubjectChoiceGroups.and.returnValue(of(page([CHOICE_GROUP])));
    component.loadChoiceGroupOptions();
    component.onChoiceGroupToggle(CHOICE_GROUP.subjectChoiceGroupId, true);
    component.addSelectedSubjects();
    const mapping = component.choiceMappings[0];
    component.onChoiceWeeklyChanged(mapping, 3);
    mapping.subjects[0].weeklyPeriods = 2;

    component.save();

    expect(subjectsApi.previewMappings.calls.mostRecent().args[1].choiceGroupUpserts![0].subjectPeriods)
      .toEqual({ 20: 2 });
  });

  it('removes an unsaved choice group row without leaving a change behind', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    subjectsApi.listSubjectChoiceGroups.and.returnValue(of(page([CHOICE_GROUP])));
    component.loadChoiceGroupOptions();
    component.onChoiceGroupToggle(CHOICE_GROUP.subjectChoiceGroupId, true);
    component.addSelectedSubjects();

    component.removeChoiceMapping(component.choiceMappings[0]);

    expect(component.choiceMappings.length).toBe(0);
    expect(component.changeCount).toBe(0);
  });
});
