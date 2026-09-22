import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AcademicYearOption,
  AllocationPreview,
  BillingPeriodOption,
  BillingPeriodRow,
  ClassFeeConfiguredFilter,
  ClassFeeStructureOverview,
  CloneFeeStructureRequest,
  CollectFeeRequest,
  CollectFeeResult,
  CollectionTrendPoint,
  ConfigureClassFeeStructureRequest,
  CopyClassFeeStructureRequest,
  FeeDashboardKpis,
  FeeHead,
  FeeHeadRequest,
  FeePayment,
  FeeReceipt,
  FeeStructure,
  FeeStructureRequest,
  FinanceSettings,
  LinkedStudentOption,
  OutstandingItem,
  OutstandingSummary,
  PageResponse,
  PaymentMethod,
  PaymentStatusSlice,
  StudentFeeDetail,
  StudentFeeListItem,
  StudentFeeSummary
} from '../models/fees.model';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class FeesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/fees`;

  private mapPage<T>(data: PageResponse<T> | null | undefined): PageResponse<T> {
    return {
      content: data?.content ?? [],
      totalElements: data?.totalElements ?? 0,
      totalPages: data?.totalPages ?? 0,
      number: data?.number ?? data?.page ?? 0,
      page: data?.page ?? data?.number ?? 0,
      size: data?.size ?? 10,
      first: data?.first,
      last: data?.last,
      sort: data?.sort
    };
  }

  private pageParams(page = 0, size = 10, sort = 'createdOn,desc'): HttpParams {
    return new HttpParams().set('page', String(page)).set('size', String(size)).set('sort', sort);
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────

  dashboardKpis(academicYearId: number): Observable<FeeDashboardKpis> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiEnvelope<FeeDashboardKpis>>(`${this.base}/dashboard/kpis`, { params }).pipe(map(r => r.data));
  }

  collectionTrend(academicYearId: number): Observable<CollectionTrendPoint[]> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiEnvelope<CollectionTrendPoint[]>>(`${this.base}/dashboard/collection-trend`, { params })
      .pipe(map(r => r.data ?? []));
  }

  paymentStatus(academicYearId: number): Observable<PaymentStatusSlice[]> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiEnvelope<PaymentStatusSlice[]>>(`${this.base}/dashboard/payment-status`, { params })
      .pipe(map(r => r.data ?? []));
  }

  upcomingDues(academicYearId: number): Observable<OutstandingItem[]> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiEnvelope<OutstandingItem[]>>(`${this.base}/dashboard/upcoming-dues`, { params })
      .pipe(map(r => r.data ?? []));
  }

  recentCollections(page = 0, size = 8, sort = 'paidOn,desc'): Observable<PageResponse<FeePayment>> {
    const params = this.pageParams(page, size, sort);
    return this.http.get<ApiEnvelope<PageResponse<FeePayment>>>(`${this.base}/dashboard/recent-collections`, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  // ─── Receipts ────────────────────────────────────────────────────────────

  listReceipts(
    filter: {
      q?: string;
      academicYearId?: number;
      studentId?: number;
      classId?: number;
      sectionId?: number;
      paymentMethod?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
    },
    page = 0,
    size = 10,
    sort = 'issuedOn,desc'
  ): Observable<PageResponse<FeeReceipt>> {
    let params = this.pageParams(page, size, sort);
    if (filter.q) params = params.set('q', filter.q);
    if (filter.academicYearId != null) params = params.set('academicYearId', String(filter.academicYearId));
    if (filter.studentId != null) params = params.set('studentId', String(filter.studentId));
    if (filter.classId != null) params = params.set('classId', String(filter.classId));
    if (filter.sectionId != null) params = params.set('sectionId', String(filter.sectionId));
    if (filter.paymentMethod) params = params.set('paymentMethod', filter.paymentMethod);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    return this.http.get<ApiEnvelope<PageResponse<FeeReceipt>>>(`${this.base}/receipts`, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  getReceipt(id: number): Observable<FeeReceipt> {
    return this.http.get<ApiEnvelope<FeeReceipt>>(`${this.base}/receipts/${id}`).pipe(map(r => r.data));
  }

  previewReceipt(id: number): Observable<FeeReceipt> {
    return this.http.get<ApiEnvelope<FeeReceipt>>(`${this.base}/receipts/${id}/preview`).pipe(map(r => r.data));
  }

  downloadReceiptPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/receipts/${id}/download`, { responseType: 'blob' });
  }

  // ─── Fee Heads ───────────────────────────────────────────────────────────

  listHeads(filter: { q?: string; category?: string; status?: string }, page = 0, size = 10, sort = 'createdOn,desc'): Observable<PageResponse<FeeHead>> {
    let params = this.pageParams(page, size, sort);
    if (filter.q) params = params.set('q', filter.q);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.status) params = params.set('status', filter.status);
    return this.http.get<ApiEnvelope<PageResponse<FeeHead>>>(`${this.base}/heads`, { params }).pipe(map(r => this.mapPage(r.data)));
  }

  getHead(id: number): Observable<FeeHead> {
    return this.http.get<ApiEnvelope<FeeHead>>(`${this.base}/heads/${id}`).pipe(map(r => r.data));
  }

  createHead(body: FeeHeadRequest): Observable<FeeHead> {
    return this.http.post<ApiEnvelope<FeeHead>>(`${this.base}/heads`, body).pipe(map(r => r.data));
  }

  updateHead(id: number, body: FeeHeadRequest): Observable<FeeHead> {
    return this.http.put<ApiEnvelope<FeeHead>>(`${this.base}/heads/${id}`, body).pipe(map(r => r.data));
  }

  patchHeadStatus(id: number, status: string): Observable<FeeHead> {
    return this.http.patch<ApiEnvelope<FeeHead>>(`${this.base}/heads/${id}/status`, { status }).pipe(map(r => r.data));
  }

  deleteHead(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<void>>(`${this.base}/heads/${id}`).pipe(map(() => undefined));
  }

  headLookups(): Observable<FeeHead[]> {
    return this.http.get<ApiEnvelope<FeeHead[]>>(`${this.base}/heads/lookups`).pipe(map(r => r.data ?? []));
  }

  // ─── Structures ──────────────────────────────────────────────────────────

  listStructures(filter: { q?: string; academicYearId?: number; classId?: number; status?: string }, page = 0, size = 10, sort = 'createdOn,desc'): Observable<PageResponse<FeeStructure>> {
    let params = this.pageParams(page, size, sort);
    if (filter.q) params = params.set('q', filter.q);
    if (filter.academicYearId != null) params = params.set('academicYearId', String(filter.academicYearId));
    if (filter.classId != null) params = params.set('classId', String(filter.classId));
    if (filter.status) params = params.set('status', filter.status);
    return this.http.get<ApiEnvelope<PageResponse<FeeStructure>>>(`${this.base}/structures`, { params }).pipe(map(r => this.mapPage(r.data)));
  }

  classStructureOverview(
    academicYearId: number,
    filter: { q?: string; configuredStatus?: ClassFeeConfiguredFilter },
    page = 0,
    size = 10
  ): Observable<PageResponse<ClassFeeStructureOverview>> {
    let params = this.pageParams(page, size, 'displayOrder,asc');
    params = params.set('academicYearId', String(academicYearId));
    if (filter.q) params = params.set('q', filter.q);
    if (filter.configuredStatus && filter.configuredStatus !== 'ALL') {
      params = params.set('configuredStatus', filter.configuredStatus);
    }
    return this.http
      .get<ApiEnvelope<PageResponse<ClassFeeStructureOverview>>>(`${this.base}/structures/class-overview`, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  getStructureByClass(academicYearId: number, classId: number): Observable<FeeStructure> {
    const params = new HttpParams()
      .set('academicYearId', String(academicYearId))
      .set('classId', String(classId));
    return this.http
      .get<ApiEnvelope<FeeStructure>>(`${this.base}/structures/by-class`, { params })
      .pipe(map(r => r.data));
  }

  getStructure(id: number): Observable<FeeStructure> {
    return this.http.get<ApiEnvelope<FeeStructure>>(`${this.base}/structures/${id}`).pipe(map(r => r.data));
  }

  createStructure(body: FeeStructureRequest): Observable<FeeStructure> {
    return this.http.post<ApiEnvelope<FeeStructure>>(`${this.base}/structures`, body).pipe(map(r => r.data));
  }

  updateStructure(id: number, body: FeeStructureRequest): Observable<FeeStructure> {
    return this.http.put<ApiEnvelope<FeeStructure>>(`${this.base}/structures/${id}`, body).pipe(map(r => r.data));
  }

  configureClassStructure(body: ConfigureClassFeeStructureRequest): Observable<FeeStructure> {
    return this.http
      .post<ApiEnvelope<FeeStructure>>(`${this.base}/structures/configure`, body)
      .pipe(map(r => r.data));
  }

  patchStructureStatus(id: number, status: string): Observable<FeeStructure> {
    return this.http.patch<ApiEnvelope<FeeStructure>>(`${this.base}/structures/${id}/status`, { status }).pipe(map(r => r.data));
  }

  cloneStructure(id: number, body: CloneFeeStructureRequest): Observable<FeeStructure[]> {
    return this.http.post<ApiEnvelope<FeeStructure[]>>(`${this.base}/structures/${id}/clone`, body).pipe(map(r => r.data ?? []));
  }

  copyStructureToClasses(id: number, body: CopyClassFeeStructureRequest): Observable<FeeStructure[]> {
    return this.http
      .post<ApiEnvelope<FeeStructure[]>>(`${this.base}/structures/${id}/copy-to-classes`, body)
      .pipe(map(r => r.data ?? []));
  }

  // ─── Student Fee ─────────────────────────────────────────────────────────

  listStudents(
    filter: {
      academicYearId?: number;
      q?: string;
      classId?: number;
      sectionId?: number;
      status?: string;
      periodKey?: string;
      outstandingOnly?: boolean | string;
      [key: string]: string | number | boolean | undefined;
    },
    page = 0,
    size = 10,
    sort = 'outstanding,desc'
  ): Observable<PageResponse<StudentFeeListItem>> {
    let params = this.pageParams(page, size, sort);
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiEnvelope<PageResponse<StudentFeeListItem>>>(`${this.base}/students`, { params }).pipe(map(r => this.mapPage(r.data)));
  }

  studentFeeSummary(filter: {
    academicYearId?: number;
    q?: string;
    classId?: number;
    sectionId?: number;
    status?: string;
    periodKey?: string;
    outstandingOnly?: boolean | string;
  }): Observable<StudentFeeSummary> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiEnvelope<StudentFeeSummary>>(`${this.base}/students/summary`, { params }).pipe(map(r => r.data));
  }

  billingPeriodOptions(academicYearId: number): Observable<BillingPeriodOption[]> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http
      .get<ApiEnvelope<BillingPeriodOption[]>>(`${this.base}/students/billing-periods`, { params })
      .pipe(map(r => r.data ?? []));
  }

  linkedStudents(): Observable<LinkedStudentOption[]> {
    return this.http.get<ApiEnvelope<LinkedStudentOption[]>>(`${this.base}/students/linked`).pipe(map(r => r.data ?? []));
  }

  studentDetail(studentId: number, academicYearId: number): Observable<StudentFeeDetail> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiEnvelope<StudentFeeDetail>>(`${this.base}/students/${studentId}`, { params }).pipe(map(r => r.data));
  }

  studentPeriods(studentId: number, academicYearId: number): Observable<BillingPeriodRow[]> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiEnvelope<BillingPeriodRow[]>>(`${this.base}/students/${studentId}/periods`, { params }).pipe(map(r => r.data ?? []));
  }

  searchStudents(q: string, academicYearId: number, size = 20): Observable<StudentFeeListItem[]> {
    let params = new HttpParams().set('q', q).set('academicYearId', String(academicYearId)).set('size', String(size));
    return this.http.get<ApiEnvelope<StudentFeeListItem[]>>(`${this.base}/students/search`, { params }).pipe(map(r => r.data ?? []));
  }

  studentPayments(studentId: number, academicYearId: number): Observable<FeePayment[]> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiEnvelope<FeePayment[]>>(`${this.base}/students/${studentId}/payments`, { params })
      .pipe(map(r => r.data ?? []));
  }

  studentReceipts(studentId: number, academicYearId: number): Observable<FeeReceipt[]> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiEnvelope<FeeReceipt[]>>(`${this.base}/students/${studentId}/receipts`, { params })
      .pipe(map(r => r.data ?? []));
  }

  studentAcademicYears(studentId: number): Observable<AcademicYearOption[]> {
    return this.http.get<ApiEnvelope<AcademicYearOption[]>>(`${this.base}/students/${studentId}/academic-years`)
      .pipe(map(r => r.data ?? []));
  }

  // ─── Collection ──────────────────────────────────────────────────────────

  previewPayment(body: CollectFeeRequest): Observable<AllocationPreview> {
    return this.http.post<ApiEnvelope<AllocationPreview>>(`${this.base}/payments/preview`, body).pipe(map(r => r.data));
  }

  collectPayment(body: CollectFeeRequest, idempotencyKey: string): Observable<CollectFeeResult> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<ApiEnvelope<CollectFeeResult>>(`${this.base}/payments`, body, { headers }).pipe(map(r => r.data));
  }

  listOutstanding(filter: Record<string, string | number | undefined>, page = 0, size = 10, sort = 'dueDate,asc'): Observable<PageResponse<OutstandingItem>> {
    let params = this.pageParams(page, size, sort);
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiEnvelope<PageResponse<OutstandingItem>>>(`${this.base}/outstanding`, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  outstandingSummary(academicYearId: number): Observable<OutstandingSummary> {
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http.get<ApiEnvelope<OutstandingSummary>>(`${this.base}/outstanding/summary`, { params }).pipe(map(r => r.data));
  }

  // ─── Payment methods / settings ──────────────────────────────────────────

  listPaymentMethods(status?: string): Observable<PaymentMethod[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiEnvelope<PaymentMethod[] | PageResponse<PaymentMethod>>>(`${this.base}/payment-methods`, { params }).pipe(
      map(r => {
        const data = r.data as PaymentMethod[] | PageResponse<PaymentMethod>;
        return Array.isArray(data) ? data : (data?.content ?? []);
      })
    );
  }

  getSettings(): Observable<FinanceSettings> {
    return this.http.get<ApiEnvelope<FinanceSettings>>(`${this.base}/settings`).pipe(map(r => r.data));
  }

  updateGenerationSettings(body: Partial<FinanceSettings>): Observable<FinanceSettings> {
    return this.http.put<ApiEnvelope<FinanceSettings>>(`${this.base}/settings/generation`, body).pipe(map(r => r.data));
  }

  updateReminderSettings(body: { reminderRules: FinanceSettings['reminderRules'] }): Observable<FinanceSettings> {
    return this.http.put<ApiEnvelope<FinanceSettings>>(`${this.base}/settings/reminders`, body).pipe(map(r => r.data));
  }

  runGeneration(academicYearId: number, classId?: number): Observable<unknown> {
    return this.http
      .post<ApiEnvelope<unknown>>(`${this.base}/settings/generation/run`, {
        academicYearId,
        classId: classId ?? null
      })
      .pipe(map(r => r.data));
  }
}
