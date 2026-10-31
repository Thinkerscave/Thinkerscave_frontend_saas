import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { AcademicsMeApiService } from '../../services/academics-me-api.service';
import { LoginService } from '../../../../core/services/login.service';
import { MyAcademicGroupsPageComponent } from './my-academic-groups/my-academic-groups.component';
import { MyAcademicsPageComponent } from './my-academics/my-academics.component';
import { MyTimetablePageComponent } from './my-timetable/my-timetable.component';

async function setupPage<T>(component: Type<T>) {
  const api = jasmine.createSpyObj<AcademicsMeApiService>(
    'AcademicsMeApiService',
    ['myAcademicGroups', 'myTimetable', 'myAcademics']
  );
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      { provide: AcademicsMeApiService, useValue: api },
      { provide: LoginService, useValue: { getUser: () => ({ roles: ['ORGANIZATION_ADMIN'] }) } },
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
    expect(component.accessNotice).toContain('staff accounts');
  });

  it('does not request the student academics endpoint for an organization admin', async () => {
    const { api, fixture } = await setupPage(MyAcademicsPageComponent);
    const component = fixture.componentInstance;

    component.onAcademicYearChange(2026);

    expect(api.myAcademics).not.toHaveBeenCalled();
    expect(component.accessNotice).toContain('student and parent accounts');
  });
});
