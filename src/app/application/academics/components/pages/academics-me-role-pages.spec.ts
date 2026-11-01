import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { AcademicsMeApiService } from '../../services/academics-me-api.service';
import { LoginService } from '../../../../core/services/login.service';
import { MyAcademicGroupsPageComponent } from './my-academic-groups/my-academic-groups.component';
import { MyAcademicsPageComponent } from './my-academics/my-academics.component';
import { MyTimetablePageComponent } from './my-timetable/my-timetable.component';

async function setupPage<T>(component: Type<T>, roles = ['ORGANIZATION_ADMIN']) {
  const api = jasmine.createSpyObj<AcademicsMeApiService>(
    'AcademicsMeApiService',
    ['myAcademicGroups', 'myTimetable', 'myAcademics']
  );
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      { provide: AcademicsMeApiService, useValue: api },
      { provide: LoginService, useValue: { getUser: () => ({ roles }) } },
      { provide: MessageService, useValue: jasmine.createSpyObj<MessageService>('MessageService', ['add']) }
    ]
  })
    .overrideComponent(component, { set: { template: '' } })
    .compileComponents();

  return { api, fixture: TestBed.createComponent(component) };
}

describe('Academics role-specific pages', () => {
  it('does not request the staff groups endpoint for an organization admin', async () => {
    const { api, fixture } = await setupPage(MyAcademicGroupsPageComponent);
    const component = fixture.componentInstance;

    component.onAcademicYearChange(2026);

    expect(api.myAcademicGroups).not.toHaveBeenCalled();
    expect(component.accessNotice).toContain('staff accounts');
  });

  it('does not request the staff timetable endpoint for an organization admin', async () => {
    const { api, fixture } = await setupPage(MyTimetablePageComponent);
    const component = fixture.componentInstance;

    component.onAcademicYearChange(2026);

    expect(api.myTimetable).not.toHaveBeenCalled();
    expect(component.accessNotice).toContain('staff and student');
  });

  it('loads a student timetable for the active enrollment year without requesting the admin year list', async () => {
    const { api, fixture } = await setupPage(MyTimetablePageComponent, ['STUDENT']);
    api.myAcademics.and.returnValue(of({
      studentName: 'Test Student',
      academicYearId: 2026,
      academicYearName: '2026-27',
      subjects: [],
      publishedTimetableExists: false
    }));
    api.myTimetable.and.returnValue(of({
      role: 'STUDENT',
      academicYearId: 2026,
      todaySchedule: []
    }));

    fixture.detectChanges();

    expect(api.myAcademics).toHaveBeenCalledWith();
    expect(api.myTimetable).toHaveBeenCalledWith(2026);
    expect(fixture.componentInstance.data?.role).toBe('STUDENT');
    expect(fixture.componentInstance.enrollmentYearName).toBe('2026-27');
  });

  it('explains how a student can resolve a missing enrollment', async () => {
    const { api, fixture } = await setupPage(MyTimetablePageComponent, ['STUDENT']);
    api.myAcademics.and.returnValue(throwError(() => ({ error: { message: 'No active enrollment found' } })));

    fixture.detectChanges();

    expect(fixture.componentInstance.accessNotice).toContain('assign your Academic Group, section, and academic year');
    expect(api.myTimetable).not.toHaveBeenCalled();
  });

  it('loads student academics from the active enrollment without requesting the admin year list', async () => {
    const { api, fixture } = await setupPage(MyAcademicsPageComponent, ['STUDENT']);
    api.myAcademics.and.returnValue(of({
      studentName: 'Test Student',
      academicYearId: 2026,
      academicYearName: '2026-27',
      subjects: [],
      publishedTimetableExists: false
    }));

    fixture.detectChanges();

    expect(api.myAcademics).toHaveBeenCalledWith();
    expect(fixture.componentInstance.data?.academicYearId).toBe(2026);
  });

  it('does not request the student academics endpoint for an organization admin', async () => {
    const { api, fixture } = await setupPage(MyAcademicsPageComponent);
    const component = fixture.componentInstance;

    component.onAcademicYearChange(2026);

    expect(api.myAcademics).not.toHaveBeenCalled();
    expect(component.accessNotice).toContain('student and parent accounts');
  });
});
