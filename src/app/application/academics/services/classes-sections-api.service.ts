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
  ClassSectionDto,
  ClassesSectionsDashboard
} from '../models/academicGroups-sections.model';

@Injectable({ providedIn: 'root' })
export class ClassesSectionsApiService {
  private readonly http = inject(HttpClient);

  getDashboard(
    yearId: number,
    opts?: { q?: string; stage?: AcademicStage | null; active?: boolean | null }
  ): Observable<ClassesSectionsDashboard> {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.stage) params = params.set('stage', opts.stage);
    if (opts?.active === true || opts?.active === false) {
      params = params.set('active', String(opts.active));
    }
    return this.http
      .get<ApiResponse<ClassesSectionsDashboard>>(academicsApi.classesDashboard(yearId), { params })
      .pipe(map((res) => res.data));
  }

  getClass(academicGroupId: number): Observable<AcademicGroupDto> {
    return this.http
      .get<ApiResponse<AcademicGroupDto>>(academicsApi.classById(academicGroupId))
      .pipe(map((res) => res.data));
  }

  getGroupSummary(academicGroupId: number): Observable<AcademicGroupSummary> {
    return this.http
      .get<ApiResponse<AcademicGroupSummary>>(academicsApi.classSummary(academicGroupId))
      .pipe(map((res) => res.data));
  }

  createClass(body: AcademicGroupCreateRequest): Observable<AcademicGroupDto> {
    return this.http
      .post<ApiResponse<AcademicGroupDto>>(academicsApi.academicGroups, body)
      .pipe(map((res) => res.data));
  }

  updateClass(academicGroupId: number, body: AcademicGroupCreateRequest): Observable<AcademicGroupDto> {
    return this.http
      .put<ApiResponse<AcademicGroupDto>>(academicsApi.classById(academicGroupId), body)
      .pipe(map((res) => res.data));
  }

  deactivateClass(academicGroupId: number): Observable<AcademicGroupDto> {
    return this.http
      .patch<ApiResponse<AcademicGroupDto>>(academicsApi.deactivateClass(academicGroupId), {})
      .pipe(map((res) => res.data));
  }

  activateClass(academicGroupId: number): Observable<AcademicGroupDto> {
    return this.http
      .patch<ApiResponse<AcademicGroupDto>>(academicsApi.activateClass(academicGroupId), {})
      .pipe(map((res) => res.data));
  }

  createSection(academicGroupId: number, body: AcademicSectionCreateRequest): Observable<ClassSectionDto> {
    return this.http
      .post<ApiResponse<ClassSectionDto>>(academicsApi.sectionsByClass(academicGroupId), body)
      .pipe(map((res) => res.data));
  }

  updateSection(sectionId: number, body: AcademicSectionCreateRequest): Observable<ClassSectionDto> {
    return this.http
      .put<ApiResponse<ClassSectionDto>>(academicsApi.sectionById(sectionId), body)
      .pipe(map((res) => res.data));
  }

  deactivateSection(sectionId: number): Observable<ClassSectionDto> {
    return this.http
      .patch<ApiResponse<ClassSectionDto>>(academicsApi.deactivateSection(sectionId), {})
      .pipe(map((res) => res.data));
  }

  activateSection(sectionId: number): Observable<ClassSectionDto> {
    return this.http
      .patch<ApiResponse<ClassSectionDto>>(academicsApi.activateSection(sectionId), {})
      .pipe(map((res) => res.data));
  }
}
