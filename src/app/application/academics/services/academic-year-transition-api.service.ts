import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  AcademicYearTransition,
  AcademicYearTransitionRequest
} from '../models/academic-year-transition.model';

@Injectable({ providedIn: 'root' })
export class AcademicYearTransitionApiService {
  private readonly http = inject(HttpClient);

  list(yearId: number): Observable<AcademicYearTransition[]> {
    return this.http
      .get<ApiResponse<AcademicYearTransition[]>>(academicsApi.yearTransitions(yearId))
      .pipe(map((r) => r.data));
  }

  create(sourceYearId: number, body: AcademicYearTransitionRequest): Observable<AcademicYearTransition> {
    return this.http
      .post<ApiResponse<AcademicYearTransition>>(academicsApi.yearTransitions(sourceYearId), body)
      .pipe(map((r) => r.data));
  }

  start(id: number): Observable<AcademicYearTransition> {
    return this.http
      .post<ApiResponse<AcademicYearTransition>>(academicsApi.transitionStart(id), {})
      .pipe(map((r) => r.data));
  }

  approve(id: number): Observable<AcademicYearTransition> {
    return this.http
      .post<ApiResponse<AcademicYearTransition>>(academicsApi.transitionApprove(id), {})
      .pipe(map((r) => r.data));
  }
}
