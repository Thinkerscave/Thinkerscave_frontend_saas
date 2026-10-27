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
  hasSections: true,
  sections: [
    { sectionId: 11, name: 'A', active: true },
    { sectionId: 12, name: 'B', active: true }
  ],
  mappings: [{
    mappingId: 101, subjectId: 5, subjectName: 'Mathematics', subjectCode: 'MATH', subjectType: 'ACADEMIC_SUBJECT',
    subjectActive: true, requirement: 'COMPULSORY', weeklyPeriods: 5, timetablePreference: 'ANY', scope: 'ALL_SECTIONS',
    sectionIds: [], sectionNames: [], totalSectionCount: 2, teacherAllocationCount: 0, timetableEntryCount: 0
  }],
  mappedCount: 1,
  compulsoryCount: 1,
  optionalCount: 0,
  teacherPendingCount: 0
};

const AVAILABLE: AvailableSubjectResponse[] = [
  { subjectId: 5, subjectName: 'Mathematics', subjectCode: 'MATH', subjectType: 'ACADEMIC_SUBJECT', subjectActive: true, mapped: true, mappingId: 101 },
  { subjectId: 6, subjectName: 'English', subjectCode: 'ENG', subjectType: 'ACADEMIC_SUBJECT', subjectActive: true, mapped: false, mappingId: null }
];

const ENGLISH: SubjectResponse = {
  subjectId: 6, name: 'English', code: 'ENG', subjectType: 'ACADEMIC_SUBJECT', description: null,
  active: true, mappedAcademicGroupCount: 0, mappedSectionCount: 0
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
      'getMappingBoard', 'listAvailableSubjects', 'previewMappings', 'saveMappings', 'getSubject'
    ]);
    subjectsApi.getMappingBoard.and.returnValue(of(structuredClone(BOARD)));
    subjectsApi.listAvailableSubjects.and.returnValue(of(page(AVAILABLE)));
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
    expect(component.changeCount).toBe(0);
  });

  it('shows section checkboxes beside their names and stages the selected section', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });

    component.onScopeSelect('SELECTED_SECTIONS');
    fixture.detectChanges();

    const sectionList = fixture.nativeElement.querySelector('.sub-section-picker') as HTMLElement;
    const checkboxes = sectionList.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    expect(checkboxes.length).toBe(2);
    expect(sectionList.textContent).toContain('A');
    expect(sectionList.textContent).toContain('B');

    checkboxes[0].checked = true;
    checkboxes[0].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.isSectionSelected(11)).toBeTrue();
  });

  it('uses the same checkbox selection in the per-subject section editor', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });

    component.openSectionsDialog(component.rows[0]);
    component.setSectionsDraftScope('SELECTED_SECTIONS');
    fixture.detectChanges();

    const sectionList = fixture.nativeElement.querySelector('.sub-dialog__sections') as HTMLElement;
    expect(sectionList.querySelectorAll('input[type="checkbox"]').length).toBe(2);
  });

  it('stages a subject preselected from Subject Details without saving it', async () => {
    await setup({ subjectId: '6' });
    expect(subjectsApi.getMappingBoard).not.toHaveBeenCalled();
    component.onYearChange(1);
    component.onGroupChange(3);
    expect(subjectsApi.getSubject).toHaveBeenCalledWith(6);
    expect(component.staged.has(6)).toBeTrue();
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
    expect(added!.timetablePreference).toBe('ANY');
    expect(component.statusLabel(added!)).toBe('New');
    expect(subjectsApi.saveMappings).not.toHaveBeenCalled();
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

  it('asks for confirmation before changing scope with unsaved changes', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    component.onAvailableToggle(english(), true);
    component.onScopeSelect('SELECTED_SECTIONS');
    expect(confirm.confirm).toHaveBeenCalled();
    expect(component.scope).toBe('ALL_SECTIONS');

    confirm.confirm.calls.mostRecent().args[0].accept!();
    expect(component.scope).toBe('SELECTED_SECTIONS');
  });

  it('tracks the unsaved change count for the shared header status', async () => {
    await setup({ academicYearId: '1', academicGroupId: '3' });
    component.onAvailableToggle(english(), true);
    fixture.detectChanges();
    expect(component.changeCount).toBe(1);
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
    expect(component.formError).toBe('Teacher allocation blocks this change');
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
    expect(component.formError).toContain('weekly periods');
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
});
