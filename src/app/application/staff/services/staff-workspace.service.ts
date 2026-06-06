import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AlumniStaffKpi,
  AlumniStaffRequest,
  AlumniStaffResponse,
  LeaveAvailabilityKpi,
  ResponsibilityKpi,
  ResponsibilityRequest,
  ResponsibilityResponse,
  StaffDirectoryCard,
  StaffDocumentEntry,
  StaffDocumentKpi,
  StaffDocumentRequest,
  StaffKpi,
  StaffProfile360,
  StaffSearchRequest,
  StaffTeachingSnapshot,
  StaffTimelineEntry,
  TeachingProfileRequest,
  TodayLeaveEntry
} from '../models/staff-workspace.model';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class StaffWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/staff/workspace`;

  // ---------- KPI ----------
  kpi(): Observable<StaffKpi> {
    return this.http.get<ApiEnvelope<StaffKpi>>(`${this.base}/kpi`).pipe(map(r => r.data));
  }

  // ---------- Directory ----------
  search(filter: StaffSearchRequest): Observable<StaffDirectoryCard[]> {
    return this.http
      .post<ApiEnvelope<StaffDirectoryCard[]>>(`${this.base}/directory/search`, filter)
      .pipe(map(r => r.data ?? []));
  }

  // ---------- Profile 360 ----------
  profile(staffId: number): Observable<StaffProfile360> {
    return this.http
      .get<ApiEnvelope<StaffProfile360>>(`${this.base}/employees/${staffId}/profile-360`)
      .pipe(map(r => r.data));
  }

  timeline(staffId: number): Observable<StaffTimelineEntry[]> {
    return this.http
      .get<ApiEnvelope<StaffTimelineEntry[]>>(`${this.base}/employees/${staffId}/timeline`)
      .pipe(map(r => r.data ?? []));
  }

  saveTeachingProfile(req: TeachingProfileRequest): Observable<StaffTeachingSnapshot> {
    return this.http
      .post<ApiEnvelope<StaffTeachingSnapshot>>(`${this.base}/employees/teaching-profile`, req)
      .pipe(map(r => r.data));
  }

  // ---------- Responsibilities ----------
  responsibilityKpi(): Observable<ResponsibilityKpi> {
    return this.http
      .get<ApiEnvelope<ResponsibilityKpi>>(`${this.base}/responsibilities/kpi`)
      .pipe(map(r => r.data));
  }

  listResponsibilities(): Observable<ResponsibilityResponse[]> {
    return this.http
      .get<ApiEnvelope<ResponsibilityResponse[]>>(`${this.base}/responsibilities`)
      .pipe(map(r => r.data ?? []));
  }

  addResponsibility(req: ResponsibilityRequest): Observable<ResponsibilityResponse> {
    return this.http
      .post<ApiEnvelope<ResponsibilityResponse>>(`${this.base}/responsibilities`, req)
      .pipe(map(r => r.data));
  }

  updateResponsibility(id: number, req: ResponsibilityRequest): Observable<ResponsibilityResponse> {
    return this.http
      .put<ApiEnvelope<ResponsibilityResponse>>(`${this.base}/responsibilities/${id}`, req)
      .pipe(map(r => r.data));
  }

  deleteResponsibility(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void>>(`${this.base}/responsibilities/${id}`)
      .pipe(map(() => void 0));
  }

  // ---------- Leave & Availability ----------
  leaveKpi(): Observable<LeaveAvailabilityKpi> {
    return this.http
      .get<ApiEnvelope<LeaveAvailabilityKpi>>(`${this.base}/leave/kpi`)
      .pipe(map(r => r.data));
  }

  todayLeaves(): Observable<TodayLeaveEntry[]> {
    return this.http
      .get<ApiEnvelope<TodayLeaveEntry[]>>(`${this.base}/leave/today`)
      .pipe(map(r => r.data ?? []));
  }

  // ---------- Documents Vault ----------
  documentKpi(): Observable<StaffDocumentKpi> {
    return this.http
      .get<ApiEnvelope<StaffDocumentKpi>>(`${this.base}/documents/kpi`)
      .pipe(map(r => r.data));
  }

  documents(category?: string, staffId?: number): Observable<StaffDocumentEntry[]> {
    let params = new HttpParams();
    if (category) { params = params.set('category', category); }
    if (staffId !== undefined && staffId !== null) { params = params.set('staffId', String(staffId)); }
    return this.http
      .get<ApiEnvelope<StaffDocumentEntry[]>>(`${this.base}/documents`, { params })
      .pipe(map(r => r.data ?? []));
  }

  addDocument(req: StaffDocumentRequest): Observable<StaffDocumentEntry> {
    return this.http
      .post<ApiEnvelope<StaffDocumentEntry>>(`${this.base}/documents`, req)
      .pipe(map(r => r.data));
  }

  verifyDocument(id: number): Observable<StaffDocumentEntry> {
    return this.http
      .post<ApiEnvelope<StaffDocumentEntry>>(`${this.base}/documents/${id}/verify`, {})
      .pipe(map(r => r.data));
  }

  deleteDocument(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void>>(`${this.base}/documents/${id}`)
      .pipe(map(() => void 0));
  }

  // ---------- Alumni Staff ----------
  alumniKpi(): Observable<AlumniStaffKpi> {
    return this.http
      .get<ApiEnvelope<AlumniStaffKpi>>(`${this.base}/alumni/kpi`)
      .pipe(map(r => r.data));
  }

  alumni(): Observable<AlumniStaffResponse[]> {
    return this.http
      .get<ApiEnvelope<AlumniStaffResponse[]>>(`${this.base}/alumni`)
      .pipe(map(r => r.data ?? []));
  }

  addAlumni(req: AlumniStaffRequest): Observable<AlumniStaffResponse> {
    return this.http
      .post<ApiEnvelope<AlumniStaffResponse>>(`${this.base}/alumni`, req)
      .pipe(map(r => r.data));
  }
}
