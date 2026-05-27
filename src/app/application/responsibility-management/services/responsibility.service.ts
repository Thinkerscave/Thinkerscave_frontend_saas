import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface Responsibility {
  id: number;
  code: string;
  name: string;
  description?: string;
  privilegeIds: number[];
}

export interface UserResponsibility {
  id: number;
  userId: number;
  responsibilityId: number;
  assignedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ResponsibilityService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/responsibilities`;

  list(): Observable<Responsibility[]> {
    return this.http.get<ApiResponse<Responsibility[]>>(this.base).pipe(map(r => r.data ?? []));
  }
  get(id: number): Observable<Responsibility> {
    return this.http.get<ApiResponse<Responsibility>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }
  save(payload: Partial<Responsibility>): Observable<Responsibility> {
    return payload.id
      ? this.http.put<ApiResponse<Responsibility>>(`${this.base}/${payload.id}`, payload).pipe(map(r => r.data))
      : this.http.post<ApiResponse<Responsibility>>(this.base, payload).pipe(map(r => r.data));
  }
  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => void 0));
  }

  listAssignments(userId: number): Observable<UserResponsibility[]> {
    return this.http.get<ApiResponse<UserResponsibility[]>>(`${this.base}/users/${userId}`).pipe(map(r => r.data ?? []));
  }
  assign(payload: { userId: number; responsibilityId: number }): Observable<UserResponsibility> {
    return this.http.post<ApiResponse<UserResponsibility>>(`${this.base}/assignments`, payload).pipe(map(r => r.data));
  }
  revoke(assignmentId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/assignments/${assignmentId}`).pipe(map(() => void 0));
  }
}
