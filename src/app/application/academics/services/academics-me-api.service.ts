import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  MyTimetable,
  StudentMyAcademics,
  TeacherAcademicStructure,
  TeacherMyClasses
} from '../models/academics-me.model';

@Injectable({ providedIn: 'root' })
export class AcademicsMeApiService {
  private readonly http = inject(HttpClient);

  myClasses(academicYearId?: number | null): Observable<TeacherMyClasses> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http
      .get<ApiResponse<TeacherMyClasses>>(academicsApi.meClasses, { params, headers: { 'X-Skip-Error-Toast': '1' } })
      .pipe(map((r) => r.data));
  }

  myTimetable(academicYearId?: number | null): Observable<MyTimetable> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http
      .get<ApiResponse<MyTimetable>>(academicsApi.meTimetable, { params, headers: { 'X-Skip-Error-Toast': '1' } })
      .pipe(map((r) => r.data));
  }

  myStructure(academicYearId?: number | null): Observable<TeacherAcademicStructure> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http
      .get<ApiResponse<TeacherAcademicStructure>>(academicsApi.meStructure, { params, headers: { 'X-Skip-Error-Toast': '1' } })
      .pipe(map((r) => r.data));
  }

  myAcademics(academicYearId?: number | null): Observable<StudentMyAcademics> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http
      .get<ApiResponse<StudentMyAcademics>>(academicsApi.meAcademics, { params, headers: { 'X-Skip-Error-Toast': '1' } })
      .pipe(map((r) => r.data));
  }
}
