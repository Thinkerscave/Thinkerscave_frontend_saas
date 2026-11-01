import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  AcademicStructureTreeStage,
  MyTimetable,
  StudentMyAcademics,
  TeacherAcademicStructure,
  TeacherMyAcademicGroups
} from '../models/academics-me.model';

@Injectable({ providedIn: 'root' })
export class AcademicsMeApiService {
  private readonly http = inject(HttpClient);

  myAcademicGroups(academicYearId?: number | null): Observable<TeacherMyAcademicGroups> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http
      .get<ApiResponse<TeacherMyAcademicGroups>>(academicsApi.meAcademicGroups, { params })
      .pipe(map((r) => r.data));
  }

  myClasses(academicYearId?: number | null): Observable<{ classes: { classId: number; sectionId: number }[] }> {
    return this.myAcademicGroups(academicYearId).pipe(map((data) => ({
      classes: data.academicGroups.map((group) => ({
        classId: group.academicGroupId,
        sectionId: group.sectionId
      }))
    })));
  }

  myTimetable(academicYearId?: number | null): Observable<MyTimetable> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http
      .get<ApiResponse<MyTimetable>>(academicsApi.meTimetable, { params })
      .pipe(map((r) => r.data));
  }

  myStructure(academicYearId?: number | null): Observable<TeacherAcademicStructure> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http
      .get<ApiResponse<TeacherAcademicStructure>>(academicsApi.meStructure, { params })
      .pipe(map((r) => r.data));
  }

  structureByYear(academicYearId: number): Observable<AcademicStructureTreeStage[]> {
    return this.http
      .get<ApiResponse<AcademicStructureTreeStage[]>>(academicsApi.structureByYear(academicYearId))
      .pipe(map((r) => r.data));
  }

  myAcademics(academicYearId?: number | null): Observable<StudentMyAcademics> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http
      .get<ApiResponse<StudentMyAcademics>>(academicsApi.meAcademics, { params })
      .pipe(map((r) => r.data));
  }
}
