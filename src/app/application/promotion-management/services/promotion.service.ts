import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../shared/models/api-response.model';

export type PromotionBatchStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ROLLED_BACK';
export type PromotionDecision   = 'PROMOTED' | 'RETAINED' | 'GRADUATED' | 'TRANSFERRED_OUT' | 'WITHHELD';
export type TransferStatus      = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CERTIFICATE_ISSUED' | 'CANCELLED';

export interface PromotionBatch {
  id: number;
  batchNumber?: string;
  batchCode?: string;
  fromAcademicYearId: number;
  toAcademicYearId: number;
  status: PromotionBatchStatus;
  plannedCount?: number;
  processedCount?: number;
  remarks?: string;
  createdAt?: string;
}

export interface PromotionBatchCreatePayload {
  fromAcademicYearId: number;
  toAcademicYearId: number;
  batchCode?: string;
  remarks?: string;
}

export interface PromotionRecord {
  id: number;
  batchId: number;
  studentId: number;
  fromClassId: number;
  toClassId?: number;
  decision: PromotionDecision;
}

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
export class PromotionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/promotions`;

  listBatches(): Observable<PromotionBatch[]> {
    return this.http.get<ApiResponse<PageResponse<PromotionBatch>>>(this.base)
      .pipe(map(r => r.data?.content ?? []));
  }
  createBatch(payload: PromotionBatchCreatePayload): Observable<PromotionBatch> {
    return this.http.post<ApiResponse<PromotionBatch>>(this.base, payload).pipe(map(r => r.data));
  }
  preview(batchId: number): Observable<PromotionRecord[]> {
    return this.http.post<ApiResponse<PromotionRecord[]>>(`${this.base}/${batchId}/preview`, {}).pipe(map(r => r.data ?? []));
  }
  records(batchId: number): Observable<PromotionRecord[]> {
    return this.http.get<ApiResponse<PromotionRecord[]>>(`${this.base}/${batchId}/records`).pipe(map(r => r.data ?? []));
  }
  updateRecord(batchId: number, recordId: number, payload: Partial<PromotionRecord>): Observable<PromotionRecord> {
    return this.http.put<ApiResponse<PromotionRecord>>(`${this.base}/records/${recordId}`, payload).pipe(map(r => r.data));
  }
  execute(batchId: number): Observable<PromotionBatch> {
    return this.http.post<ApiResponse<PromotionBatch>>(`${this.base}/${batchId}/execute`, {}).pipe(map(r => r.data));
  }
  rollback(batchId: number): Observable<PromotionBatch> {
    return this.http.post<ApiResponse<PromotionBatch>>(`${this.base}/${batchId}/rollback`, {}).pipe(map(r => r.data));
  }
  cancel(batchId: number): Observable<PromotionBatch> {
    return this.http.post<ApiResponse<PromotionBatch>>(`${this.base}/${batchId}/cancel`, {}).pipe(map(r => r.data));
  }
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
