import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  AcademicClassCreateRequest,
  AcademicClassDto,
  AcademicSectionCreateRequest,
  AcademicStage,
  ClassSectionDto,
  ClassesSectionsDashboard
} from '../models/classes-sections.model';

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

  getClass(classId: number): Observable<AcademicClassDto> {
    return this.http
      .get<ApiResponse<AcademicClassDto>>(academicsApi.classById(classId))
      .pipe(map((res) => res.data));
  }

  createClass(body: AcademicClassCreateRequest): Observable<AcademicClassDto> {
    return this.http
      .post<ApiResponse<AcademicClassDto>>(academicsApi.classes, body)
      .pipe(map((res) => res.data));
  }

  updateClass(classId: number, body: AcademicClassCreateRequest): Observable<AcademicClassDto> {
    return this.http
      .put<ApiResponse<AcademicClassDto>>(academicsApi.classById(classId), body)
      .pipe(map((res) => res.data));
  }

  deactivateClass(classId: number): Observable<AcademicClassDto> {
    return this.http
      .patch<ApiResponse<AcademicClassDto>>(academicsApi.deactivateClass(classId), {})
      .pipe(map((res) => res.data));
  }

  activateClass(classId: number): Observable<AcademicClassDto> {
    return this.http
      .patch<ApiResponse<AcademicClassDto>>(academicsApi.activateClass(classId), {})
      .pipe(map((res) => res.data));
  }

  createSection(classId: number, body: AcademicSectionCreateRequest): Observable<ClassSectionDto> {
    return this.http
      .post<ApiResponse<ClassSectionDto>>(academicsApi.sectionsByClass(classId), body)
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
