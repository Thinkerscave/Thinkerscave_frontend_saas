import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../shared/models/api-response.model';

export type NoticeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
export type MessageType = 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT';

export interface Notice {
  id: number;
  title: string;
  body: string;
  audience: string;
  status: NoticeStatus;
  publishedAt?: string;
  createdAt?: string;
}

export interface Notification {
  id: number;
  recipientUserId: number;
  channel: NotificationChannel;
  subject: string;
  body: string;
  sentAt?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
}

export interface Message {
  id: number;
  threadId: number;
  fromUserId: number;
  toUserId?: number;
  type: MessageType;
  body: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CommunicationService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ----- notices -----
  // GET /notices returns a paged response (PageResponse<NoticeDTO>). For the
  // list view we surface the flat `/notices/active` endpoint instead so users
  // see ready-to-read items without paging/sort plumbing.
  listNotices(): Observable<Notice[]> {
    return this.http.get<ApiResponse<Notice[]>>(`${this.base}/notices/active`)
      .pipe(map(r => r.data ?? []));
  }
  saveNotice(payload: Partial<Notice>): Observable<Notice> {
    const url = payload.id ? `${this.base}/notices/${payload.id}` : `${this.base}/notices`;
    return (payload.id
      ? this.http.put<ApiResponse<Notice>>(url, payload)
      : this.http.post<ApiResponse<Notice>>(url, payload)).pipe(map(r => r.data));
  }
  transitionNotice(id: number, status: NoticeStatus): Observable<Notice> {
    return this.http.patch<ApiResponse<Notice>>(`${this.base}/notices/${id}/status`, { status }).pipe(map(r => r.data));
  }

  // ----- notifications -----
  listNotifications(): Observable<Notification[]> {
    return this.http.get<ApiResponse<Notification[]>>(`${this.base}/notifications`).pipe(map(r => r.data ?? []));
  }
  sendNotification(payload: Partial<Notification>): Observable<Notification> {
    return this.http.post<ApiResponse<Notification>>(`${this.base}/notifications`, payload).pipe(map(r => r.data));
  }

  // ----- messages -----
  // Messages live under a thread. If no threadId is supplied we return an empty
  // observable instead of calling a non-existent flat /messages endpoint.
  listMessages(threadId?: number): Observable<Message[]> {
    if (!threadId) {
      return new Observable<Message[]>(sub => { sub.next([]); sub.complete(); });
    }
    return this.http
      .get<ApiResponse<PageResponse<Message>>>(`${this.base}/messages/threads/${threadId}/messages`)
      .pipe(map(r => r.data?.content ?? []));
  }
  postMessage(payload: Partial<Message>): Observable<Message> {
    return this.http
      .post<ApiResponse<Message>>(`${this.base}/messages/threads/${payload.threadId}/messages`, payload)
      .pipe(map(r => r.data));
  }
}
