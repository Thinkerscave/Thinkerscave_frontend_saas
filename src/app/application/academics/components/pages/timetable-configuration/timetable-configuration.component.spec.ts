import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicYearContextService } from '../../../../../shared/services/academic-year-context.service';
import { TimetableApiService } from '../../../services/timetable-api.service';
import { GroupAssignmentMatrix } from '../../../models/timetable.model';
import { TimetableConfigurationPageComponent } from './timetable-configuration.component';

describe('TimetableConfigurationPageComponent section scope', () => {
  let component: TimetableConfigurationPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimetableConfigurationPageComponent],
      providers: [
        { provide: TimetableApiService, useValue: {} },
        { provide: AcademicYearContextService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: Router, useValue: {} },
        { provide: ConfirmationService, useValue: new ConfirmationService() },
        { provide: MessageService, useValue: { add: jasmine.createSpy('add') } }
      ]
    })
      .overrideComponent(TimetableConfigurationPageComponent, { set: { template: '', providers: [] } })
      .compileComponents();

    component = TestBed.createComponent(TimetableConfigurationPageComponent).componentInstance;
    component.matrix = {
      academicYearId: 1,
      days: ['MONDAY'],
      rows: [
        { academicGroupId: 3, academicGroupName: 'Class 6', academicGroupCode: 'C6', sectionId: 11, sectionName: 'A', active: true, cells: [] },
        { academicGroupId: 3, academicGroupName: 'Class 6', academicGroupCode: 'C6', sectionId: 12, sectionName: 'B', active: true, cells: [] }
      ]
    } as GroupAssignmentMatrix;
  });

  it('adds every checked section to a schedule-pattern assignment', () => {
    component.activeTab = 'assignments';
    component.assignPickerGroupId = 3;
    component.assignPickerScope = 'SELECTED';
    component.assignPickerSectionIds = [11, 12];

    component.addAssignUnit();

    expect(component.assignForm.units).toEqual([
      { academicGroupId: 3, sectionId: 11, label: 'Class 6 - A' },
      { academicGroupId: 3, sectionId: 12, label: 'Class 6 - B' }
    ]);
  });

  it('adds every checked section to a fixed activity', () => {
    component.activeTab = 'fixed';
    component.activityPickerGroupId = 3;
    component.activityPickerScope = 'SELECTED';
    component.activityPickerSectionIds = [12];

    component.addActivityUnit();

    expect(component.activityForm.units).toEqual([
      { academicGroupId: 3, sectionId: 12, label: 'Class 6 - B' }
    ]);
  });

  it('labels group-wide schedule assignments separately from section rows', () => {
    const row = {
      academicGroupId: 3,
      academicGroupName: 'Class 6',
      academicGroupCode: 'C6',
      sectionId: null,
      sectionName: null,
      scopeLabel: 'All Sections',
      active: true,
      cells: []
    };

    expect(component.rowLabel(row)).toBe('Class 6 - All Sections');
    expect(component.rowCode(row)).toBe('C6');
  });
});
