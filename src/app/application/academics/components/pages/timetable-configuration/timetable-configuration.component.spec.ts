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

  it('builds one unit per checked section for a selected group', () => {
    component.activeTab = 'fixed';
    component.activityOptions = {
      academicYearId: 1,
      subjects: [],
      groups: [
        {
          academicGroupId: 3,
          name: 'Class 6',
          code: 'C6',
          sections: [
            { sectionId: 11, name: 'A', code: '6A' },
            { sectionId: 12, name: 'B', code: '6B' }
          ]
        }
      ]
    };
    component.activityForm.groupScope = 'SELECTED';
    component.activityForm.groupSelections = [
      { academicGroupId: 3, sectionScope: 'SELECTED', sectionIds: [12] }
    ];

    expect((component as any).buildActivityGroups()).toEqual([
      { academicGroupId: 3, sectionId: 12 }
    ]);
  });

  it('keeps a group-level unit when a selected group uses all sections', () => {
    component.activeTab = 'fixed';
    component.activityOptions = {
      academicYearId: 1,
      subjects: [],
      groups: [
        {
          academicGroupId: 3,
          name: 'Class 6',
          code: 'C6',
          sections: [{ sectionId: 11, name: 'A', code: '6A' }]
        }
      ]
    };
    component.activityForm.groupScope = 'SELECTED';
    component.activityForm.groupSelections = [
      { academicGroupId: 3, sectionScope: 'ALL', sectionIds: [] }
    ];

    expect((component as any).buildActivityGroups()).toEqual([
      { academicGroupId: 3, sectionId: null }
    ]);
  });

  it('builds one group-level unit per active group when All Groups is selected', () => {
    component.activeTab = 'fixed';
    component.activityOptions = {
      academicYearId: 1,
      subjects: [],
      groups: [
        {
          academicGroupId: 3,
          name: 'Class 6',
          code: 'C6',
          sections: [{ sectionId: 11, name: 'A', code: '6A' }]
        },
        {
          academicGroupId: 4,
          name: 'Class 7',
          code: 'C7',
          sections: [
            { sectionId: 21, name: 'A', code: '7A' },
            { sectionId: 22, name: 'B', code: '7B' }
          ]
        }
      ]
    };
    component.activityForm.groupScope = 'ALL';
    component.activityForm.groupSelections = [];

    expect((component as any).buildActivityGroups()).toEqual([
      { academicGroupId: 3, sectionId: null },
      { academicGroupId: 4, sectionId: null }
    ]);
  });

  it('supports mixed section scopes across selected groups', () => {
    component.activeTab = 'fixed';
    component.activityOptions = {
      academicYearId: 1,
      subjects: [],
      groups: [
        {
          academicGroupId: 3,
          name: 'Class 6',
          code: 'C6',
          sections: [
            { sectionId: 11, name: 'A', code: '6A' },
            { sectionId: 12, name: 'B', code: '6B' }
          ]
        },
        {
          academicGroupId: 4,
          name: 'Class 7',
          code: 'C7',
          sections: [
            { sectionId: 21, name: 'A', code: '7A' },
            { sectionId: 22, name: 'B', code: '7B' }
          ]
        }
      ]
    };
    component.activityForm.groupScope = 'SELECTED';
    component.activityForm.groupSelections = [
      { academicGroupId: 3, sectionScope: 'ALL', sectionIds: [] },
      { academicGroupId: 4, sectionScope: 'SELECTED', sectionIds: [22] }
    ];

    expect((component as any).buildActivityGroups()).toEqual([
      { academicGroupId: 3, sectionId: null },
      { academicGroupId: 4, sectionId: 22 }
    ]);
    expect(component.activitySelectedUnitCount).toBe(3);
  });

  it('keeps group selections while the accordion expands and collapses', () => {
    component.activityOptions = {
      academicYearId: 1,
      subjects: [],
      groups: [
        {
          academicGroupId: 3,
          name: 'Class 6',
          code: 'C6',
          sections: [
            { sectionId: 11, name: 'A', code: '6A' },
            { sectionId: 12, name: 'B', code: '6B' }
          ]
        }
      ]
    };
    component.activityForm.groupSelections = [
      { academicGroupId: 3, sectionScope: 'SELECTED', sectionIds: [12] }
    ];

    expect(component.isActivityGroupExpanded(3)).toBeFalse();
    component.toggleActivityGroupExpanded(3);
    expect(component.isActivityGroupExpanded(3)).toBeTrue();
    expect(component.activityForm.groupSelections[0].sectionIds).toEqual([12]);
    component.toggleActivityGroupExpanded(3);
    expect(component.isActivityGroupExpanded(3)).toBeFalse();
  });

  it('turns All Sections into a specific selection when one section is unchecked', () => {
    component.activityOptions = {
      academicYearId: 1,
      subjects: [],
      groups: [
        {
          academicGroupId: 3,
          name: 'Class 6',
          code: 'C6',
          sections: [
            { sectionId: 11, name: 'A', code: '6A' },
            { sectionId: 12, name: 'B', code: '6B' }
          ]
        }
      ]
    };
    const group = component.activityGroupOptions[0];
    component.activityForm.groupSelections = [
      { academicGroupId: 3, sectionScope: 'ALL', sectionIds: [] }
    ];

    component.toggleActivitySection(group, group.sections[0]);

    expect(component.activityForm.groupSelections[0]).toEqual({
      academicGroupId: 3,
      sectionScope: 'SELECTED',
      sectionIds: [12]
    });
    expect(component.isActivitySectionSelected(3, group.sections[0])).toBeFalse();
    expect(component.isActivitySectionSelected(3, group.sections[1])).toBeTrue();
  });

  it('returns to All Sections once every section is selected', () => {
    component.activityOptions = {
      academicYearId: 1,
      subjects: [],
      groups: [
        {
          academicGroupId: 3,
          name: 'Class 6',
          code: 'C6',
          sections: [
            { sectionId: 11, name: 'A', code: '6A' },
            { sectionId: 12, name: 'B', code: '6B' }
          ]
        }
      ]
    };
    const group = component.activityGroupOptions[0];
    component.activityForm.groupSelections = [
      { academicGroupId: 3, sectionScope: 'SELECTED', sectionIds: [12] }
    ];

    component.toggleActivitySection(group, group.sections[0]);

    expect(component.activityForm.groupSelections[0]).toEqual({
      academicGroupId: 3,
      sectionScope: 'ALL',
      sectionIds: []
    });
  });

  it('summarizes group and section choices for the chip list', () => {
    component.activityOptions = {
      academicYearId: 1,
      subjects: [],
      groups: [
        {
          academicGroupId: 3,
          name: 'Class 6',
          code: 'C6',
          sections: [
            { sectionId: 11, name: 'A', code: '6A' },
            { sectionId: 12, name: 'B', code: '6B' }
          ]
        }
      ]
    };
    const group = component.activityGroupOptions[0];
    component.activityForm.groupSelections = [
      { academicGroupId: 3, sectionScope: 'ALL', sectionIds: [] }
    ];

    expect(component.activityGroupSummary(group)).toBe('Class 6 – All Sections');

    component.activityForm.groupSelections = [
      { academicGroupId: 3, sectionScope: 'SELECTED', sectionIds: [11, 12] }
    ];
    expect(component.activityGroupSummary(group)).toBe('Class 6 – A, B');
  });

  it('clears and restores section choices with the All Sections checkbox', () => {
    component.activityOptions = {
      academicYearId: 1,
      subjects: [],
      groups: [
        {
          academicGroupId: 3,
          name: 'Class 6',
          code: 'C6',
          sections: [{ sectionId: 11, name: 'A', code: '6A' }]
        }
      ]
    };
    const group = component.activityGroupOptions[0];
    component.activityForm.groupSelections = [
      { academicGroupId: 3, sectionScope: 'ALL', sectionIds: [] }
    ];

    component.onActivityAllSectionsChange(group, false);
    expect(component.activityForm.groupSelections[0]).toEqual({
      academicGroupId: 3,
      sectionScope: 'SELECTED',
      sectionIds: []
    });

    component.onActivityAllSectionsChange(group, true);
    expect(component.activityForm.groupSelections[0]).toEqual({
      academicGroupId: 3,
      sectionScope: 'ALL',
      sectionIds: []
    });
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
