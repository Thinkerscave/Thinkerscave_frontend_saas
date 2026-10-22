import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  PageResponse,
  Responsibility,
  ResponsibilityAssignmentRequest,
  StaffBankDetails,
  StaffActivity,
  StaffBankDetailsRequest,
  StaffCreateRequest,
  StaffCreateResponse,
  StaffDashboard,
  StaffDetail,
  StaffDocumentResponse,
  StaffFilterParams,
  StaffSummary,
  StaffUpdateRequest
} from '../models/staff.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}`;
  private readonly photoCache = new Map<number, string>();

  // ──────────────────────────────────────────────────────────────────────────
  // Staff
  // ──────────────────────────────────────────────────────────────────────────

  getDashboard(): Observable<StaffDashboard> {
    return this.http
      .get<ApiResponse<StaffDashboard>>(`${this.base}/staff/dashboard`)
      .pipe(map(r => r.data));
  }

  getStaffList(filters: StaffFilterParams = {}): Observable<PageResponse<StaffSummary>> {
    let params = new HttpParams();
    if (filters.keyword)            { params = params.set('keyword',            filters.keyword); }
    if (filters.staffType)          { params = params.set('staffType',          filters.staffType); }
    if (filters.employmentCategory) { params = params.set('employmentCategory', filters.employmentCategory); }
    if (filters.employmentStatus)   { params = params.set('employmentStatus',   filters.employmentStatus); }
    if (filters.designation)        { params = params.set('designation',        filters.designation); }
    if (filters.page !== undefined)  { params = params.set('page',              String(filters.page)); }
    if (filters.size !== undefined)  { params = params.set('size',              String(filters.size)); }
    if (filters.sort)               { params = params.set('sort',               filters.sort); }
    return this.http
      .get<ApiResponse<PageResponse<StaffSummary>>>(`${this.base}/staff`, { params })
      .pipe(map(r => r.data));
  }

  getActivity(staffId: number): Observable<StaffActivity[]> {
    return this.http
      .get<ApiResponse<StaffActivity[]>>(`${this.base}/staff/${staffId}/activity`)
      .pipe(map(r => r.data ?? []));
  }

  getStaffDetail(staffId: number): Observable<StaffDetail> {
    return this.http
      .get<ApiResponse<StaffDetail>>(`${this.base}/staff/${staffId}`)
      .pipe(map(r => r.data));
  }

  /**
   * Export the filtered staff list as XLSX. Requires the bearer token, so it is fetched as a blob.
   */
  exportStaff(filters: StaffFilterParams = {}): Observable<{ blob: Blob; fileName: string }> {
    let params = new HttpParams();
    if (filters.keyword)            { params = params.set('keyword',            filters.keyword); }
    if (filters.staffType)          { params = params.set('staffType',          filters.staffType); }
    if (filters.employmentCategory) { params = params.set('employmentCategory', filters.employmentCategory); }
    if (filters.employmentStatus)   { params = params.set('employmentStatus',   filters.employmentStatus); }
    if (filters.designation)        { params = params.set('designation',        filters.designation); }
    return this.http
      .get(`${this.base}/staff/export`, { params, observe: 'response', responseType: 'blob' })
      .pipe(map(res => ({
        blob: res.body as Blob,
        fileName: fileNameFromDisposition(res, 'staff.xlsx')
      })));
  }

  /** Active subjects of the current academic year (academics subject master). */
  getSubjectOptions(): Observable<{ id: number; name: string }[]> {
    return this.http
      .get<ApiResponse<{ id: number; name: string }[]>>(`${environment.baseUrl}/academics/lookup/subjects`)
      .pipe(map(r => r.data ?? []));
  }

  createStaff(request: StaffCreateRequest): Observable<StaffCreateResponse> {
    return this.http
      .post<ApiResponse<StaffCreateResponse>>(`${this.base}/staff`, request)
      .pipe(map(r => r.data));
  }

  updateStaff(staffId: number, request: StaffUpdateRequest): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.base}/staff/${staffId}`, request)
      .pipe(map(() => void 0));
  }

  activateStaff(staffId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/staff/${staffId}/activate`, {})
      .pipe(map(() => void 0));
  }

  deactivateStaff(staffId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/staff/${staffId}/deactivate`, {})
      .pipe(map(() => void 0));
  }

  deleteStaff(staffId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/staff/${staffId}`)
      .pipe(map(() => void 0));
  }

  saveBankDetails(staffId: number, request: StaffBankDetailsRequest): Observable<StaffBankDetails> {
    return this.http
      .put<ApiResponse<StaffBankDetails>>(`${this.base}/staff/${staffId}/bank-details`, request)
      .pipe(map(r => r.data));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Staff Documents
  // ──────────────────────────────────────────────────────────────────────────

  listStaffDocuments(staffId: number): Observable<StaffDocumentResponse[]> {
    return this.http
      .get<ApiResponse<StaffDocumentResponse[]>>(`${this.base}/staff/${staffId}/documents`)
      .pipe(map(r => r.data ?? []));
  }

  uploadStaffDocument(
    staffId: number,
    file: File,
    documentType: string,
    documentName?: string
  ): Observable<StaffDocumentResponse> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('documentType', documentType);
    if (documentName) { form.append('documentName', documentName); }
    return this.http
      .post<ApiResponse<StaffDocumentResponse>>(`${this.base}/staff/${staffId}/documents`, form, {
        headers: { 'X-Skip-Error-Toast': '1' }
      })
      .pipe(map(r => r.data));
  }

  replaceStaffDocument(
    staffId: number,
    documentId: number,
    file: File,
    documentName?: string
  ): Observable<StaffDocumentResponse> {
    const form = new FormData();
    form.append('file', file, file.name);
    if (documentName) { form.append('documentName', documentName); }
    return this.http
      .put<ApiResponse<StaffDocumentResponse>>(`${this.base}/staff/${staffId}/documents/${documentId}`, form)
      .pipe(map(r => r.data));
  }

  /** Downloads a document as a blob (authenticated). */
  downloadStaffDocument(staffId: number, documentId: number): Observable<{ blob: Blob; fileName: string }> {
    return this.http
      .get(`${this.base}/staff/${staffId}/documents/${documentId}/download`, { observe: 'response', responseType: 'blob' })
      .pipe(map(res => ({
        blob: res.body as Blob,
        fileName: fileNameFromDisposition(res, 'document')
      })));
  }

  deactivateStaffDocument(staffId: number, documentId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/staff/${staffId}/documents/${documentId}`)
      .pipe(map(() => void 0));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Profile Photo
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Returns an object URL for the staff photo, or null when none exists.
   * <img> cannot send the bearer token, so the photo is fetched as a blob and cached per staff.
   */
  getPhotoObjectUrl(staffId: number): Observable<string | null> {
    const cached = this.photoCache.get(staffId);
    if (cached) {
      return of(cached);
    }
    return this.http
      .get(`${this.base}/staff/${staffId}/photo`, {
        observe: 'response',
        responseType: 'blob',
        headers: new HttpHeaders({ 'X-Skip-Error-Toast': '1' })
      })
      .pipe(
        map(res => {
          const url = URL.createObjectURL(res.body as Blob);
          this.photoCache.set(staffId, url);
          return url;
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) { return of(null); }
          throw err;
        })
      );
  }

  uploadStaffPhoto(staffId: number, file: File): Observable<void> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/staff/${staffId}/photo`, form)
      .pipe(
        tap(() => this.clearPhoto(staffId)),
        map(() => void 0)
      );
  }

  removeStaffPhoto(staffId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/staff/${staffId}/photo`)
      .pipe(
        tap(() => this.clearPhoto(staffId)),
        map(() => void 0)
      );
  }

  /** Drops the cached object URL so the next read fetches the current photo. */
  clearPhoto(staffId: number): void {
    const url = this.photoCache.get(staffId);
    if (url) {
      URL.revokeObjectURL(url);
      this.photoCache.delete(staffId);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Responsibilities
  // ──────────────────────────────────────────────────────────────────────────

  getResponsibilities(): Observable<Responsibility[]> {
    return this.http
      .get<ApiResponse<Responsibility[]>>(`${this.base}/staff/responsibilities`)
      .pipe(map(r => r.data ?? []));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Responsibility Assignments
  // ──────────────────────────────────────────────────────────────────────────

  assignResponsibility(request: ResponsibilityAssignmentRequest): Observable<{ assignmentId: number }> {
    return this.http
      .post<ApiResponse<{ assignmentId: number }>>(`${this.base}/staff/responsibility-assignments`, request)
      .pipe(map(r => r.data));
  }

  removeAssignment(assignmentId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/staff/responsibility-assignments/${assignmentId}/deactivate`, {})
      .pipe(map(() => void 0));
  }
}

/** Reads the filename from a Content-Disposition header, falling back to the given name. */
function fileNameFromDisposition(res: HttpResponse<Blob>, fallback: string): string {
  const header = res.headers.get('Content-Disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match ? decodeURIComponent(match[1]) : fallback;
}

/** Triggers a browser download for a blob. */
export function saveBlobAsFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
