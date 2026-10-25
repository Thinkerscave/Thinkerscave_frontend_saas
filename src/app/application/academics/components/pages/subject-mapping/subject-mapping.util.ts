import {
  REQUIREMENT_OPTIONS,
  SUBJECT_WEEKLY_PERIODS_MAX,
  SUBJECT_WEEKLY_PERIODS_MIN,
  SubjectMappingRow,
  SubjectMappingSaveRequest,
  SubjectMappingScope,
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
  subjectActive: boolean;
}

/** One row of the Mapped Subjects editor. `saved` is the persisted baseline (null for new rows). */
export interface DraftRow extends SubjectRef {
  requirement: SubjectRequirement;
  weeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  scope: SubjectMappingScope;
  sectionIds: number[];
  saved: SubjectMappingRow | null;
  removed: boolean;
}

export type DraftStatus = 'MAPPED' | 'NEW' | 'MODIFIED' | 'REMOVED';

export function normalizeSectionIds(ids: readonly number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}

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
    scope: row.scope,
    sectionIds: normalizeSectionIds(row.sectionIds ?? []),
    saved: row,
    removed: false
  };
}

/** Defaults for a subject staged with "Add Selected Subjects". */
export function newDraftRow(ref: SubjectRef, scope: SubjectMappingScope, sectionIds: readonly number[]): DraftRow {
  return {
    ...ref,
    requirement: 'COMPULSORY',
    weeklyPeriods: 1,
    timetablePreference: 'ANY',
    scope,
    sectionIds: scope === 'SELECTED_SECTIONS' ? normalizeSectionIds(sectionIds) : [],
    saved: null,
    removed: false
  };
}

function effectiveSectionIds(row: { scope: SubjectMappingScope; sectionIds: readonly number[] }): number[] {
  return row.scope === 'SELECTED_SECTIONS' ? normalizeSectionIds(row.sectionIds) : [];
}

export function isModified(row: DraftRow): boolean {
  const saved = row.saved;
  if (!saved) return true;
  const savedIds = normalizeSectionIds(saved.scope === 'SELECTED_SECTIONS' ? saved.sectionIds ?? [] : []);
  const currentIds = effectiveSectionIds(row);
  const sameSections = savedIds.length === currentIds.length && savedIds.every((id, i) => id === currentIds[i]);
  return row.requirement !== saved.requirement
    || Number(row.weeklyPeriods) !== saved.weeklyPeriods
    || row.timetablePreference !== saved.timetablePreference
    || row.scope !== saved.scope
    || !sameSections;
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

export function sectionsLabel(row: { scope: SubjectMappingScope; sectionIds: readonly number[] }, totalSections: number): string {
  if (row.scope === 'ALL_SECTIONS' || totalSections === 0 || row.sectionIds.length >= totalSections) {
    return 'All Sections';
  }
  return `${row.sectionIds.length} of ${totalSections} sections`;
}

export function requirementLabel(value: SubjectRequirement): string {
  return REQUIREMENT_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Client-side checks that mirror the backend rules. Returns human-readable messages (empty when valid). */
export function validateDraft(params: {
  academicYearId: number | null;
  academicGroupId: number | null;
  rows: readonly DraftRow[];
  activeSectionIds: readonly number[];
}): string[] {
  const errors: string[] = [];
  if (!params.academicYearId) errors.push('Select an academic year.');
  if (!params.academicGroupId) errors.push('Select an academic group.');
  const seen = new Set<number>();
  const activeIds = new Set(params.activeSectionIds);
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
    if (row.scope === 'SELECTED_SECTIONS') {
      const ids = normalizeSectionIds(row.sectionIds);
      if (ids.length === 0) {
        errors.push(`${row.subjectName}: select at least one section, or use All Sections.`);
      } else if (ids.some((id) => !activeIds.has(id))) {
        errors.push(`${row.subjectName}: one or more selected sections are no longer active.`);
      }
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
      scope: row.scope,
      sectionIds: effectiveSectionIds(row)
    }));
  const removedSubjectIds = rows
    .filter((row) => row.removed && row.saved)
    .map((row) => row.subjectId);
  return { academicYearId, upserts, removedSubjectIds, confirmImpact: false };
}
