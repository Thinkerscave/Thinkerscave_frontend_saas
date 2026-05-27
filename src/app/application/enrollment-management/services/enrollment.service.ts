import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../shared/models/api-response.model';

export type EnrollmentStatus =
  | 'ACTIVE' | 'INACTIVE' | 'PROMOTED' | 'GRADUATED' | 'TRANSFERRED_OUT' | 'WITHDRAWN' | 'SUSPENDED';

export interface AcademicEnrollment {
  id: number;
  enrollmentNumber?: string;
  studentId: number;
  academicYearId: number;
  classId: number;
  sectionId?: number;
  rollNumber?: string;
  status: EnrollmentStatus;
  enrolledOn?: string;
}

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/enrollments`;

  // Backend requires academicYearId on GET /enrollments. When the caller has
  // not chosen a year yet we resolve to an empty list so the list view can
  // render its empty state without surfacing a 400/500.
  list(academicYearId?: number): Observable<AcademicEnrollment[]> {
    if (!academicYearId) {
      return of([]);
    }
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http
      .get<ApiResponse<PageResponse<AcademicEnrollment>>>(this.base, { params })
      .pipe(
        map(r => r.data?.content ?? []),
        catchError(() => of([] as AcademicEnrollment[]))
      );
  }
  get(id: number): Observable<AcademicEnrollment> {
    return this.http.get<ApiResponse<AcademicEnrollment>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }
  save(payload: Partial<AcademicEnrollment>): Observable<AcademicEnrollment> {
    return payload.id
      ? this.http.put<ApiResponse<AcademicEnrollment>>(`${this.base}/${payload.id}`, payload).pipe(map(r => r.data))
      : this.http.post<ApiResponse<AcademicEnrollment>>(this.base, payload).pipe(map(r => r.data));
  }
  transition(id: number, status: EnrollmentStatus): Observable<AcademicEnrollment> {
    return this.http.patch<ApiResponse<AcademicEnrollment>>(`${this.base}/${id}/status`, { status }).pipe(map(r => r.data));
  }
}
