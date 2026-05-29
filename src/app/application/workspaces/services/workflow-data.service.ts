import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginService } from '../../../services/login.service';
import {
  AdmissionApplication,
  ClassRecord,
  FollowUpRecord,
  InquiryRecord,
  InquiryStatus,
  InquiryWorkspaceData,
  SectionRecord,
  StudentDocumentRecord,
  StudentRecord,
  StudentWorkspaceData
} from '../models/workflow-workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkflowDataService {
  private readonly apiBase = environment.baseUrl;

  constructor(private readonly http: HttpClient, private readonly loginService: LoginService) { }

  loadInquiryWorkspace(): Observable<InquiryWorkspaceData> {
    return forkJoin({
      inquiries: this.getInquiries(),
      admissions: this.getAdmissions()
    }).pipe(
      switchMap(({ inquiries, admissions }) => {
        const followUpCalls = inquiries.map(inquiry => this.getFollowUps(inquiry.inquiryId));
        return (followUpCalls.length ? forkJoin(followUpCalls) : of([] as FollowUpRecord[][])).pipe(
          map(followUps => ({ inquiries, admissions, followUps: followUps.flat() }))
        );
      })
    );
  }

  loadStudentWorkspace(): Observable<StudentWorkspaceData> {
    return forkJoin({
      students: this.getStudents(),
      classes: this.getClasses(),
      inquiries: this.getInquiries(),
      admissions: this.getAdmissions()
    }).pipe(
      switchMap(({ students, classes, inquiries, admissions }) => {
        const sectionCalls = classes.map(item => this.getSections(item.classId));
        const documentCalls = students.map(student => this.getStudentDocuments(student.studentId));

        return forkJoin({
          sections: sectionCalls.length ? forkJoin(sectionCalls).pipe(map(values => values.flat())) : of([]),
          documents: documentCalls.length ? forkJoin(documentCalls).pipe(map(values => values.flat())) : of([])
        }).pipe(map(({ sections, documents }) => ({ students, classes, sections, documents, inquiries, admissions })));
      })
    );
  }

  createInquiry(payload: Partial<InquiryRecord>): Observable<InquiryRecord> {
    return this.http.post<any>(`${this.apiBase}/inquiries`, payload, { headers: this.headers() }).pipe(map(response => this.unwrap(response)));
  }

  addFollowUp(inquiryId: number, payload: Partial<FollowUpRecord>): Observable<FollowUpRecord> {
    return this.http.post<any>(`${this.apiBase}/inquiries/${inquiryId}/follow-ups`, payload, { headers: this.headers() }).pipe(map(response => this.unwrap(response)));
  }

  moveInquiryStage(inquiry: InquiryRecord, status: InquiryStatus): Observable<FollowUpRecord> {
    const needsNextDate = !['READY_FOR_ADMISSION', 'CONVERTED', 'LOST', 'CLOSED'].includes(status);
    const nextFollowUpDate = needsNextDate ? this.nextBusinessDate() : undefined;
    return this.addFollowUp(inquiry.inquiryId, {
      followUpType: 'OTHER',
      remarks: `Moved from ${inquiry.status} to ${status}`,
      statusAfterFollowUp: status,
      nextFollowUpDate
    });
  }

  private getInquiries(): Observable<InquiryRecord[]> {
    return this.http.get<any>(`${this.apiBase}/inquiries`, { headers: this.headers() }).pipe(
      map(response => this.unwrapArray<InquiryRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getFollowUps(inquiryId: number): Observable<FollowUpRecord[]> {
    return this.http.get<any>(`${this.apiBase}/inquiries/${inquiryId}/follow-ups`, { headers: this.headers() }).pipe(
      map(response => this.unwrapArray<FollowUpRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getAdmissions(): Observable<AdmissionApplication[]> {
    return this.http.get<any>(`${this.apiBase}/admissions`, { headers: this.headers() }).pipe(
      map(response => this.unwrapArray<AdmissionApplication>(response)),
      catchError(() => of([]))
    );
  }

  private getStudents(): Observable<StudentRecord[]> {
    return this.http.get<any>(`${this.apiBase}/students/getStudents`, { headers: this.headers() }).pipe(
      map(response => this.unwrapArray<StudentRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getStudentDocuments(studentId: number): Observable<StudentDocumentRecord[]> {
    return this.http.get<any>(`${this.apiBase}/students/${studentId}/documents`, { headers: this.headers() }).pipe(
      map(response => this.unwrapArray<StudentDocumentRecord>(response).map(document => ({ ...document, studentId }))),
      catchError(() => of([]))
    );
  }

  private getClasses(): Observable<ClassRecord[]> {
    return this.http.get<any>(`${this.apiBase}/classes/getListOfClass`, { headers: this.headers() }).pipe(
      map(response => this.unwrapArray<ClassRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getSections(classId: string | number): Observable<SectionRecord[]> {
    return this.http.get<any>(`${this.apiBase}/sections/getListOfSectionsByClassId/${classId}`, { headers: this.headers() }).pipe(
      map(response => this.unwrapArray<SectionRecord>(response)),
      catchError(() => of([]))
    );
  }

  private headers(): HttpHeaders {
    const token = this.loginService.getAccessToken();
    const tenant = this.loginService.getTenant() ?? environment.defaultTenantId;
    const organizationId = this.loginService.getCurrentOrganizationId() ?? environment.defaultOrganizationId;
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (tenant) {
      headers = headers.set('X-Tenant-ID', tenant);
    }
    if (organizationId) {
      headers = headers.set('X-Organization-ID', String(organizationId));
    }

    return headers;
  }

  private unwrapArray<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    if (Array.isArray(response?.content)) {
      return response.content;
    }
    return [];
  }

  private unwrap<T>(response: any): T {
    return (response?.data ?? response) as T;
  }

  private nextBusinessDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }
}