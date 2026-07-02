import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/auth.model';

export interface AuthSession {
  id: number;
  deviceName?: string;
  ipAddress?: string;
  loginAt?: string;
  lastActiveAt?: string;
  current?: boolean;
}

/**
 * Future-ready session management for user profile screens.
 * Backend: /api/access/sessions/*
 */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/access/sessions`;

  listUserSessions(userId: number | string, page = 0, size = 20): Observable<ApiResponse<{ content: AuthSession[] }>> {
    return this.http.get<ApiResponse<{ content: AuthSession[] }>>(`${this.base}/users/${userId}`, {
      params: { page: String(page), size: String(size) }
    });
  }

  revokeSession(sessionId: number | string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${sessionId}`);
  }

  revokeAllSessions(userId: number | string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/users/${userId}/all`);
  }
}
