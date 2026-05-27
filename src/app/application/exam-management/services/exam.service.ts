import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../shared/models/api-response.model';

export interface ExamMaster {
  id: number;
  code: string;
  name: string;
  examType: string;
  academicYearId: number;
  status: string;
}

export interface Exam {
  id: number;
  examMasterId: number;
  subjectId: number;
  classId: number;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  status: 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'PUBLISHED' | 'CANCELLED';
}

export interface MarksEntry {
  id?: number;
  examId: number;
  studentId: number;
  marksObtained: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED';
}

export interface ExamResult {
  id: number;
  examId: number;
  studentId: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  status: 'DRAFT' | 'DECLARED';
}

@Injectable({ providedIn: 'root' })
export class ExamService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  // ----- exam masters -----
  // Backend exposes exam masters under /api/v1/exam/masters/types. The list
  // page surfaces these as `ExamMaster` records.
  listMasters(): Observable<ExamMaster[]> {
    return this.http.get<ApiResponse<ExamMaster[]>>(`${this.base}/exam/masters/types`)
      .pipe(map(r => r.data ?? []));
  }
  createMaster(payload: Partial<ExamMaster>): Observable<ExamMaster> {
    return this.http.post<ApiResponse<ExamMaster>>(`${this.base}/exam/masters/types`, payload).pipe(map(r => r.data));
  }
  updateMaster(id: number, payload: Partial<ExamMaster>): Observable<ExamMaster> {
    return this.http.put<ApiResponse<ExamMaster>>(`${this.base}/exam/masters/types/${id}`, payload).pipe(map(r => r.data));
  }

  // ----- exams -----
  // GET /exams requires academicYearId and returns a paged response. Resolve
  // to an empty list when no year is supplied so the list view can render its
  // empty state instead of triggering a 400/500.
  listExams(academicYearId?: number): Observable<Exam[]> {
    if (!academicYearId) {
      return of([]);
    }
    const params = new HttpParams().set('academicYearId', String(academicYearId));
    return this.http
      .get<ApiResponse<PageResponse<Exam>>>(`${this.base}/exams`, { params })
      .pipe(
        map(r => r.data?.content ?? []),
        catchError(() => of([] as Exam[]))
      );
  }
  getExam(id: number): Observable<Exam> {
    return this.http.get<ApiResponse<Exam>>(`${this.base}/exams/${id}`).pipe(map(r => r.data));
  }
  saveExam(payload: Partial<Exam>): Observable<Exam> {
    const url = payload.id ? `${this.base}/exams/${payload.id}` : `${this.base}/exams`;
    const verb = payload.id ? this.http.put<ApiResponse<Exam>>(url, payload) : this.http.post<ApiResponse<Exam>>(url, payload);
    return verb.pipe(map(r => r.data));
  }
  transitionExam(id: number, status: Exam['status']): Observable<Exam> {
    return this.http.patch<ApiResponse<Exam>>(`${this.base}/exams/${id}/status`, { status }).pipe(map(r => r.data));
  }

  // ----- marks -----
  listMarks(examId: number): Observable<MarksEntry[]> {
    return this.http.get<ApiResponse<MarksEntry[]>>(`${this.base}/exams/${examId}/marks`).pipe(map(r => r.data ?? []));
  }
  upsertMarks(examId: number, entries: MarksEntry[]): Observable<MarksEntry[]> {
    return this.http.post<ApiResponse<MarksEntry[]>>(`${this.base}/exams/${examId}/marks`, entries).pipe(map(r => r.data ?? []));
  }
  transitionMarks(examId: number, status: MarksEntry['status']): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/exams/${examId}/marks/status`, { status }).pipe(map(() => void 0));
  }

  // ----- results -----
  computeResults(examId: number): Observable<ExamResult[]> {
    return this.http.post<ApiResponse<ExamResult[]>>(`${this.base}/exams/${examId}/results/compute`, {}).pipe(map(r => r.data ?? []));
  }
  declareResults(examId: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.base}/exams/${examId}/results/declare`, {}).pipe(map(() => void 0));
  }
  listResults(examId: number): Observable<ExamResult[]> {
    return this.http.get<ApiResponse<ExamResult[]>>(`${this.base}/exams/${examId}/results`).pipe(map(r => r.data ?? []));
  }
}
