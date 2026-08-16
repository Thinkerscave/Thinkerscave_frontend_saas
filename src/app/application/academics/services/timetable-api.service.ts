import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  AcademicResource,
  GenerationProgress,
  GenerationStartResponse,
  TimetableConfiguration,
  TimetableConfigurationRequest,
  TimetableConflict,
  TimetableDashboard,
  TimetableGenerateResult,
  TimetableGrid,
  TimetableReadiness,
  TimetableVersion,
  GridView
} from '../models/timetable.model';

@Injectable({ providedIn: 'root' })
export class TimetableApiService {
  private readonly http = inject(HttpClient);

  getDashboard(yearId: number): Observable<TimetableDashboard> {
    return this.http
      .get<ApiResponse<TimetableDashboard>>(academicsApi.timetableDashboard(yearId))
      .pipe(map(r => r.data));
  }

  getConfiguration(yearId: number): Observable<TimetableConfiguration | null> {
    return this.http
      .get<ApiResponse<TimetableConfiguration>>(academicsApi.timetableConfiguration(yearId))
      .pipe(map(r => r.data));
  }

  saveConfiguration(yearId: number, body: TimetableConfigurationRequest): Observable<TimetableConfiguration> {
    return this.http
      .put<ApiResponse<TimetableConfiguration>>(academicsApi.timetableConfiguration(yearId), body)
      .pipe(map(r => r.data));
  }

  generate(yearId: number): Observable<TimetableGenerateResult> {
    return this.http
      .post<ApiResponse<TimetableGenerateResult>>(academicsApi.timetableGenerate(yearId), {})
      .pipe(map(r => r.data));
  }

  getReadiness(yearId: number): Observable<TimetableReadiness> {
    return this.http
      .get<ApiResponse<TimetableReadiness>>(academicsApi.timetableReadiness(yearId))
      .pipe(map(r => r.data));
  }

  startGeneration(yearId: number, body?: { seed?: number }): Observable<GenerationStartResponse> {
    return this.http
      .post<ApiResponse<GenerationStartResponse>>(academicsApi.timetableGenerations(yearId), body ?? {})
      .pipe(map(r => r.data));
  }

  getGenerationProgress(generationId: string): Observable<GenerationProgress> {
    return this.http
      .get<ApiResponse<GenerationProgress>>(academicsApi.timetableGenerationById(generationId))
      .pipe(map(r => r.data));
  }

  cancelGeneration(generationId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(academicsApi.timetableGenerationCancel(generationId), {})
      .pipe(map(r => r.data));
  }

  listVersions(yearId: number): Observable<TimetableVersion[]> {
    return this.http
      .get<ApiResponse<TimetableVersion[]>>(academicsApi.timetableVersions(yearId))
      .pipe(map(r => r.data));
  }

  getGrid(versionId: number, view: GridView, params?: Record<string, any>): Observable<TimetableGrid> {
    let httpParams: any = { view };
    if (params) httpParams = { ...httpParams, ...params };
    return this.http
      .get<ApiResponse<TimetableGrid>>(academicsApi.timetableGrid(versionId), { params: httpParams })
      .pipe(map(r => r.data));
  }

  getConflicts(versionId: number): Observable<TimetableConflict[]> {
    return this.http
      .get<ApiResponse<TimetableConflict[]>>(academicsApi.timetableConflicts(versionId))
      .pipe(map(r => r.data));
  }

  resolveConflict(conflictId: number): Observable<TimetableConflict> {
    return this.http
      .post<ApiResponse<TimetableConflict>>(academicsApi.timetableConflictResolve(conflictId), {})
      .pipe(map(r => r.data));
  }

  ignoreConflict(conflictId: number): Observable<TimetableConflict> {
    return this.http
      .post<ApiResponse<TimetableConflict>>(academicsApi.timetableConflictIgnore(conflictId), {})
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

  listResources(): Observable<AcademicResource[]> {
    return this.http
      .get<ApiResponse<AcademicResource[]>>(academicsApi.academicResources)
      .pipe(map(r => r.data));
  }

  createResource(body: Omit<AcademicResource, 'academicResourceId'>): Observable<AcademicResource> {
    return this.http
      .post<ApiResponse<AcademicResource>>(academicsApi.academicResources, body)
      .pipe(map(r => r.data));
  }

  deactivateResource(id: number): Observable<AcademicResource> {
    return this.http
      .post<ApiResponse<AcademicResource>>(academicsApi.deactivateAcademicResource(id), {})
      .pipe(map(r => r.data));
  }
}
