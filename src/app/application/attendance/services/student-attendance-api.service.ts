import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { academicsLookupApi, attendanceApi } from '../../../shared/constants/api.endpoint';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import {
  AcademicLookupItem,
  AttendanceCalendarData,
  AttendanceSummaryReportPayload,
  ClassAttendanceSummary,
  MarkDailyAttendanceRequest,
  StudentRoster,
  StudentSession
} from '../models/student-attendance.model';

/** Dropdown lookups used by the attendance pages (AcademicsLookupController). */
export interface AttendanceLookups {
  years: AcademicLookupItem[];
  classes: AcademicLookupItem[];
  sections: AcademicLookupItem[];
}

@Injectable({ providedIn: 'root' })
export class StudentAttendanceApiService {
  private readonly http = inject(HttpClient);

  getYears(): Observable<AcademicLookupItem[]> {
    return this.http.get<unknown>(academicsLookupApi.years).pipe(
      map(response => unwrapApiResponse<AcademicLookupItem[]>(response, []))
    );
  }

  getClassesByYear(yearId: number): Observable<AcademicLookupItem[]> {
    return this.http.get<unknown>(academicsLookupApi.classesByYear(yearId)).pipe(
      map(response => unwrapApiResponse<AcademicLookupItem[]>(response, []))
    );
  }

  getSectionsByClass(classId: number): Observable<AcademicLookupItem[]> {
    return this.http.get<unknown>(academicsLookupApi.sectionsByClass(classId)).pipe(
      map(response => unwrapApiResponse<AcademicLookupItem[]>(response, []))
    );
  }

  getRoster(classId: number, sectionId: number | null, date: string): Observable<StudentRoster> {
    return this.http.get<unknown>(attendanceApi.studentRoster(classId, sectionId, date)).pipe(
      map(response => unwrapApiResponse<StudentRoster>(response, {
        attendanceDate: date,
        classId,
        sectionId,
        attendanceMode: 'DAILY',
        attendanceRequired: true,
        holiday: false,
        weekend: false,
        frozen: false,
        students: []
      }))
    );
  }

  getSessions(from: string, to: string, classId: number | null, sectionId: number | null): Observable<StudentSession[]> {
    return this.http.get<unknown>(attendanceApi.studentSessions(from, to, classId, sectionId)).pipe(
      map(response => unwrapApiResponse<StudentSession[]>(response, []))
    );
  }

  getCalendar(year: number, month: number, classId: number | null, sectionId: number | null): Observable<AttendanceCalendarData> {
    return this.http.get<unknown>(attendanceApi.calendar(year, month, classId, sectionId)).pipe(
      map(response => unwrapApiResponse<AttendanceCalendarData>(response, { year, month, classId, sectionId, days: [] }))
    );
  }

  getClassAttendance(classId: number, sectionId: number | null, date: string): Observable<ClassAttendanceSummary> {
    return this.http.get<unknown>(attendanceApi.studentClass(classId, sectionId, date)).pipe(
      map(response => unwrapApiResponse<ClassAttendanceSummary>(response, {
        attendanceDate: date,
        classId,
        sectionId,
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendancePercent: 0
      }))
    );
  }

  markDaily(payload: MarkDailyAttendanceRequest): Observable<ClassAttendanceSummary> {
    return this.http.post<unknown>(attendanceApi.studentDaily, payload).pipe(
      map(response => unwrapApiResponse<ClassAttendanceSummary>(response, {
        attendanceDate: payload.attendanceDate,
        classId: payload.classId,
        sectionId: payload.sectionId ?? null,
        totalStudents: payload.entries.length,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendancePercent: 0
      }))
    );
  }

  copyPrevious(classId: number, sectionId: number | null, targetDate: string): Observable<ClassAttendanceSummary> {
    return this.http.post<unknown>(attendanceApi.copyPrevious(classId, targetDate, sectionId), {}).pipe(
      map(response => unwrapApiResponse<ClassAttendanceSummary>(response, {
        attendanceDate: targetDate,
        classId,
        sectionId,
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendancePercent: 0
      }))
    );
  }

  getSummaryReport(payload: AttendanceSummaryReportPayload): Observable<unknown> {
    return this.http.post<unknown>(attendanceApi.reports.summary, payload).pipe(
      map(response => (response && typeof response === 'object' && 'data' in response
        ? (response as { data: unknown }).data
        : response)
      )
    );
  }
}