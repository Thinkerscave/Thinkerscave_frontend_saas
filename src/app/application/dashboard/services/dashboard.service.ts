import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { dashboardApi, staffAttendanceApi } from '../../../shared/constants/api.endpoint';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { DashboardResponse, StaffAttendanceResponse } from '../models/dashboard.model';

/**
 * Thin client for the backend-driven dashboard workspace. The shell never
 * assembles or shapes widget data itself — it only fetches, caches for the
 * lifetime of the page, and re-fetches on demand (e.g. manual refresh).
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getWorkspace(): Observable<DashboardResponse> {
    return this.http.get<unknown>(dashboardApi.workspace).pipe(
      map(response => unwrapApiResponse<DashboardResponse>(response, { dashboardType: 'DEFAULT', generatedAt: new Date().toISOString(), widgets: [] }))
    );
  }

  getMyTodayAttendance(): Observable<StaffAttendanceResponse> {
    return this.http.get<unknown>(staffAttendanceApi.myToday).pipe(
      map(response => unwrapApiResponse<StaffAttendanceResponse>(response, { staffId: 0 }))
    );
  }

  signIn(staffId: number, remarks?: string): Observable<StaffAttendanceResponse> {
    return this.http.post<unknown>(staffAttendanceApi.signIn, { staffId, remarks }).pipe(
      map(response => unwrapApiResponse<StaffAttendanceResponse>(response, { staffId }))
    );
  }

  signOut(staffId: number, remarks?: string): Observable<StaffAttendanceResponse> {
    return this.http.post<unknown>(staffAttendanceApi.signOut, { staffId, remarks }).pipe(
      map(response => unwrapApiResponse<StaffAttendanceResponse>(response, { staffId }))
    );
  }
}
