import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { BackNavigationService } from '../../../../../core/services/back-navigation.service';
import { PageMetaService } from '../../../../../core/services/page-meta.service';
import { PermissionService } from '../../../../../core/services/permission.service';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import { SubjectResponse } from '../../../models/subjects-mapping.model';
import { SubjectsDirectoryPageComponent } from './subjects-directory.component';

function pageOf(content: SubjectResponse[]) {
  return { content, page: 0, number: 0, size: 10, totalElements: content.length, totalPages: 1, first: true, last: true };
}

const MATH: SubjectResponse = {
  subjectId: 1,
  name: 'Mathematics',
  code: 'MATH',
  subjectType: 'ACADEMIC_SUBJECT',
  description: null,
  active: true,
  mappedAcademicGroupCount: 4,
  mappedSectionCount: 7
};

describe('SubjectsDirectoryPageComponent', () => {
  let fixture: ComponentFixture<SubjectsDirectoryPageComponent>;
  let component: SubjectsDirectoryPageComponent;
  let api: jasmine.SpyObj<SubjectsMappingApiService>;
  let canManage: jasmine.Spy;

  beforeEach(async () => {
    api = jasmine.createSpyObj('SubjectsMappingApiService', ['listSubjects', 'deactivateSubject', 'activateSubject']);
    api.listSubjects.and.returnValue(of(pageOf([MATH])));
    canManage = jasmine.createSpy('canManage').and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [SubjectsDirectoryPageComponent],
      providers: [
        provideRouter([]),
        { provide: BackNavigationService, useValue: { back: jasmine.createSpy('back') } },
        { provide: PageMetaService, useValue: { resolve: () => ({ showBack: false, backFallback: null }) } },
        { provide: SubjectsMappingApiService, useValue: api },
        { provide: PermissionService, useValue: { permissionsLoaded$: of(true), canManage, canView: () => true, canApprove: () => false } },
        { provide: MessageService, useValue: { add: jasmine.createSpy('add') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectsDirectoryPageComponent);
    component = fixture.componentInstance;
  });

  it('loads active subjects on init', () => {
    fixture.detectChanges();
    expect(api.listSubjects).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'ACTIVE', page: 0, size: 10 }));
    expect(component.subjects.length).toBe(1);
  });

  it('switches between card and table views through the toggle', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sub-grid')).not.toBeNull();
    component.onViewModeChange('table');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sub-table')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sub-grid')).toBeNull();
  });

  it('debounces search and sends it as q', fakeAsync(() => {
    fixture.detectChanges();
    api.listSubjects.calls.reset();
    component.onSearchChange('mat');
    tick(300);
    expect(api.listSubjects).toHaveBeenCalledTimes(1);
    expect(api.listSubjects).toHaveBeenCalledWith(jasmine.objectContaining({ q: 'mat' }));
  }));

  it('sends subject type and status filters to the API and clears them', () => {
    fixture.detectChanges();
    api.listSubjects.calls.reset();
    component.typeFilter = 'PRACTICAL_LAB';
    component.statusFilter = 'INACTIVE';
    component.onFilterChange();
    expect(api.listSubjects).toHaveBeenCalledWith(jasmine.objectContaining({ subjectType: 'PRACTICAL_LAB', status: 'INACTIVE' }));
    expect(component.hasFilters).toBeTrue();

    component.clearFilters();
    expect(component.typeFilter).toBeNull();
    expect(component.statusFilter).toBe('ACTIVE');
    expect(component.hasFilters).toBeFalse();
  });

  it('hides Add Subject and row actions from read-only users', () => {
    canManage.and.returnValue(false);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Add Subject');
    expect(fixture.nativeElement.querySelector('[aria-label^="More actions"]')).toBeNull();
  });

  it('shows the empty directory state with Add Subject when no subjects exist', () => {
    api.listSubjects.and.returnValue(of(pageOf([])));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No subjects yet');
  });

  it('shows a backend error with retry', () => {
    api.listSubjects.and.returnValue(throwError(() => ({ message: 'Service unavailable' })));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Service unavailable');
    expect(text).toContain('Retry');
  });
});
