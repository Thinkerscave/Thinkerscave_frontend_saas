import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import {
  AcademicCalendarDashboard,
  AcademicCalendarEventDto,
  AcademicCalendarEventRequest,
  CalendarListFilters
} from '../models/academic-calendar.model';

@Injectable({ providedIn: 'root' })
export class AcademicCalendarApiService {
  private readonly http = inject(HttpClient);

  getDashboard(yearId: number, filters?: CalendarListFilters): Observable<AcademicCalendarDashboard> {
    return this.http
      .get<ApiResponse<AcademicCalendarDashboard>>(
        academicsApi.calendarDashboard(yearId),
        { params: this.toParams(filters) }
      )
      .pipe(map((res) => res.data));
  }

  list(yearId: number, filters?: CalendarListFilters): Observable<AcademicCalendarEventDto[]> {
    return this.http
      .get<ApiResponse<AcademicCalendarEventDto[]>>(
        academicsApi.calendarEventsByYear(yearId),
        { params: this.toParams(filters) }
      )
      .pipe(map((res) => res.data));
  }

  getById(eventId: number): Observable<AcademicCalendarEventDto> {
    return this.http
      .get<ApiResponse<AcademicCalendarEventDto>>(academicsApi.calendarEventById(eventId))
      .pipe(map((res) => res.data));
  }

  create(body: AcademicCalendarEventRequest): Observable<AcademicCalendarEventDto> {
    return this.http
      .post<ApiResponse<AcademicCalendarEventDto>>(academicsApi.calendarEvents, body)
      .pipe(map((res) => res.data));
  }

  update(eventId: number, body: AcademicCalendarEventRequest): Observable<AcademicCalendarEventDto> {
    return this.http
      .put<ApiResponse<AcademicCalendarEventDto>>(academicsApi.calendarEventById(eventId), body)
      .pipe(map((res) => res.data));
  }

  publish(eventId: number): Observable<AcademicCalendarEventDto> {
    return this.http
      .post<ApiResponse<AcademicCalendarEventDto>>(academicsApi.calendarEventPublish(eventId), {})
      .pipe(map((res) => res.data));
  }

  unpublish(eventId: number): Observable<AcademicCalendarEventDto> {
    return this.http
      .post<ApiResponse<AcademicCalendarEventDto>>(academicsApi.calendarEventUnpublish(eventId), {})
      .pipe(map((res) => res.data));
  }

  deactivate(eventId: number): Observable<AcademicCalendarEventDto> {
    return this.http
      .post<ApiResponse<AcademicCalendarEventDto>>(academicsApi.calendarEventDeactivate(eventId), {})
      .pipe(map((res) => res.data));
  }

  reactivate(eventId: number): Observable<AcademicCalendarEventDto> {
    return this.http
      .post<ApiResponse<AcademicCalendarEventDto>>(academicsApi.calendarEventReactivate(eventId), {})
      .pipe(map((res) => res.data));
  }

  upcoming(academicYearId?: number, limit = 8): Observable<AcademicCalendarEventDto[]> {
    let params = new HttpParams().set('limit', String(limit));
    if (academicYearId) params = params.set('academicYearId', String(academicYearId));
    return this.http
      .get<ApiResponse<AcademicCalendarEventDto[]>>(academicsApi.calendarUpcoming, { params })
      .pipe(map((res) => res.data));
  }

  private toParams(filters?: CalendarListFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) return params;
    if (filters.q?.trim()) params = params.set('q', filters.q.trim());
    if (filters.eventType) params = params.set('eventType', filters.eventType);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.audienceType) params = params.set('audienceType', filters.audienceType);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return params;
  }
}
