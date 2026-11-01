import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PageResult } from '../front-desk/front-desk-api.service';

interface ApiEnvelope<T> {
  data: T;
}

export interface DocMaster {
  id?: number;
  masterName?: string;
  collectionType?: string;
  materialType?: string;
  description?: string;
  classIds?: string;
  status?: string;
  rejectionReason?: string | null;
}

export interface ClassStudentRow {
  studentId: number;
  studentName: string;
  rollNumber?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DocumentationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/documentation`;

  masters(kind: 'collection-masters' | 'material-masters', page: number, size: number, keyword: string, status: string): Observable<PageResult<DocMaster>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (keyword.trim()) params = params.set('keyword', keyword.trim());
    if (status) params = params.set('status', status);
    return this.http.get<ApiEnvelope<PageResult<DocMaster>>>(`${this.base}/${kind}`, { params }).pipe(map(r => r.data));
  }

  approved(kind: 'collection-masters' | 'material-masters'): Observable<DocMaster[]> {
    return this.http.get<ApiEnvelope<DocMaster[]>>(`${this.base}/${kind}/approved`).pipe(map(r => r.data ?? []));
  }

  saveMaster(kind: 'collection-masters' | 'material-masters', body: DocMaster): Observable<DocMaster> {
    if (body.id) {
      return this.http.put<ApiEnvelope<DocMaster>>(`${this.base}/${kind}/${body.id}`, body).pipe(map(r => r.data));
    }
    return this.http.post<ApiEnvelope<DocMaster>>(`${this.base}/${kind}`, body).pipe(map(r => r.data));
  }

  masterAction(kind: string, id: number, action: 'submit' | 'approve' | 'reject', reason?: string): Observable<DocMaster> {
    let params = new HttpParams();
    if (reason) params = params.set('reason', reason);
    return this.http.post<ApiEnvelope<DocMaster>>(`${this.base}/${kind}/${id}/${action}`, {}, { params }).pipe(map(r => r.data));
  }

  classStudents(classId: number): Observable<ClassStudentRow[]> {
    const params = new HttpParams().set('classId', String(classId));
    return this.http.get<ApiEnvelope<ClassStudentRow[]>>(`${this.base}/students`, { params }).pipe(map(r => r.data ?? []));
  }

  upload(file: File): Observable<{ fileName: string; filePath: string }> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<ApiEnvelope<{ fileName: string; filePath: string }>>(`${this.base}/files`, form).pipe(map(r => r.data));
  }

  saveCollection(body: unknown): Observable<Record<string, unknown>> {
    return this.http.post<ApiEnvelope<Record<string, unknown>>>(`${this.base}/collections`, body).pipe(map(r => r.data));
  }

  collections(page: number, size: number): Observable<PageResult<Record<string, unknown>>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiEnvelope<PageResult<Record<string, unknown>>>>(`${this.base}/collections`, { params }).pipe(map(r => r.data));
  }

  collectionItems(id: number): Observable<Record<string, unknown>[]> {
    return this.http.get<ApiEnvelope<Record<string, unknown>[]>>(`${this.base}/collections/${id}/items`).pipe(map(r => r.data ?? []));
  }

  saveHandover(body: unknown): Observable<Record<string, unknown>> {
    return this.http.post<ApiEnvelope<Record<string, unknown>>>(`${this.base}/handovers`, body).pipe(map(r => r.data));
  }

  handovers(page: number, size: number): Observable<PageResult<Record<string, unknown>>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiEnvelope<PageResult<Record<string, unknown>>>>(`${this.base}/handovers`, { params }).pipe(map(r => r.data));
  }

  handoverItems(id: number, status: string): Observable<Record<string, unknown>[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiEnvelope<Record<string, unknown>[]>>(`${this.base}/handovers/${id}/items`, { params }).pipe(map(r => r.data ?? []));
  }

  updateHandoverItem(itemId: number, body: unknown): Observable<Record<string, unknown>> {
    return this.http.put<ApiEnvelope<Record<string, unknown>>>(`${this.base}/handovers/items/${itemId}`, body).pipe(map(r => r.data));
  }
}
