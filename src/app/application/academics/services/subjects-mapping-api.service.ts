import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import { PageResponse } from '../../../shared/models/api-response.model';
import {
  AvailableSubjectResponse,
  SubjectListQuery,
  SubjectMappingBoard,
  SubjectMappingImpactResponse,
  SubjectMappingSaveRequest,
  SubjectChoiceGroup,
  SubjectChoiceGroupRequest,
  SubjectOption,
  SubjectStatusFilter,
  SubjectRequest,
  SubjectResponse,
  SubjectType,
  SubjectUsageResponse
} from '../models/subjects-mapping.model';

function buildParams(values: Record<string, string | number | boolean | null | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class SubjectsMappingApiService {
  private readonly http = inject(HttpClient);

  listSubjects(query: SubjectListQuery): Observable<PageResponse<SubjectResponse>> {
    const params = buildParams({
      q: query.q?.trim(),
      subjectType: query.subjectType,
      status: query.status,
      page: query.page ?? 0,
      size: query.size ?? 10
    });
    return this.http
      .get<ApiResponse<PageResponse<SubjectResponse>>>(academicsApi.subjects, { params })
      .pipe(map((res) => res.data));
  }

  getSubject(subjectId: number): Observable<SubjectResponse> {
    return this.http
      .get<ApiResponse<SubjectResponse>>(academicsApi.subjectById(subjectId))
      .pipe(map((res) => res.data));
  }

  createSubject(body: SubjectRequest): Observable<SubjectResponse> {
    return this.http
      .post<ApiResponse<SubjectResponse>>(academicsApi.subjects, body)
      .pipe(map((res) => res.data));
  }

  updateSubject(subjectId: number, body: SubjectRequest): Observable<SubjectResponse> {
    return this.http
      .put<ApiResponse<SubjectResponse>>(academicsApi.subjectById(subjectId), body)
      .pipe(map((res) => res.data));
  }

  deactivateSubject(subjectId: number): Observable<SubjectResponse> {
    return this.http
      .patch<ApiResponse<SubjectResponse>>(academicsApi.deactivateSubject(subjectId), {})
      .pipe(map((res) => res.data));
  }

  activateSubject(subjectId: number): Observable<SubjectResponse> {
    return this.http
      .patch<ApiResponse<SubjectResponse>>(academicsApi.activateSubject(subjectId), {})
      .pipe(map((res) => res.data));
  }

  listSubjectChoiceGroups(query: {
    q?: string;
    subjectType?: SubjectType | null;
    status?: SubjectStatusFilter;
    page?: number;
    size?: number;
  }): Observable<PageResponse<SubjectChoiceGroup>> {
    const params = buildParams({
      q: query.q?.trim(),
      subjectType: query.subjectType,
      status: query.status,
      page: query.page ?? 0,
      size: query.size ?? 10
    });
    return this.http
      .get<ApiResponse<PageResponse<SubjectChoiceGroup>>>(academicsApi.subjectChoiceGroups, { params })
      .pipe(map((res) => res.data));
  }

  listChoiceGroupSubjectOptions(query: {
    subjectType: SubjectType;
    q?: string;
    page?: number;
    size?: number;
  }): Observable<PageResponse<SubjectOption>> {
    const params = buildParams({
      subjectType: query.subjectType,
      q: query.q?.trim(),
      page: query.page ?? 0,
      size: query.size ?? 100
    });
    return this.http
      .get<ApiResponse<PageResponse<SubjectOption>>>(academicsApi.subjectChoiceGroupSubjectOptions, { params })
      .pipe(map((res) => res.data));
  }

  createSubjectChoiceGroup(request: SubjectChoiceGroupRequest): Observable<SubjectChoiceGroup> {
    return this.http
      .post<ApiResponse<SubjectChoiceGroup>>(academicsApi.subjectChoiceGroups, request)
      .pipe(map((res) => res.data));
  }

  updateSubjectChoiceGroup(id: number, request: SubjectChoiceGroupRequest): Observable<SubjectChoiceGroup> {
    return this.http
      .put<ApiResponse<SubjectChoiceGroup>>(academicsApi.subjectChoiceGroupById(id), request)
      .pipe(map((res) => res.data));
  }

  setSubjectChoiceGroupActive(id: number, active: boolean): Observable<SubjectChoiceGroup> {
    return this.http
      .patch<ApiResponse<SubjectChoiceGroup>>(academicsApi.subjectChoiceGroupStatus(id, active), {})
      .pipe(map((res) => res.data));
  }

  listSubjectMappings(
    subjectId: number,
    query: { q?: string; page?: number; size?: number }
  ): Observable<PageResponse<SubjectUsageResponse>> {
    const params = buildParams({ q: query.q?.trim(), page: query.page ?? 0, size: query.size ?? 10 });
    return this.http
      .get<ApiResponse<PageResponse<SubjectUsageResponse>>>(academicsApi.subjectMappings(subjectId), { params })
      .pipe(map((res) => res.data));
  }

  getMappingBoard(academicGroupId: number): Observable<SubjectMappingBoard> {
    return this.http
      .get<ApiResponse<SubjectMappingBoard>>(academicsApi.academicGroupSubjectMappings(academicGroupId))
      .pipe(map((res) => res.data));
  }

  listAvailableSubjects(
    academicGroupId: number,
    query: { q?: string; subjectType?: SubjectType | null; page?: number; size?: number }
  ): Observable<PageResponse<AvailableSubjectResponse>> {
    const params = buildParams({
      q: query.q?.trim(),
      subjectType: query.subjectType,
      page: query.page ?? 0,
      size: query.size ?? 10
    });
    return this.http
      .get<ApiResponse<PageResponse<AvailableSubjectResponse>>>(
        academicsApi.academicGroupAvailableSubjects(academicGroupId), { params })
      .pipe(map((res) => res.data));
  }

  previewMappings(academicGroupId: number, body: SubjectMappingSaveRequest): Observable<SubjectMappingImpactResponse> {
    return this.http
      .post<ApiResponse<SubjectMappingImpactResponse>>(
        academicsApi.academicGroupSubjectMappingPreview(academicGroupId), body)
      .pipe(map((res) => res.data));
  }

  saveMappings(academicGroupId: number, body: SubjectMappingSaveRequest): Observable<SubjectMappingBoard> {
    return this.http
      .put<ApiResponse<SubjectMappingBoard>>(academicsApi.academicGroupSubjectMappings(academicGroupId), body)
      .pipe(map((res) => res.data));
  }
}
