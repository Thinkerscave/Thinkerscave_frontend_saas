import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  EligibleArrangementSlot,
  TeacherArrangement,
  TeacherArrangementRequest,
  TeacherOption
} from '../models/teacher-arrangement.model';

@Injectable({ providedIn: 'root' })
export class TeacherArrangementApiService {
  private readonly http = inject(HttpClient);

  list(academicYearId: number): Observable<TeacherArrangement[]> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiResponse<TeacherArrangement[]>>(academicsApi.arrangements, { params })
      .pipe(map(response => response.data));
  }

  listByDate(academicYearId: number, date: string): Observable<TeacherArrangement[]> {
    const params = new HttpParams()
      .set('academicYearId', String(academicYearId))
      .set('date', date);
    return this.http.get<ApiResponse<TeacherArrangement[]>>(academicsApi.arrangementsByDate, { params })
      .pipe(map(response => response.data));
  }

  teachers(academicYearId: number): Observable<TeacherOption[]> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiResponse<TeacherOption[]>>(academicsApi.arrangementTeachers, { params })
      .pipe(map(response => response.data));
  }

  eligibleSlots(academicYearId: number, date: string, absentTeacherId: number): Observable<EligibleArrangementSlot[]> {
    const params = new HttpParams()
      .set('academicYearId', String(academicYearId))
      .set('date', date)
      .set('absentTeacherId', String(absentTeacherId));
    return this.http.get<ApiResponse<EligibleArrangementSlot[]>>(academicsApi.arrangementEligibleSlots, { params })
      .pipe(map(response => response.data));
  }

  create(body: TeacherArrangementRequest): Observable<TeacherArrangement> {
    return this.http.post<ApiResponse<TeacherArrangement>>(academicsApi.arrangements, body)
      .pipe(map(response => response.data));
  }

  approve(id: number): Observable<TeacherArrangement> {
    return this.http.post<ApiResponse<TeacherArrangement>>(academicsApi.approveArrangement(id), {})
      .pipe(map(response => response.data));
  }

  reject(id: number, note: string): Observable<TeacherArrangement> {
    return this.http.post<ApiResponse<TeacherArrangement>>(academicsApi.rejectArrangement(id), { note })
      .pipe(map(response => response.data));
  }
}