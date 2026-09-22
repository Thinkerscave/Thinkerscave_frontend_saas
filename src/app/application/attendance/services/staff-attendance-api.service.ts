import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { staffAttendanceApi } from '../../../shared/constants/api.endpoint';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { StaffAttendanceTodayResponse } from '../../dashboard/models/dashboard.model';
import {
  CreateRegularizationPayload,
  RegularizationDecisionPayload,
  RegularizationRequest,
  RegularizationRequestStatus,
  StaffAttendanceHistoryDay
} from '../models/staff-attendance.model';

@Injectable({ providedIn: 'root' })
export class StaffAttendanceApiService {
  private readonly http = inject(HttpClient);

  getMyToday(): Observable<StaffAttendanceTodayResponse> {
    return this.http.get<unknown>(staffAttendanceApi.myToday).pipe(
      map(response => unwrapApiResponse<StaffAttendanceTodayResponse>(response, {
        state: 'NOT_STARTED',
        attendanceRequired: true,
        active: false,
        autoClosed: false,
        workingMinutes: 0
      }))
    );
  }

  getMyHistory(from: string, to: string): Observable<StaffAttendanceHistoryDay[]> {
    return this.http.get<unknown>(staffAttendanceApi.myHistory(from, to)).pipe(
      map(response => unwrapApiResponse<StaffAttendanceHistoryDay[]>(response, []))
    );
  }

  signIn(remarks?: string): Observable<StaffAttendanceTodayResponse> {
    return this.http.post<unknown>(staffAttendanceApi.signIn, { remarks }).pipe(
      map(response => unwrapApiResponse<StaffAttendanceTodayResponse>(response, {
        state: 'ACTIVE',
        attendanceRequired: true,
        active: true,
        autoClosed: false,
        workingMinutes: 0
      }))
    );
  }

  signOut(remarks?: string): Observable<StaffAttendanceTodayResponse> {
    return this.http.post<unknown>(staffAttendanceApi.signOut, { remarks }).pipe(
      map(response => unwrapApiResponse<StaffAttendanceTodayResponse>(response, {
        state: 'COMPLETED',
        attendanceRequired: true,
        active: false,
        autoClosed: false,
        workingMinutes: 0
      }))
    );
  }

  listMyRegularizations(status?: RegularizationRequestStatus): Observable<RegularizationRequest[]> {
    return this.http.get<unknown>(staffAttendanceApi.regularizations.me(status)).pipe(
      map(response => unwrapApiResponse<RegularizationRequest[]>(response, []))
    );
  }

  listPendingRegularizations(): Observable<RegularizationRequest[]> {
    return this.http.get<unknown>(staffAttendanceApi.regularizations.pending).pipe(
      map(response => unwrapApiResponse<RegularizationRequest[]>(response, []))
    );
  }

  pendingRegularizationCount(): Observable<number> {
    return this.http.get<unknown>(staffAttendanceApi.regularizations.pendingCount).pipe(
      map(response => {
        const data = unwrapApiResponse<{ count: number }>(response, { count: 0 });
        return data.count ?? 0;
      })
    );
  }

  getRegularization(id: number): Observable<RegularizationRequest> {
    return this.http.get<unknown>(staffAttendanceApi.regularizations.byId(id)).pipe(
      map(response => unwrapApiResponse<RegularizationRequest>(response, { requestId: id } as RegularizationRequest))
    );
  }

  createRegularization(payload: CreateRegularizationPayload): Observable<RegularizationRequest> {
    return this.http.post<unknown>(staffAttendanceApi.regularizations.base, payload).pipe(
      map(response => unwrapApiResponse<RegularizationRequest>(response, {} as RegularizationRequest))
    );
  }

  approveRegularization(id: number, payload: RegularizationDecisionPayload): Observable<RegularizationRequest> {
    return this.http.post<unknown>(staffAttendanceApi.regularizations.approve(id), payload).pipe(
      map(response => unwrapApiResponse<RegularizationRequest>(response, {} as RegularizationRequest))
    );
  }

  rejectRegularization(id: number, payload: RegularizationDecisionPayload): Observable<RegularizationRequest> {
    return this.http.post<unknown>(staffAttendanceApi.regularizations.reject(id), payload).pipe(
      map(response => unwrapApiResponse<RegularizationRequest>(response, {} as RegularizationRequest))
    );
  }
}
