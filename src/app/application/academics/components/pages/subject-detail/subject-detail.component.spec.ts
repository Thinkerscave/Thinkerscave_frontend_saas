import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, of } from 'rxjs';
import { PermissionService } from '../../../../../core/services/permission.service';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import { SubjectResponse } from '../../../models/subjects-mapping.model';
import { SubjectDetailPageComponent } from './subject-detail.component';

const SUBJECT: SubjectResponse = {
  subjectId: 7,
  name: 'Mathematics',
  code: 'MATH',
  subjectType: 'ACADEMIC_SUBJECT',
  description: 'Core maths',
  active: true,
  mappedAcademicGroupCount: 2,
  mappedSectionCount: 5
};

describe('SubjectDetailPageComponent', () => {
  let fixture: ComponentFixture<SubjectDetailPageComponent>;
  let api: jasmine.SpyObj<SubjectsMappingApiService>;
  let router: Router;

  beforeEach(async () => {
    api = jasmine.createSpyObj('SubjectsMappingApiService', ['getSubject', 'listSubjectMappings', 'deactivateSubject', 'activateSubject']);
    api.getSubject.and.returnValue(of(SUBJECT));
    api.listSubjectMappings.and.returnValue(of({ content: [], page: 0, number: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true }));

    await TestBed.configureTestingModule({
      imports: [SubjectDetailPageComponent],
      providers: [
        provideRouter([]),
        { provide: SubjectsMappingApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: new BehaviorSubject(convertToParamMap({ subjectId: '7' })), snapshot: { queryParamMap: convertToParamMap({}) } }
        },
        { provide: PermissionService, useValue: { canManage: () => true, canView: () => true, canApprove: () => false } },
        { provide: MessageService, useValue: { add: jasmine.createSpy('add') } }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(SubjectDetailPageComponent);
    fixture.detectChanges();
  });

  it('loads the subject and shows its information', () => {
    expect(api.getSubject).toHaveBeenCalledWith(7);
    expect(fixture.nativeElement.textContent).toContain('Mathematics');
    expect(fixture.nativeElement.textContent).toContain('Core maths');
  });

  it('opens Subject Mapping with the subject preselected from the Go to Subject Mapping button', () => {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((b) => b.textContent?.includes('Go to Subject Mapping'));
    expect(button).toBeDefined();
    button!.click();
    expect(router.navigate).toHaveBeenCalledWith(['/app/academics/subject-mapping'], { queryParams: { subjectId: 7 } });
  });

  it('shows the exact empty message when the subject has no mappings', () => {
    expect(fixture.nativeElement.textContent).toContain('This subject is not mapped to any academic groups yet.');
  });
});
