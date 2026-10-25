import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  CoverageBoard,
  CoverageCandidate,
  CoveragePreview,
  CoverageSaveRequest
} from '../models/teacher-coverage.model';

@Injectable({ providedIn: 'root' })
export class TeacherCoverageApiService {
  private readonly http = inject(HttpClient);

  board(yearId: number, academicGroupId: number): Observable<CoverageBoard> {
    const params = new HttpParams().set('academicGroupId', String(academicGroupId));
    return this.http
      .get<ApiResponse<CoverageBoard>>(academicsApi.teacherCoverageBoard(yearId), { params })
      .pipe(map((res) => res.data));
  }

  candidates(yearId: number, academicGroupId: number, mappingId: number): Observable<CoverageCandidate[]> {
    const params = new HttpParams()
      .set('academicGroupId', String(academicGroupId))
      .set('mappingId', String(mappingId));
    return this.http
      .get<ApiResponse<CoverageCandidate[]>>(academicsApi.teacherCoverageCandidates(yearId), { params })
      .pipe(map((res) => res.data));
  }

  preview(yearId: number, request: CoverageSaveRequest): Observable<CoveragePreview> {
    return this.http
      .post<ApiResponse<CoveragePreview>>(academicsApi.teacherCoveragePreview(yearId), request)
      .pipe(map((res) => res.data));
  }

  save(yearId: number, request: CoverageSaveRequest): Observable<CoverageBoard> {
    return this.http
      .put<ApiResponse<CoverageBoard>>(academicsApi.teacherCoverageSave(yearId), request)
      .pipe(map((res) => res.data));
  }
}
