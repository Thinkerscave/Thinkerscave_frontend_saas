import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ExpenseAttachment, ExpenseCategory, ExpenseCreateRequest, ExpenseDetail, ExpenseFilter, ExpenseHead,
  ExpenseHeadRequest, ExpenseListRow, ExpenseOverview, ExpensePayment, ExpensePaymentRequest,
  ExpensePaymentResult, ExpenseSettings, ExpenseUpdateRequest, PageResponse
} from '../models/expenses.model';

interface ApiEnvelope<T> { success: boolean; message?: string; data: T; }

@Injectable({ providedIn: 'root' })
export class ExpensesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/expenses`;

  private mapPage<T>(data?: PageResponse<T> | null): PageResponse<T> {
    return { content: data?.content ?? [], totalElements: data?.totalElements ?? 0, totalPages: data?.totalPages ?? 0,
      number: data?.number ?? data?.page ?? 0, page: data?.page ?? data?.number ?? 0, size: data?.size ?? 10,
      first: data?.first, last: data?.last, sort: data?.sort };
  }

  private pageParams(page = 0, size = 10, sort?: string): HttpParams {
    let params = new HttpParams().set('page', page).set('size', size);
    return sort ? params.set('sort', sort) : params;
  }

  private filterParams(filter: ExpenseFilter, params = new HttpParams()): HttpParams {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return params;
  }

  private headers(key: string): HttpHeaders { return new HttpHeaders({ 'Idempotency-Key': key }); }

  overview(filter: ExpenseFilter): Observable<ExpenseOverview> {
    return this.http.get<ApiEnvelope<ExpenseOverview>>(`${this.base}/overview`, { params: this.filterParams(filter) }).pipe(map(r => r.data));
  }
  list(filter: ExpenseFilter, page = 0, size = 10, sort = 'expenseDate,desc'): Observable<PageResponse<ExpenseListRow>> {
    return this.http.get<ApiEnvelope<PageResponse<ExpenseListRow>>>(this.base, { params: this.filterParams(filter, this.pageParams(page, size, sort)) }).pipe(map(r => this.mapPage(r.data)));
  }
  create(body: ExpenseCreateRequest, idempotencyKey?: string): Observable<ExpenseDetail> {
    return this.http.post<ApiEnvelope<ExpenseDetail>>(this.base, body, idempotencyKey ? { headers: this.headers(idempotencyKey) } : {}).pipe(map(r => r.data));
  }
  get(id: number): Observable<ExpenseDetail> { return this.http.get<ApiEnvelope<ExpenseDetail>>(`${this.base}/${id}`).pipe(map(r => r.data)); }
  update(id: number, body: ExpenseUpdateRequest): Observable<ExpenseDetail> { return this.http.put<ApiEnvelope<ExpenseDetail>>(`${this.base}/${id}`, body).pipe(map(r => r.data)); }
  submit(id: number): Observable<ExpenseDetail> { return this.http.post<ApiEnvelope<ExpenseDetail>>(`${this.base}/${id}/submit`, {}).pipe(map(r => r.data)); }
  approve(id: number): Observable<ExpenseDetail> { return this.http.post<ApiEnvelope<ExpenseDetail>>(`${this.base}/${id}/approve`, {}).pipe(map(r => r.data)); }
  reject(id: number, remarks: string): Observable<ExpenseDetail> { return this.http.post<ApiEnvelope<ExpenseDetail>>(`${this.base}/${id}/reject`, { remarks }).pipe(map(r => r.data)); }
  returnToDraft(id: number): Observable<ExpenseDetail> { return this.http.post<ApiEnvelope<ExpenseDetail>>(`${this.base}/${id}/return-to-draft`, {}).pipe(map(r => r.data)); }
  recordPayment(id: number, body: ExpensePaymentRequest, key: string): Observable<ExpensePaymentResult> {
    return this.http.post<ApiEnvelope<ExpensePaymentResult>>(`${this.base}/${id}/payments`, body, { headers: this.headers(key) }).pipe(map(r => r.data));
  }
  listPayments(id: number): Observable<ExpensePayment[]> { return this.http.get<ApiEnvelope<ExpensePayment[]>>(`${this.base}/${id}/payments`).pipe(map(r => r.data ?? [])); }
  uploadAttachment(id: number, file: File, kind?: string): Observable<ExpenseAttachment> {
    const form = new FormData(); form.append('file', file);
    let params = new HttpParams(); if (kind) params = params.set('kind', kind);
    return this.http.post<ApiEnvelope<ExpenseAttachment>>(`${this.base}/${id}/attachments`, form, { params }).pipe(map(r => r.data));
  }
  listAttachments(id: number): Observable<ExpenseAttachment[]> { return this.http.get<ApiEnvelope<ExpenseAttachment[]>>(`${this.base}/${id}/attachments`).pipe(map(r => r.data ?? [])); }
  downloadAttachment(id: number, documentId: number): Observable<Blob> { return this.http.get(`${this.base}/${id}/attachments/${documentId}/download`, { responseType: 'blob' }); }
  deleteAttachment(id: number, documentId: number): Observable<void> { return this.http.delete<ApiEnvelope<void>>(`${this.base}/${id}/attachments/${documentId}`).pipe(map(() => undefined)); }
  listHeads(q = '', page = 0, size = 10, sort = 'name,asc'): Observable<PageResponse<ExpenseHead>> {
    let params = this.pageParams(page, size, sort); if (q) params = params.set('q', q);
    return this.http.get<ApiEnvelope<PageResponse<ExpenseHead>>>(`${this.base}/heads`, { params }).pipe(map(r => this.mapPage(r.data)));
  }
  headLookups(): Observable<ExpenseHead[]> { return this.http.get<ApiEnvelope<ExpenseHead[]>>(`${this.base}/heads/lookups`).pipe(map(r => r.data ?? [])); }
  getHead(id: number): Observable<ExpenseHead> { return this.http.get<ApiEnvelope<ExpenseHead>>(`${this.base}/heads/${id}`).pipe(map(r => r.data)); }
  createHead(body: ExpenseHeadRequest): Observable<ExpenseHead> { return this.http.post<ApiEnvelope<ExpenseHead>>(`${this.base}/heads`, body).pipe(map(r => r.data)); }
  updateHead(id: number, body: ExpenseHeadRequest): Observable<ExpenseHead> { return this.http.put<ApiEnvelope<ExpenseHead>>(`${this.base}/heads/${id}`, body).pipe(map(r => r.data)); }
  patchHeadStatus(id: number, status: string): Observable<ExpenseHead> { return this.http.patch<ApiEnvelope<ExpenseHead>>(`${this.base}/heads/${id}/status`, { status }).pipe(map(r => r.data)); }
  deleteHead(id: number): Observable<void> { return this.http.delete<ApiEnvelope<void>>(`${this.base}/heads/${id}`).pipe(map(() => undefined)); }
  listCategories(): Observable<ExpenseCategory[]> { return this.http.get<ApiEnvelope<ExpenseCategory[]>>(`${this.base}/categories`).pipe(map(r => r.data ?? [])); }
  getSettings(): Observable<ExpenseSettings> { return this.http.get<ApiEnvelope<ExpenseSettings>>(`${this.base}/settings`).pipe(map(r => r.data)); }
  updateSettings(body: ExpenseSettings): Observable<ExpenseSettings> { return this.http.put<ApiEnvelope<ExpenseSettings>>(`${this.base}/settings`, body).pipe(map(r => r.data)); }
  numberPreview(expenseDate?: string): Observable<string> {
    let params = new HttpParams(); if (expenseDate) params = params.set('expenseDate', expenseDate);
    return this.http.get<ApiEnvelope<string>>(`${this.base}/settings/number-preview`, { params }).pipe(map(r => r.data));
  }
}
