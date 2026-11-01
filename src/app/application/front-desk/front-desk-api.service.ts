import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

export interface DeskSummary {
  visitorsOnCampus: number;
  todaysAppointments: number;
  pendingFollowUps: number;
  todaysDispatches: number;
  todaysWalkIns: number;
}

export interface StudentDirectoryRow {
  studentId: number;
  studentName: string;
  className?: string | null;
  sectionName?: string | null;
  rollNumber?: string | null;
  admissionNumber?: string | null;
  parentName?: string | null;
  parentMobile?: string | null;
}

export interface StaffDirectoryRow {
  staffId: number;
  name: string;
  designation?: string | null;
  mobile?: string | null;
}

interface ApiEnvelope<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class FrontDeskApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/front-desk`;

  summary(): Observable<DeskSummary> {
    return this.http.get<ApiEnvelope<DeskSummary>>(`${this.base}/summary`).pipe(map(r => r.data));
  }

  list(path: string, page: number, size: number, keyword: string, extra?: Record<string, string | boolean>): Observable<PageResult<Record<string, unknown>>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (keyword.trim()) params = params.set('keyword', keyword.trim());
    Object.entries(extra ?? {}).forEach(([key, value]) => {
      params = params.set(key, String(value));
    });
    return this.http.get<ApiEnvelope<PageResult<Record<string, unknown>>>>(`${this.base}/${path}`, { params }).pipe(map(r => r.data));
  }

  create(path: string, body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<ApiEnvelope<Record<string, unknown>>>(`${this.base}/${path}`, body).pipe(map(r => r.data));
  }

  update(path: string, id: number, body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.put<ApiEnvelope<Record<string, unknown>>>(`${this.base}/${path}/${id}`, body).pipe(map(r => r.data));
  }

  postAction(path: string, params?: Record<string, string>): Observable<Record<string, unknown>> {
    let httpParams = new HttpParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      httpParams = httpParams.set(key, value);
    });
    return this.http.post<ApiEnvelope<Record<string, unknown>>>(`${this.base}/${path}`, {}, { params: httpParams }).pipe(map(r => r.data));
  }

  uploadVisitorPhoto(id: number, file: Blob, name: string): Observable<Record<string, unknown>> {
    const form = new FormData();
    form.append('file', file, name);
    return this.http.post<ApiEnvelope<Record<string, unknown>>>(`${this.base}/visitors/${id}/photo`, form).pipe(map(r => r.data));
  }

  students(keyword: string, classId?: number | null): Observable<StudentDirectoryRow[]> {
    let params = new HttpParams().set('page', '0').set('size', '20');
    if (keyword.trim()) params = params.set('keyword', keyword.trim());
    if (classId) params = params.set('classId', String(classId));
    return this.http.get<ApiEnvelope<StudentDirectoryRow[]>>(`${this.base}/directory/students`, { params }).pipe(map(r => r.data ?? []));
  }

  staff(keyword: string): Observable<StaffDirectoryRow[]> {
    let params = new HttpParams().set('page', '0').set('size', '20');
    if (keyword.trim()) params = params.set('keyword', keyword.trim());
    return this.http
      .get<ApiEnvelope<PageResult<StaffDirectoryRow>>>(`${this.base}/directory/staff`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  attendanceCheck(studentId: number): Observable<{ status?: string }> {
    const params = new HttpParams().set('studentId', String(studentId));
    return this.http.get<ApiEnvelope<{ status?: string }>>(`${this.base}/gate-passes/attendance-check`, { params }).pipe(map(r => r.data));
  }
}
