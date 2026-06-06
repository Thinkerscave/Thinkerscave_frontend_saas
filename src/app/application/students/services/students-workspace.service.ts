import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AchievementRequest,
  AchievementResponse,
  AlumniRequest,
  AlumniResponse,
  DocumentVaultEntry,
  DocumentVaultKpi,
  PromotionBatch,
  PromotionRecord,
  StudentDirectoryCard,
  StudentKpi,
  StudentProfile360,
  StudentSearchRequest,
  StudentTimelineEntry,
  TransferRequest,
  TransferStatus
} from '../models/students-workspace.model';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PageEnvelope<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class StudentsWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly workspaceBase = `${environment.baseUrl}/students/workspace`;
  private readonly promotionsBase = `${environment.baseUrl}/promotions`;
  private readonly transfersBase = `${environment.baseUrl}/transfers`;

  // ---------- KPI ----------
  kpi(): Observable<StudentKpi> {
    return this.http
      .get<ApiEnvelope<StudentKpi>>(`${this.workspaceBase}/kpi`)
      .pipe(map(r => r.data));
  }

  // ---------- Directory ----------
  search(filter: StudentSearchRequest): Observable<StudentDirectoryCard[]> {
    return this.http
      .post<ApiEnvelope<StudentDirectoryCard[]>>(`${this.workspaceBase}/directory/search`, filter)
      .pipe(map(r => r.data ?? []));
  }

  // ---------- Profile 360 ----------
  profile(studentId: number): Observable<StudentProfile360> {
    return this.http
      .get<ApiEnvelope<StudentProfile360>>(`${this.workspaceBase}/students/${studentId}/profile-360`)
      .pipe(map(r => r.data));
  }

  timeline(studentId: number): Observable<StudentTimelineEntry[]> {
    return this.http
      .get<ApiEnvelope<StudentTimelineEntry[]>>(`${this.workspaceBase}/students/${studentId}/timeline`)
      .pipe(map(r => r.data ?? []));
  }

  // ---------- Achievements ----------
  achievements(studentId: number): Observable<AchievementResponse[]> {
    return this.http
      .get<ApiEnvelope<AchievementResponse[]>>(`${this.workspaceBase}/students/${studentId}/achievements`)
      .pipe(map(r => r.data ?? []));
  }

  addAchievement(studentId: number, req: AchievementRequest): Observable<AchievementResponse> {
    return this.http
      .post<ApiEnvelope<AchievementResponse>>(`${this.workspaceBase}/students/${studentId}/achievements`, req)
      .pipe(map(r => r.data));
  }

  // ---------- Alumni ----------
  alumni(): Observable<AlumniResponse[]> {
    return this.http
      .get<ApiEnvelope<AlumniResponse[]>>(`${this.workspaceBase}/alumni`)
      .pipe(map(r => r.data ?? []));
  }

  addAlumni(req: AlumniRequest): Observable<AlumniResponse> {
    return this.http
      .post<ApiEnvelope<AlumniResponse>>(`${this.workspaceBase}/alumni`, req)
      .pipe(map(r => r.data));
  }

  // ---------- Document Vault ----------
  documentKpi(): Observable<DocumentVaultKpi> {
    return this.http
      .get<ApiEnvelope<DocumentVaultKpi>>(`${this.workspaceBase}/documents/kpi`)
      .pipe(map(r => r.data));
  }

  documents(category?: string): Observable<DocumentVaultEntry[]> {
    let params = new HttpParams();
    if (category) { params = params.set('category', category); }
    return this.http
      .get<ApiEnvelope<DocumentVaultEntry[]>>(`${this.workspaceBase}/documents`, { params })
      .pipe(map(r => r.data ?? []));
  }

  // ---------- Promotion (existing API) ----------
  listPromotions(): Observable<PromotionBatch[]> {
    return this.http
      .get<ApiEnvelope<PageEnvelope<PromotionBatch>>>(`${this.promotionsBase}?page=0&size=50&sort=id,desc`)
      .pipe(map(r => r.data?.content ?? []));
  }

  createPromotion(payload: PromotionBatch): Observable<PromotionBatch> {
    return this.http
      .post<ApiEnvelope<PromotionBatch>>(this.promotionsBase, payload)
      .pipe(map(r => r.data));
  }

  previewPromotion(batchId: number): Observable<PromotionRecord[]> {
    return this.http
      .post<ApiEnvelope<PromotionRecord[]>>(`${this.promotionsBase}/${batchId}/preview`, {})
      .pipe(map(r => r.data ?? []));
  }

  promotionRecords(batchId: number): Observable<PromotionRecord[]> {
    return this.http
      .get<ApiEnvelope<PromotionRecord[]>>(`${this.promotionsBase}/${batchId}/records`)
      .pipe(map(r => r.data ?? []));
  }

  updatePromotionRecord(recordId: number, payload: PromotionRecord): Observable<PromotionRecord> {
    return this.http
      .put<ApiEnvelope<PromotionRecord>>(`${this.promotionsBase}/records/${recordId}`, payload)
      .pipe(map(r => r.data));
  }

  executePromotion(batchId: number): Observable<PromotionBatch> {
    return this.http
      .post<ApiEnvelope<PromotionBatch>>(`${this.promotionsBase}/${batchId}/execute`, {})
      .pipe(map(r => r.data));
  }

  // ---------- Transfer (existing API) ----------
  listTransfers(): Observable<TransferRequest[]> {
    return this.http
      .get<ApiEnvelope<PageEnvelope<TransferRequest>>>(`${this.transfersBase}?page=0&size=50&sort=id,desc`)
      .pipe(map(r => r.data?.content ?? []));
  }

  createTransfer(payload: TransferRequest): Observable<TransferRequest> {
    return this.http
      .post<ApiEnvelope<TransferRequest>>(this.transfersBase, payload)
      .pipe(map(r => r.data));
  }

  transitionTransfer(id: number, target: TransferStatus, remarks?: string): Observable<TransferRequest> {
    let params = new HttpParams().set('target', target);
    if (remarks) { params = params.set('remarks', remarks); }
    return this.http
      .patch<ApiEnvelope<TransferRequest>>(`${this.transfersBase}/${id}/status`, {}, { params })
      .pipe(map(r => r.data));
  }
}
