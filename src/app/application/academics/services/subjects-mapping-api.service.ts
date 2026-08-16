import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  ClassMappingBoard,
  ClassSubjectMappingDto,
  ClassSubjectMappingUpsertRequest,
  SubjectCategory,
  SubjectCreateRequest,
  SubjectDto,
  SubjectsMappingDashboard
} from '../models/subjects-mapping.model';

@Injectable({ providedIn: 'root' })
export class SubjectsMappingApiService {
  private readonly http = inject(HttpClient);

  getDashboard(
    yearId: number,
    opts?: { q?: string; category?: SubjectCategory | null; active?: boolean | null }
  ): Observable<SubjectsMappingDashboard> {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.category) params = params.set('category', opts.category);
    if (opts?.active === true || opts?.active === false) {
      params = params.set('active', String(opts.active));
    }
    return this.http
      .get<ApiResponse<SubjectsMappingDashboard>>(academicsApi.subjectsDashboard(yearId), { params })
      .pipe(map((res) => res.data));
  }

  create(body: SubjectCreateRequest): Observable<SubjectDto> {
    return this.http
      .post<ApiResponse<SubjectDto>>(academicsApi.subjects, body)
      .pipe(map((res) => res.data));
  }

  update(subjectId: number, body: SubjectCreateRequest): Observable<SubjectDto> {
    return this.http
      .put<ApiResponse<SubjectDto>>(academicsApi.subjectById(subjectId), body)
      .pipe(map((res) => res.data));
  }

  getById(subjectId: number): Observable<SubjectDto> {
    return this.http
      .get<ApiResponse<SubjectDto>>(academicsApi.subjectById(subjectId))
      .pipe(map((res) => res.data));
  }

  deactivate(subjectId: number): Observable<SubjectDto> {
    return this.http
      .patch<ApiResponse<SubjectDto>>(academicsApi.deactivateSubject(subjectId), {})
      .pipe(map((res) => res.data));
  }

  activate(subjectId: number): Observable<SubjectDto> {
    return this.http
      .patch<ApiResponse<SubjectDto>>(academicsApi.activateSubject(subjectId), {})
      .pipe(map((res) => res.data));
  }

  getClassMappingBoard(classId: number): Observable<ClassMappingBoard> {
    return this.http
      .get<ApiResponse<ClassMappingBoard>>(academicsApi.classSubjectMappings(classId))
      .pipe(map((res) => res.data));
  }

  upsertMapping(classId: number, body: ClassSubjectMappingUpsertRequest): Observable<ClassSubjectMappingDto> {
    return this.http
      .put<ApiResponse<ClassSubjectMappingDto>>(academicsApi.classSubjectMappings(classId), body)
      .pipe(map((res) => res.data));
  }
}
