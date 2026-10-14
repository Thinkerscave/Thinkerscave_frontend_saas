import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../shared/models/api-response.model';

export type TransferStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CERTIFICATE_ISSUED' | 'CANCELLED';

export interface TransferRequest {
  id: number;
  transferNumber?: string;
  studentId: number;
  enrollmentId: number;
  reason?: string;
  status: TransferStatus;
  createdAt?: string;
  certificateNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class TransferRequestService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/transfers`;

  list(): Observable<TransferRequest[]> {
    return this.http.get<ApiResponse<PageResponse<TransferRequest>>>(this.base)
      .pipe(map(r => r.data?.content ?? []));
  }
  create(payload: Partial<TransferRequest>): Observable<TransferRequest> {
    return this.http.post<ApiResponse<TransferRequest>>(this.base, payload).pipe(map(r => r.data));
  }
  transition(id: number, status: TransferStatus): Observable<TransferRequest> {
    const params = new HttpParams().set('target', status);
    return this.http.patch<ApiResponse<TransferRequest>>(`${this.base}/${id}/status`, {}, { params }).pipe(map(r => r.data));
  }
}
