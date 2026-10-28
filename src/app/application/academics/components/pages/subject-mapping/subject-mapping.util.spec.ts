import { SubjectMappingRow } from '../../../models/subjects-mapping.model';
import {
  DraftRow,
  buildSaveRequest,
  draftFromSaved,
  draftStatus,
  newDraftRow,
  validateDraft
} from './subject-mapping.util';

const SAVED: SubjectMappingRow = {
  mappingId: 1, subjectId: 5, subjectName: 'Mathematics', subjectCode: 'MATH', subjectType: 'ACADEMIC_SUBJECT',
  subjectActive: true, requirement: 'COMPULSORY', weeklyPeriods: 5, timetablePreference: 'ANY',
  teacherAllocationCount: 0, timetableEntryCount: 0
};

describe('subject-mapping.util', () => {
  it('derives MAPPED for an untouched saved row and MODIFIED after an edit', () => {
    const row = draftFromSaved(SAVED);
    expect(draftStatus(row)).toBe('MAPPED');
    row.weeklyPeriods = 6;
    expect(draftStatus(row)).toBe('MODIFIED');
  });

  it('derives NEW for staged rows and REMOVED for removed saved rows', () => {
    const fresh = newDraftRow({
      subjectId: 6,
      subjectName: 'English',
      subjectCode: 'ENG',
      subjectType: 'ACADEMIC_SUBJECT',
      defaultTimetablePreference: 'FIRST_HALF',
      subjectActive: true
    });
    expect(draftStatus(fresh)).toBe('NEW');
    expect(fresh.timetablePreference).toBe('FIRST_HALF');
    const noPreference = newDraftRow({
      subjectId: 7,
      subjectName: 'Art',
      subjectCode: 'ART',
      subjectType: 'ACTIVITY',
      subjectActive: true
    });
    expect(noPreference.timetablePreference).toBe('ANY');
    const removed = draftFromSaved(SAVED);
    removed.removed = true;
    expect(draftStatus(removed)).toBe('REMOVED');
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

  it('validates weekly periods and context', () => {
    const row: DraftRow = draftFromSaved(SAVED);
    row.weeklyPeriods = 41;
    const errors = validateDraft({ academicYearId: 1, academicGroupId: 3, rows: [row] });
    expect(errors.length).toBe(1);
    expect(validateDraft({ academicYearId: null, academicGroupId: null, rows: [] }).length).toBe(2);
  });
});
