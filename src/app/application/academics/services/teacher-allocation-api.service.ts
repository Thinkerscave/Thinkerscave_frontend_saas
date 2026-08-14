import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  TeacherAllocationAssignRequest,
  TeacherAllocationDashboard,
  TeacherAllocationRow,
  TeacherAllocationStatus,
  TeacherRecommendation,
  TeacherWorkload
} from '../models/teacher-allocation.model';

@Injectable({ providedIn: 'root' })
export class TeacherAllocationApiService {
  private readonly http = inject(HttpClient);

  getDashboard(
    yearId: number,
    opts?: {
      classId?: number | null;
      sectionId?: number | null;
      subjectId?: number | null;
      status?: TeacherAllocationStatus | null;
    }
  ): Observable<TeacherAllocationDashboard> {
    let params = new HttpParams();
    if (opts?.classId) params = params.set('classId', opts.classId);
    if (opts?.sectionId) params = params.set('sectionId', opts.sectionId);
    if (opts?.subjectId) params = params.set('subjectId', opts.subjectId);
    if (opts?.status) params = params.set('status', opts.status);
    return this.http
      .get<ApiResponse<TeacherAllocationDashboard>>(academicsApi.teacherAllocationsDashboard(yearId), { params })
      .pipe(map((res) => res.data));
  }

  assign(body: TeacherAllocationAssignRequest): Observable<TeacherAllocationRow> {
    return this.http
      .post<ApiResponse<TeacherAllocationRow>>(academicsApi.teacherAllocationAssign, body)
      .pipe(map((res) => res.data));
  }

  unassign(allocationId: number): Observable<TeacherAllocationRow> {
    return this.http
      .post<ApiResponse<TeacherAllocationRow>>(academicsApi.teacherAllocationUnassign(allocationId), {})
      .pipe(map((res) => res.data));
  }

  recommendations(sectionId: number, classSubjectMappingId: number): Observable<TeacherRecommendation[]> {
    const params = new HttpParams()
      .set('sectionId', sectionId)
      .set('classSubjectMappingId', classSubjectMappingId);
    return this.http
      .get<ApiResponse<TeacherRecommendation[]>>(academicsApi.teacherAllocationRecommendations, { params })
      .pipe(map((res) => res.data));
  }

  workloads(yearId: number): Observable<TeacherWorkload[]> {
    return this.http
      .get<ApiResponse<TeacherWorkload[]>>(academicsApi.teacherWorkloads(yearId))
      .pipe(map((res) => res.data));
  }
}
