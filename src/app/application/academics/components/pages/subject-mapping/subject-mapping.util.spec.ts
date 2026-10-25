import { SubjectMappingRow } from '../../../models/subjects-mapping.model';
import {
  DraftRow,
  buildSaveRequest,
  draftFromSaved,
  draftStatus,
  newDraftRow,
  sectionsLabel,
  validateDraft
} from './subject-mapping.util';

const SAVED: SubjectMappingRow = {
  mappingId: 1, subjectId: 5, subjectName: 'Mathematics', subjectCode: 'MATH', subjectType: 'ACADEMIC_SUBJECT',
  subjectActive: true, requirement: 'COMPULSORY', weeklyPeriods: 5, timetablePreference: 'ANY', scope: 'ALL_SECTIONS',
  sectionIds: [], sectionNames: [], totalSectionCount: 2, teacherAllocationCount: 0, timetableEntryCount: 0
};

describe('subject-mapping.util', () => {
  it('derives MAPPED for an untouched saved row and MODIFIED after an edit', () => {
    const row = draftFromSaved(SAVED);
    expect(draftStatus(row)).toBe('MAPPED');
    row.weeklyPeriods = 6;
    expect(draftStatus(row)).toBe('MODIFIED');
  });

  it('derives NEW for staged rows and REMOVED for removed saved rows', () => {
    const fresh = newDraftRow({ subjectId: 6, subjectName: 'English', subjectCode: 'ENG', subjectType: 'ACADEMIC_SUBJECT', subjectActive: true }, 'ALL_SECTIONS', []);
    expect(draftStatus(fresh)).toBe('NEW');
    const removed = draftFromSaved(SAVED);
    removed.removed = true;
    expect(draftStatus(removed)).toBe('REMOVED');
  });

  it('labels partial section coverage as n of m and never All for partial', () => {
    expect(sectionsLabel({ scope: 'ALL_SECTIONS', sectionIds: [] }, 3)).toBe('All Sections');
    expect(sectionsLabel({ scope: 'SELECTED_SECTIONS', sectionIds: [11] }, 3)).toBe('1 of 3 sections');
  });

  it('builds a save request with only new, modified and removed rows', () => {
    const untouched = draftFromSaved(SAVED);
    const modified = draftFromSaved({ ...SAVED, subjectId: 9, mappingId: 2 });
    modified.requirement = 'OPTIONAL';
    const removed = draftFromSaved({ ...SAVED, subjectId: 10, mappingId: 3 });
    removed.removed = true;
    const request = buildSaveRequest(1, [untouched, modified, removed]);
    expect(request.upserts.map((u) => u.subjectId)).toEqual([9]);
    expect(request.removedSubjectIds).toEqual([10]);
    expect(request.confirmImpact).toBeFalse();
  });

  it('validates weekly periods, selected sections and context', () => {
    const row: DraftRow = draftFromSaved(SAVED);
    row.weeklyPeriods = 41;
    row.scope = 'SELECTED_SECTIONS';
    row.sectionIds = [];
    const errors = validateDraft({ academicYearId: 1, academicGroupId: 3, rows: [row], activeSectionIds: [11, 12] });
    expect(errors.length).toBe(2);
    expect(validateDraft({ academicYearId: null, academicGroupId: null, rows: [], activeSectionIds: [] }).length).toBe(2);
  });
});
