import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  AcademicYearCreateRequest,
  AcademicYearDashboard,
  AcademicYearDto,
  AcademicYearStatus
} from '../models/academic-year.model';

@Injectable({ providedIn: 'root' })
export class AcademicYearApiService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<AcademicYearDashboard> {
    return this.http
      .get<ApiResponse<AcademicYearDashboard>>(academicsApi.yearsDashboard)
      .pipe(map((res) => res.data));
  }

  search(q?: string, status?: AcademicYearStatus | null): Observable<AcademicYearDto[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    if (status) params = params.set('status', status);
    return this.http
      .get<ApiResponse<{ content: AcademicYearDto[] } | AcademicYearDto[]>>(academicsApi.years, { params })
      .pipe(map((res) => {
        const data = res.data as any;
        return Array.isArray(data) ? data : (data?.content ?? []);
      }));
  }

  create(body: AcademicYearCreateRequest): Observable<AcademicYearDto> {
    return this.http
      .post<ApiResponse<AcademicYearDto>>(academicsApi.years, body)
      .pipe(map((res) => res.data));
  }

  update(id: number, body: AcademicYearCreateRequest): Observable<AcademicYearDto> {
    return this.http
      .put<ApiResponse<AcademicYearDto>>(academicsApi.yearById(id), body)
      .pipe(map((res) => res.data));
  }

  deactivate(id: number): Observable<AcademicYearDto> {
    return this.http
      .patch<ApiResponse<AcademicYearDto>>(academicsApi.deactivateYear(id), {})
      .pipe(map((res) => res.data));
  }

  markReady(id: number): Observable<AcademicYearDto> {
    return this.http.post<ApiResponse<AcademicYearDto>>(academicsApi.yearReady(id), {}).pipe(map((r) => r.data));
  }

  submit(id: number): Observable<AcademicYearDto> {
    return this.http.post<ApiResponse<AcademicYearDto>>(academicsApi.yearSubmit(id), {}).pipe(map((r) => r.data));
  }

  approve(id: number): Observable<AcademicYearDto> {
    return this.http.post<ApiResponse<AcademicYearDto>>(academicsApi.yearApprove(id), {}).pipe(map((r) => r.data));
  }

  reject(id: number, rejectionReason: string): Observable<AcademicYearDto> {
    return this.http
      .post<ApiResponse<AcademicYearDto>>(academicsApi.yearReject(id), { rejectionReason })
      .pipe(map((r) => r.data));
  }

  activate(id: number): Observable<AcademicYearDto> {
    return this.http.post<ApiResponse<AcademicYearDto>>(academicsApi.yearActivate(id), {}).pipe(map((r) => r.data));
  }
}
