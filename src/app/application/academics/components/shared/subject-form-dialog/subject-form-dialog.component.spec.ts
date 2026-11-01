import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import { SubjectResponse } from '../../../models/subjects-mapping.model';
import { SubjectFormDialogComponent } from './subject-form-dialog.component';

const SAVED: SubjectResponse = {
  subjectId: 9,
  name: 'Mathematics',
  code: 'MAT',
  subjectType: 'ACADEMIC_SUBJECT',
  description: null,
  active: true,
  mappedAcademicGroupCount: 0,
  mappedSectionCount: 0
};

describe('SubjectFormDialogComponent', () => {
  let fixture: ComponentFixture<SubjectFormDialogComponent>;
  let component: SubjectFormDialogComponent;
  let api: jasmine.SpyObj<SubjectsMappingApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj('SubjectsMappingApiService', ['createSubject', 'updateSubject']);
    api.createSubject.and.returnValue(of(SAVED));
    api.updateSubject.and.returnValue(of(SAVED));

    await TestBed.configureTestingModule({
      imports: [SubjectFormDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: SubjectsMappingApiService, useValue: api }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectFormDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  });

  it('requires name and subject type before submitting', () => {
    component.submit();
    expect(api.createSubject).not.toHaveBeenCalled();
    expect(component.fieldError('name')).toBe('This field is required.');
    expect(component.fieldError('subjectType')).toBe('Select a subject type.');
  });

  it('rejects a whitespace-only name', () => {
    component.form.patchValue({ name: '   ', subjectType: 'ACTIVITY' });
    component.submit();
    expect(api.createSubject).not.toHaveBeenCalled();
    expect(component.fieldError('name')).not.toBeNull();
  });

  it('trims the name and omits the generated code so the backend assigns the unique value', () => {
    component.form.patchValue({ name: '  Mathematics  ', subjectType: 'ACADEMIC_SUBJECT', description: '' });
    component.submit();
    expect(api.createSubject).toHaveBeenCalledWith({
      name: 'Mathematics',
      subjectType: 'ACADEMIC_SUBJECT',
      defaultTimetablePreference: null,
      description: undefined
    });
  });

  it('shows a generated code preview from the subject name', () => {
    component.form.patchValue({ name: 'Mathematics' });
    expect(component.codePreview).toBe('MAT');

    component.form.patchValue({ name: '9' });
    expect(component.codePreview).toBe('SUB');
  });

  it('emits saved with created=true on create', () => {
    const saved = jasmine.createSpy('saved');
    component.saved.subscribe(saved);
    component.form.patchValue({ name: 'Mathematics', subjectType: 'ACADEMIC_SUBJECT' });
    component.submit();
    expect(saved).toHaveBeenCalledWith({ subject: SAVED, created: true });
  });

  it('locks submit while saving so a double click sends one request', () => {
    const pending = new Subject<SubjectResponse>();
    api.createSubject.and.returnValue(pending.asObservable());
    component.form.patchValue({ name: 'Mathematics', subjectType: 'ACADEMIC_SUBJECT' });

    component.submit();
    component.submit();
    fixture.detectChanges();

    expect(api.createSubject).toHaveBeenCalledTimes(1);
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    expect(button.textContent).toContain('Saving');
  });

  it('shows backend field errors under their inputs and keeps the entered values', () => {
    api.createSubject.and.returnValue(throwError(() => ({
      message: 'Validation failed',
      errors: [{ field: 'name', message: 'Subject name already exists' }]
    })));
    component.form.patchValue({ name: 'Mathematics', subjectType: 'ACADEMIC_SUBJECT' });
    component.submit();
    fixture.detectChanges();

    expect(component.fieldError('name')).toBe('Subject name already exists');
    expect(component.formError).toBeNull();
    expect(component.form.getRawValue()).toEqual(jasmine.objectContaining({ name: 'Mathematics', subjectType: 'ACADEMIC_SUBJECT' }));
    expect(component.saving).toBeFalse();
  });

  it('shows non-field errors in the banner', () => {
    api.createSubject.and.returnValue(throwError(() => ({ message: 'Subject code is in use by an inactive subject' })));
    component.form.patchValue({ name: 'Physics', subjectType: 'ACADEMIC_SUBJECT' });
    component.submit();
    expect(component.formError).toBe('Subject code is in use by an inactive subject');
  });

  it('prefills and updates in edit mode', () => {
    fixture.componentRef.setInput('subject', SAVED);
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    expect(component.form.getRawValue().name).toBe('Mathematics');
    expect(component.codePreview).toBe('MAT');
    component.form.patchValue({ name: 'Algebra' });
    expect(component.codePreview).toBe('MAT');
    component.submit();
    expect(api.updateSubject).toHaveBeenCalledWith(9, jasmine.objectContaining({
      name: 'Algebra',
      defaultTimetablePreference: null
    }));
    expect(api.createSubject).not.toHaveBeenCalled();
  });
});
