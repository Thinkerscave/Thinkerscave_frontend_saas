import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { dashboardApi } from '../../../shared/constants/api.endpoint';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { DashboardResponse } from '../models/dashboard.model';
import { StaffAttendanceApiService } from '../../attendance/services/staff-attendance-api.service';
import { StaffAttendanceTodayResponse } from '../models/dashboard.model';

/**
 * Thin client for the backend-driven dashboard workspace. The shell never
 * assembles or shapes widget data itself — it only fetches, caches for the
 * lifetime of the page, and re-fetches on demand (e.g. manual refresh).
 *
 * Staff attendance actions are delegated to {@link StaffAttendanceApiService}
 * so every staff dashboard reuses one API-driven widget client.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly staffAttendanceApi = inject(StaffAttendanceApiService);

  getWorkspace(): Observable<DashboardResponse> {
    return this.http.get<unknown>(dashboardApi.workspace).pipe(
      map(response => unwrapApiResponse<DashboardResponse>(response, { dashboardType: 'DEFAULT', generatedAt: new Date().toISOString(), widgets: [] }))
    );
  }

  getMyTodayAttendance(): Observable<StaffAttendanceTodayResponse> {
    return this.staffAttendanceApi.getMyToday();
  }

  signIn(_staffId?: number, remarks?: string): Observable<StaffAttendanceTodayResponse> {
    return this.staffAttendanceApi.signIn(remarks);
  }

  signOut(_staffId?: number, remarks?: string): Observable<StaffAttendanceTodayResponse> {
    return this.staffAttendanceApi.signOut(remarks);
  }
}
