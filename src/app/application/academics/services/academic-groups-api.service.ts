import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  AcademicGroupCreateRequest,
  AcademicGroupDto,
  AcademicGroupSummary,
  AcademicSectionCreateRequest,
  AcademicStage,
  AcademicSectionDto,
  AcademicGroupsDashboard
} from '../models/academic-groups.model';

@Injectable({ providedIn: 'root' })
export class AcademicGroupsApiService {
  private readonly http = inject(HttpClient);

  getDashboard(
    yearId: number,
    opts?: { q?: string; stage?: AcademicStage | null; active?: boolean | null }
  ): Observable<AcademicGroupsDashboard> {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.stage) params = params.set('stage', opts.stage);
    if (opts?.active === true || opts?.active === false) {
      params = params.set('active', String(opts.active));
    }
    return this.http
      .get<ApiResponse<AcademicGroupsDashboard>>(academicsApi.academicGroupsDashboard(yearId), { params })
      .pipe(map((res) => res.data));
  }

  getAcademicGroup(academicGroupId: number): Observable<AcademicGroupDto> {
    return this.http
      .get<ApiResponse<AcademicGroupDto>>(academicsApi.academicGroupById(academicGroupId))
      .pipe(map((res) => res.data));
  }

  getGroupSummary(academicGroupId: number): Observable<AcademicGroupSummary> {
    return this.http
      .get<ApiResponse<AcademicGroupSummary>>(academicsApi.academicGroupSummary(academicGroupId))
      .pipe(map((res) => res.data));
  }

  createAcademicGroup(body: AcademicGroupCreateRequest): Observable<AcademicGroupDto> {
    return this.http
      .post<ApiResponse<AcademicGroupDto>>(academicsApi.academicGroups, body)
      .pipe(map((res) => res.data));
  }

  updateAcademicGroup(academicGroupId: number, body: AcademicGroupCreateRequest): Observable<AcademicGroupDto> {
    return this.http
      .put<ApiResponse<AcademicGroupDto>>(academicsApi.academicGroupById(academicGroupId), body)
      .pipe(map((res) => res.data));
  }

  deactivateAcademicGroup(academicGroupId: number): Observable<AcademicGroupDto> {
    return this.http
      .patch<ApiResponse<AcademicGroupDto>>(academicsApi.deactivateAcademicGroup(academicGroupId), {})
      .pipe(map((res) => res.data));
  }

  activateAcademicGroup(academicGroupId: number): Observable<AcademicGroupDto> {
    return this.http
      .patch<ApiResponse<AcademicGroupDto>>(academicsApi.activateAcademicGroup(academicGroupId), {})
      .pipe(map((res) => res.data));
  }

  createSection(academicGroupId: number, body: AcademicSectionCreateRequest): Observable<AcademicSectionDto> {
    return this.http
      .post<ApiResponse<AcademicSectionDto>>(academicsApi.sectionsByAcademicGroup(academicGroupId), body)
      .pipe(map((res) => res.data));
  }

  updateSection(sectionId: number, body: AcademicSectionCreateRequest): Observable<AcademicSectionDto> {
    return this.http
      .put<ApiResponse<AcademicSectionDto>>(academicsApi.sectionById(sectionId), body)
      .pipe(map((res) => res.data));
  }

  deactivateSection(sectionId: number): Observable<AcademicSectionDto> {
    return this.http
      .patch<ApiResponse<AcademicSectionDto>>(academicsApi.deactivateSection(sectionId), {})
      .pipe(map((res) => res.data));
  }

  activateSection(sectionId: number): Observable<AcademicSectionDto> {
    return this.http
      .patch<ApiResponse<AcademicSectionDto>>(academicsApi.activateSection(sectionId), {})
      .pipe(map((res) => res.data));
  }
}
