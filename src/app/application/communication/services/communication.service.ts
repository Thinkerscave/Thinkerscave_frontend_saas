import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../shared/models/api-response.model';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { LoginService } from '../../../core/services/login.service';

export type NoticeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
export type MessageType = 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT';

export interface Notice {
  id: number;
  title: string;
  body: string;
  audience: string;
  category?: string;
  pinned?: boolean;
  status: NoticeStatus;
  publishedAt?: string;
  createdAt?: string;
}

export interface Notification {
  id: number;
  subject: string;
  body: string;
  channel: string;
  sentAt?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'QUEUED' | 'CANCELLED';
  totalRecipients?: number;
  deliveredCount?: number;
  failedCount?: number;
}

export interface MessageThread {
  id: number;
  subject: string;
  participantUserIds: number[];
  lastMessageAt?: string;
  closed: boolean;
}

export interface Message {
  id: number;
  threadId: number;
  fromUserId: number;
  body: string;
  createdAt?: string;
}

interface NoticeDto {
  noticeId: number;
  title: string;
  content?: string;
  category?: string;
  pinned?: boolean;
  status: NoticeStatus;
  publishDate?: string;
  createdOn?: string;
  audiences?: Array<{ audienceType?: string; refId?: number }>;
}

interface NotificationDto {
  notificationId: number;
  subject?: string;
  body?: string;
  channelsCsv?: string;
  sentAt?: string;
  status: Notification['status'];
  totalRecipients?: number;
  deliveredCount?: number;
  failedCount?: number;
}

interface MessageThreadDto {
  threadId: number;
  subject?: string;
  participantUserIdsCsv?: string;
  lastMessageAt?: string;
  closed?: boolean;
}

interface MessageDto {
  messageId: number;
  threadId: number;
  senderUserId: number;
  body: string;
  sentAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CommunicationService {
  private readonly http = inject(HttpClient);
  private readonly loginService = inject(LoginService);
  private readonly base = `${environment.apiUrl}/communication`;

  // ----- notices -----
  listNotices(status?: NoticeStatus): Observable<Notice[]> {
    const params = new HttpParams()
      .set('size', '100')
      .set('sort', 'createdOn,desc');
    const url = status
      ? `${this.base}/notices/by-status`
      : `${this.base}/notices`;
    const requestParams = status ? params.set('status', status) : params;

    return this.http
      .get<ApiResponse<PageResponse<NoticeDto>>>(url, { params: requestParams })
      .pipe(map(r => (unwrapApiResponse(r, { content: [] })?.content ?? []).map(dto => this.mapNotice(dto))));
  }

  getNotice(id: number): Observable<Notice> {
    return this.http
      .get<ApiResponse<NoticeDto>>(`${this.base}/notices/${id}`)
      .pipe(map(r => this.mapNotice(unwrapApiResponse(r, {} as NoticeDto))));
  }

  saveNotice(payload: Partial<Notice>): Observable<Notice> {
    const body = this.toNoticeRequest(payload);
    if (payload.id) {
      return this.http
        .put<ApiResponse<NoticeDto>>(`${this.base}/notices/${payload.id}`, body)
        .pipe(map(r => this.mapNotice(unwrapApiResponse(r, {} as NoticeDto))));
    }
    return this.http
      .post<ApiResponse<NoticeDto>>(`${this.base}/notices`, body)
      .pipe(map(r => this.mapNotice(unwrapApiResponse(r, {} as NoticeDto))));
  }

  publishNotice(id: number): Observable<Notice> {
    return this.http
      .put<ApiResponse<NoticeDto>>(`${this.base}/notices/${id}/publish`, {})
      .pipe(map(r => this.mapNotice(unwrapApiResponse(r, {} as NoticeDto))));
  }

  transitionNotice(id: number, status: NoticeStatus): Observable<Notice> {
    if (status === 'PUBLISHED') {
      return this.publishNotice(id);
    }
    return this.saveNotice({ id, status });
  }

  // ----- notifications -----
  listNotifications(): Observable<Notification[]> {
    const params = new HttpParams().set('size', '100').set('sort', 'createdOn,desc');
    return this.http
      .get<ApiResponse<PageResponse<NotificationDto>>>(`${this.base}/notifications`, { params })
      .pipe(map(r => (unwrapApiResponse(r, { content: [] })?.content ?? []).map(dto => this.mapNotification(dto))));
  }

  // ----- messages -----
  listThreads(): Observable<MessageThread[]> {
    const userId = this.currentUserId();
    if (!userId) {
      return of([]);
    }
    const params = new HttpParams().set('userId', String(userId)).set('size', '50');
    return this.http
      .get<ApiResponse<PageResponse<MessageThreadDto>>>(`${this.base}/messages/threads`, { params })
      .pipe(map(r => (unwrapApiResponse(r, { content: [] })?.content ?? []).map(dto => this.mapThread(dto))));
  }

  listMessages(threadId: number): Observable<Message[]> {
    const params = new HttpParams().set('size', '100').set('sort', 'sentAt,asc');
    return this.http
      .get<ApiResponse<PageResponse<MessageDto>>>(`${this.base}/messages/threads/${threadId}`, { params })
      .pipe(map(r => (unwrapApiResponse(r, { content: [] })?.content ?? []).map(dto => this.mapMessage(dto))));
  }

  postMessage(threadId: number, body: string): Observable<Message> {
    const senderUserId = this.currentUserId();
    const params = new HttpParams().set('senderUserId', String(senderUserId));
    return this.http
      .post<ApiResponse<MessageDto>>(`${this.base}/messages/threads/${threadId}`, { body }, { params })
      .pipe(map(r => this.mapMessage(unwrapApiResponse(r, {} as MessageDto))));
  }

  private currentUserId(): number {
    const user = this.loginService.getUser();
    const raw = user?.id;
    return raw != null ? Number(raw) : 0;
  }

  private mapNotice(dto: NoticeDto): Notice {
    const audiences = (dto.audiences ?? [])
      .map(a => a.audienceType)
      .filter(Boolean)
      .join(', ');
    return {
      id: dto.noticeId,
      title: dto.title,
      body: dto.content ?? '',
      audience: audiences || dto.category || 'All',
      category: dto.category,
      pinned: dto.pinned,
      status: dto.status,
      publishedAt: dto.publishDate,
      createdAt: dto.createdOn
    };
  }

  private toNoticeRequest(payload: Partial<Notice>) {
    return {
      title: payload.title,
      content: payload.body,
      category: payload.category ?? payload.audience,
      status: payload.status ?? 'DRAFT'
    };
  }

  private mapNotification(dto: NotificationDto): Notification {
    return {
      id: dto.notificationId,
      subject: dto.subject ?? 'Notification',
      body: dto.body ?? '',
      channel: dto.channelsCsv ?? 'IN_APP',
      sentAt: dto.sentAt,
      status: dto.status,
      totalRecipients: dto.totalRecipients,
      deliveredCount: dto.deliveredCount,
      failedCount: dto.failedCount
    };
  }

  private mapThread(dto: MessageThreadDto): MessageThread {
    const ids = (dto.participantUserIdsCsv ?? '')
      .split(',')
      .map(v => Number(v.trim()))
      .filter(v => !Number.isNaN(v) && v > 0);
    return {
      id: dto.threadId,
      subject: dto.subject ?? `Thread #${dto.threadId}`,
      participantUserIds: ids,
      lastMessageAt: dto.lastMessageAt,
      closed: !!dto.closed
    };
  }

  private mapMessage(dto: MessageDto): Message {
    return {
      id: dto.messageId,
      threadId: dto.threadId,
      fromUserId: dto.senderUserId,
      body: dto.body,
      createdAt: dto.sentAt
    };
  }
}
