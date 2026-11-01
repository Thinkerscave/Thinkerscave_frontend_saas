import {
  REQUIREMENT_OPTIONS,
  SUBJECT_WEEKLY_PERIODS_MAX,
  SUBJECT_WEEKLY_PERIODS_MIN,
  SubjectMappingRow,
  SubjectMappingSaveRequest,
  SubjectRequirement,
  SubjectTimetablePreference,
  SubjectType
} from '../../../models/subjects-mapping.model';

/** Subject identity used for staging (available list, preselection). */
export interface SubjectRef {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  subjectType: SubjectType;
  defaultTimetablePreference?: SubjectTimetablePreference | null;
  subjectActive: boolean;
}

/** One row of the Mapped Subjects editor. `saved` is the persisted baseline (null for new rows). */
export interface DraftRow extends SubjectRef {
  requirement: SubjectRequirement;
  weeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  choiceGroup: string | null;
  consecutivePeriods: number;
  saved: SubjectMappingRow | null;
  removed: boolean;
}

export type DraftStatus = 'MAPPED' | 'NEW' | 'MODIFIED' | 'REMOVED';

export function isValidWeeklyPeriods(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  const n = Number(value);
  return Number.isInteger(n) && n >= SUBJECT_WEEKLY_PERIODS_MIN && n <= SUBJECT_WEEKLY_PERIODS_MAX;
}

export function draftFromSaved(row: SubjectMappingRow): DraftRow {
  return {
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    subjectCode: row.subjectCode,
    subjectType: row.subjectType,
    subjectActive: row.subjectActive,
    requirement: row.requirement,
    weeklyPeriods: row.weeklyPeriods,
    timetablePreference: row.timetablePreference,
    choiceGroup: row.choiceGroup ?? null,
    consecutivePeriods: row.consecutivePeriods ?? 1,
    saved: row,
    removed: false
  };
}

/** Defaults for a subject staged with "Add Selected Subjects". */
export function newDraftRow(ref: SubjectRef): DraftRow {
  return {
    ...ref,
    requirement: 'COMPULSORY',
    weeklyPeriods: 1,
    timetablePreference: ref.defaultTimetablePreference ?? 'ANY',
    choiceGroup: null,
    consecutivePeriods: 1,
    saved: null,
    removed: false
  };
}

export function isModified(row: DraftRow): boolean {
  const saved = row.saved;
  if (!saved) return true;
  return row.requirement !== saved.requirement
    || Number(row.weeklyPeriods) !== saved.weeklyPeriods
    || row.timetablePreference !== saved.timetablePreference
    || (row.choiceGroup ?? null) !== (saved.choiceGroup ?? null)
    || (row.consecutivePeriods ?? 1) !== (saved.consecutivePeriods ?? 1);
}

export function draftStatus(row: DraftRow): DraftStatus {
  if (row.removed) return 'REMOVED';
  if (!row.saved) return 'NEW';
  return isModified(row) ? 'MODIFIED' : 'MAPPED';
}

/** Unsaved changes = edited/new/removed rows plus subjects staged but not yet added. */
export function countChanges(rows: readonly DraftRow[], stagedCount: number): number {
  return rows.filter((row) => draftStatus(row) !== 'MAPPED').length + stagedCount;
}

export function requirementLabel(value: SubjectRequirement): string {
  return REQUIREMENT_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Client-side checks that mirror the backend rules. Returns human-readable messages (empty when valid). */
export function validateDraft(params: {
  academicYearId: number | null;
  academicGroupId: number | null;
  rows: readonly DraftRow[];
}): string[] {
  const errors: string[] = [];
  if (!params.academicYearId) errors.push('Select an academic year.');
  if (!params.academicGroupId) errors.push('Select an academic group.');
  const seen = new Set<number>();
  for (const row of params.rows) {
    if (row.removed) continue;
    if (seen.has(row.subjectId)) {
      errors.push(`${row.subjectName} is listed more than once.`);
      continue;
    }
    seen.add(row.subjectId);
    if (!isValidWeeklyPeriods(row.weeklyPeriods)) {
      errors.push(`${row.subjectName}: weekly periods must be a whole number from ${SUBJECT_WEEKLY_PERIODS_MIN} to ${SUBJECT_WEEKLY_PERIODS_MAX}.`);
    }
  }
  return errors;
}

export function buildSaveRequest(academicYearId: number, rows: readonly DraftRow[]): SubjectMappingSaveRequest {
  const upserts = rows
    .filter((row) => {
      const status = draftStatus(row);
      return status === 'NEW' || status === 'MODIFIED';
    })
    .map((row) => ({
      subjectId: row.subjectId,
      requirement: row.requirement,
      weeklyPeriods: Number(row.weeklyPeriods),
      timetablePreference: row.timetablePreference,
      choiceGroup: row.choiceGroup?.trim() || null,
      consecutivePeriods: Number(row.consecutivePeriods) || 1
    }));
  const removedSubjectIds = rows
    .filter((row) => row.removed && row.saved)
    .map((row) => row.subjectId);
  return { academicYearId, upserts, removedSubjectIds, confirmImpact: false };
}
