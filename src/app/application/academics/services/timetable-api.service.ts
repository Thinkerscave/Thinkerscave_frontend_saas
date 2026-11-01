import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  FixedActivity,
  FixedActivityOptions,
  FixedActivityRequest,
  FixedActivityResolveRequest,
  FixedActivitySchedule,
  GenerationProgress,
  GenerationStartResponse,
  GridView,
  GroupAssignmentMatrix,
  GroupAssignmentRequest,
  SchedulePattern,
  SchedulePatternRequest,
  TimetableCell,
  TimetableConflict,
  TimetableEntryRequest,
  TimetableGrid,
  TimetableVersion,
  TimetableWorkspace
} from '../models/timetable.model';

@Injectable({ providedIn: 'root' })
export class TimetableApiService {
  private readonly http = inject(HttpClient);

  getWorkspace(yearId: number, date?: string | null): Observable<TimetableWorkspace> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http
      .get<ApiResponse<TimetableWorkspace>>(academicsApi.timetableWorkspace(yearId), { params })
      .pipe(map(r => r.data));
  }

  createManualDraft(yearId: number): Observable<TimetableVersion> {
    return this.http
      .post<ApiResponse<TimetableVersion>>(academicsApi.timetableManualDraft(yearId), {})
      .pipe(map(r => r.data));
  }

  discardVersion(versionId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(academicsApi.timetableVersionDiscard(versionId))
      .pipe(map(r => r.data));
  }

  getView(versionId: number, view: GridView, params: Record<string, any> = {}): Observable<TimetableGrid> {
    let httpParams = new HttpParams().set('view', view);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http
      .get<ApiResponse<TimetableGrid>>(academicsApi.timetableView(versionId), { params: httpParams })
      .pipe(map(r => r.data));
  }

  listPatterns(yearId: number): Observable<SchedulePattern[]> {
    return this.http
      .get<ApiResponse<SchedulePattern[]>>(academicsApi.timetablePatterns(yearId))
      .pipe(map(r => r.data));
  }

  createPattern(yearId: number, body: SchedulePatternRequest): Observable<SchedulePattern> {
    return this.http
      .post<ApiResponse<SchedulePattern>>(academicsApi.timetablePatterns(yearId), body)
      .pipe(map(r => r.data));
  }

  updatePattern(patternId: number, body: SchedulePatternRequest): Observable<SchedulePattern> {
    return this.http
      .put<ApiResponse<SchedulePattern>>(academicsApi.timetablePattern(patternId), body)
      .pipe(map(r => r.data));
  }

  duplicatePattern(patternId: number, name?: string): Observable<SchedulePattern> {
    return this.http
      .post<ApiResponse<SchedulePattern>>(academicsApi.timetablePatternDuplicate(patternId), { name })
      .pipe(map(r => r.data));
  }

  setPatternActive(patternId: number, active: boolean): Observable<SchedulePattern> {
    const url = active
      ? academicsApi.timetablePatternActivate(patternId)
      : academicsApi.timetablePatternDeactivate(patternId);
    return this.http.post<ApiResponse<SchedulePattern>>(url, {}).pipe(map(r => r.data));
  }

  getAssignmentMatrix(yearId: number): Observable<GroupAssignmentMatrix> {
    return this.http
      .get<ApiResponse<GroupAssignmentMatrix>>(academicsApi.timetableAssignmentMatrix(yearId))
      .pipe(map(r => r.data));
  }

  assignPattern(yearId: number, body: GroupAssignmentRequest): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(academicsApi.timetableAssignments(yearId), body)
      .pipe(map(r => r.data));
  }

  updateAssignment(assignmentId: number, body: Partial<GroupAssignmentRequest>): Observable<any> {
    return this.http
      .put<ApiResponse<any>>(academicsApi.timetableAssignment(assignmentId), body)
      .pipe(map(r => r.data));
  }

  deleteAssignment(assignmentId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(academicsApi.timetableAssignment(assignmentId))
      .pipe(map(r => r.data));
  }

  listFixedActivities(yearId: number): Observable<FixedActivity[]> {
    return this.http
      .get<ApiResponse<FixedActivity[]>>(academicsApi.timetableFixedActivities(yearId))
      .pipe(map(r => r.data));
  }

  getFixedActivityOptions(yearId: number): Observable<FixedActivityOptions> {
    return this.http
      .get<ApiResponse<FixedActivityOptions>>(academicsApi.timetableFixedActivityOptions(yearId))
      .pipe(map(r => r.data));
  }

  resolveFixedActivitySchedule(
    yearId: number,
    body: FixedActivityResolveRequest
  ): Observable<FixedActivitySchedule> {
    return this.http
      .post<ApiResponse<FixedActivitySchedule>>(academicsApi.timetableFixedActivityResolve(yearId), body)
      .pipe(map(r => r.data));
  }

  createFixedActivity(yearId: number, body: FixedActivityRequest): Observable<FixedActivity> {
    return this.http
      .post<ApiResponse<FixedActivity>>(academicsApi.timetableFixedActivities(yearId), body)
      .pipe(map(r => r.data));
  }

  updateFixedActivity(activityId: number, body: FixedActivityRequest): Observable<FixedActivity> {
    return this.http
      .put<ApiResponse<FixedActivity>>(academicsApi.timetableFixedActivity(activityId), body)
      .pipe(map(r => r.data));
  }

  setFixedActivityActive(activityId: number, active: boolean): Observable<FixedActivity> {
    const url = active
      ? academicsApi.timetableFixedActivityActivate(activityId)
      : academicsApi.timetableFixedActivityDeactivate(activityId);
    return this.http.post<ApiResponse<FixedActivity>>(url, {}).pipe(map(r => r.data));
  }

  deleteFixedActivity(activityId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(academicsApi.timetableFixedActivity(activityId))
      .pipe(map(r => r.data));
  }

  startGeneration(yearId: number, body: {
    seed?: number; academicGroupIds?: number[]; preserveLocked?: boolean;
    replaceExistingDraft?: boolean; referenceDate?: string | null;
  } = {}): Observable<GenerationStartResponse> {
    return this.http
      .post<ApiResponse<GenerationStartResponse>>(academicsApi.timetableGenerations(yearId), body)
      .pipe(map(r => r.data));
  }

  getGenerationProgress(generationId: number): Observable<GenerationProgress> {
    return this.http
      .get<ApiResponse<GenerationProgress>>(academicsApi.timetableGenerationById(String(generationId)))
      .pipe(map(r => r.data));
  }

  cancelGeneration(generationId: number): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(academicsApi.timetableGenerationCancel(String(generationId)), {})
      .pipe(map(r => r.data));
  }

  listVersions(yearId: number): Observable<TimetableVersion[]> {
    return this.http
      .get<ApiResponse<TimetableVersion[]>>(academicsApi.timetableVersions(yearId))
      .pipe(map(r => r.data));
  }

  getConflicts(versionId: number): Observable<TimetableConflict[]> {
    return this.http
      .get<ApiResponse<TimetableConflict[]>>(academicsApi.timetableConflicts(versionId))
      .pipe(map(r => r.data));
  }

  validateVersion(versionId: number): Observable<TimetableConflict[]> {
    return this.http
      .post<ApiResponse<TimetableConflict[]>>(academicsApi.timetableVersionValidate(versionId), {})
      .pipe(map(r => r.data));
  }

  submitVersion(versionId: number): Observable<TimetableVersion> {
    return this.http
      .post<ApiResponse<TimetableVersion>>(academicsApi.timetableVersionSubmit(versionId), {})
      .pipe(map(r => r.data));
  }

  approveVersion(versionId: number): Observable<TimetableVersion> {
    return this.http
      .post<ApiResponse<TimetableVersion>>(academicsApi.timetableVersionApprove(versionId), {})
      .pipe(map(r => r.data));
  }

  rejectVersion(versionId: number): Observable<TimetableVersion> {
    return this.http
      .post<ApiResponse<TimetableVersion>>(academicsApi.timetableVersionReject(versionId), {})
      .pipe(map(r => r.data));
  }

  publishVersion(versionId: number): Observable<TimetableVersion> {
    return this.http
      .post<ApiResponse<TimetableVersion>>(academicsApi.timetableVersionPublish(versionId), {})
      .pipe(map(r => r.data));
  }

  addEntry(versionId: number, body: TimetableEntryRequest): Observable<TimetableCell> {
    return this.http
      .post<ApiResponse<TimetableCell>>(academicsApi.timetableVersionEntries(versionId), body)
      .pipe(map(r => r.data));
  }

  updateEntry(entryId: number, body: TimetableEntryRequest): Observable<TimetableCell> {
    return this.http
      .put<ApiResponse<TimetableCell>>(academicsApi.timetableEntry(entryId), body)
      .pipe(map(r => r.data));
  }

  deleteEntry(entryId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(academicsApi.timetableEntry(entryId))
      .pipe(map(r => r.data));
  }

  lockEntry(entryId: number, locked: boolean): Observable<TimetableCell> {
    const url = locked
      ? academicsApi.timetableEntryLock(entryId)
      : academicsApi.timetableEntryUnlock(entryId);
    return this.http.post<ApiResponse<TimetableCell>>(url, {}).pipe(map(r => r.data));
  }
}
