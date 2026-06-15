import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AcademicHistoryRow,
  AchievementRequest,
  AchievementResponse,
  AlumniFilters,
  AlumniRequest,
  AlumniResponse,
  ClassOption,
  DocumentVaultEntry,
  DocumentVaultKpi,
  DocumentVaultRequest,
  MedicalSnapshot,
  PromotionBatch,
  PromotionRecord,
  SectionOption,
  StudentDirectoryCard,
  StudentCreateRequest,
  StudentDocumentEntry,
  StudentKpi,
  StudentPersonal,
  StudentProfile360,
  StudentSearchRequest,
  StudentTimelineEntry,
  StudentWizardRequest,
  TransferRequest,
  TransferStatus
} from '../models/students-workspace.model';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PageEnvelope<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

// ---------- Mock helpers -----------------------------------------------
function mockAcademicHistory(): AcademicHistoryRow[] {
  return [
    { academicYear: '2023-2024', className: 'Class 5', sectionName: 'A', rollNumber: '12', result: 'Promoted', remarks: '' },
    { academicYear: '2022-2023', className: 'Class 4', sectionName: 'B', rollNumber: '18', result: 'Promoted', remarks: '' },
    { academicYear: '2021-2022', className: 'Class 3', sectionName: 'A', rollNumber: '20', result: 'Promoted', remarks: '' },
  ];
}

function mockStudentDocs(studentId: number): StudentDocumentEntry[] {
  return [
    { studentId, documentName: 'Birth Certificate', documentType: 'BIRTH_CERTIFICATE', status: 'VERIFIED', uploadedDate: '2024-01-15', category: 'PERSONAL' },
    { studentId, documentName: 'Aadhaar Card', documentType: 'IDENTITY_PROOF', status: 'UPLOADED', uploadedDate: '2024-01-15', category: 'PERSONAL' },
    { studentId, documentName: 'Transfer Certificate', documentType: 'TRANSFER_CERTIFICATE', status: 'PENDING', uploadedDate: null, category: 'ACADEMIC' },
    { studentId, documentName: 'Medical Certificate', documentType: 'MEDICAL_CERTIFICATE', status: 'MISSING', uploadedDate: null, category: 'MEDICAL' },
    { studentId, documentName: 'Address Proof', documentType: 'ADDRESS_PROOF', status: 'UPLOADED', uploadedDate: '2024-02-10', category: 'PERSONAL' },
  ];
}

function mockTimeline(studentId: number): StudentTimelineEntry[] {
  return [
    {
      action: 'Student Created',
      description: 'Student profile has been created.',
      performedBy: 'Admin',
      performedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      icon: 'pi pi-user-plus',
      tone: 'success'
    },
    {
      action: 'Document Uploaded',
      description: 'Birth certificate uploaded.',
      performedBy: 'Admin',
      performedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      icon: 'pi pi-file',
      tone: 'info'
    },
    {
      action: 'Academic Enrollment',
      description: 'Enrolled in Class 6-A for academic year 2025-2026.',
      performedBy: 'Admin',
      performedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      icon: 'pi pi-book',
      tone: 'success'
    },
    {
      action: 'Profile Updated',
      description: 'Personal information updated.',
      performedBy: 'Admin',
      performedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      icon: 'pi pi-pencil',
      tone: 'info'
    }
  ];
}

// -----------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class StudentsWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly workspaceBase = `${environment.baseUrl}/students/workspace`;
  private readonly studentsBase = `${environment.baseUrl}/students`;
  private readonly promotionsBase = `${environment.baseUrl}/promotions`;
  private readonly transfersBase = `${environment.baseUrl}/students/transfers`;
  private readonly classesBase = `${environment.baseUrl}/classes`;
  private readonly sectionsBase = `${environment.baseUrl}/sections`;

  // ---------- KPI ----------
  kpi(): Observable<StudentKpi> {
    return this.http
      .get<ApiEnvelope<StudentKpi>>(`${this.workspaceBase}/kpi`)
      .pipe(map(r => r.data));
  }

  // ---------- Directory ----------
  search(filter: StudentSearchRequest, page: number = 0, size: number = 20, sort: string = 'firstName,asc'): Observable<PageEnvelope<StudentDirectoryCard>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    return this.http
      .post<ApiEnvelope<PageEnvelope<StudentDirectoryCard>>>(`${this.workspaceBase}/directory/search`, filter, { params })
      .pipe(map(r => r.data));
  }

  // ---------- Class/Section options ----------
  listClasses(): Observable<ClassOption[]> {
    return this.http
      .get<ApiEnvelope<ClassOption[]>>(`${this.classesBase}`)
      .pipe(map(r => r.data ?? []));
  }

  listSectionsByClass(classId: number): Observable<SectionOption[]> {
    return this.http
      .get<ApiEnvelope<SectionOption[]>>(`${this.sectionsBase}?classId=${classId}`)
      .pipe(map(r => r.data ?? []));
  }

  // ---------- Student CRUD ----------
  createStudent(payload: StudentCreateRequest): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(`${this.workspaceBase}/students`, payload)
      .pipe(map(() => void 0));
  }

  createStudentWizard(payload: StudentWizardRequest): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(`${this.workspaceBase}/students`, payload)
      .pipe(map(() => void 0));
  }

  // ---------- Profile 360 ----------
  profile(studentId: number): Observable<StudentProfile360> {
    return this.http
      .get<ApiEnvelope<StudentProfile360>>(`${this.studentsBase}/${studentId}/profile-360`)
      .pipe(map(r => r.data));
  }

  updatePersonal(studentId: number, payload: Partial<StudentPersonal>): Observable<StudentPersonal> {
    return this.http
      .put<ApiEnvelope<StudentPersonal>>(`${this.studentsBase}/${studentId}/personal`, payload)
      .pipe(map(r => r.data));
  }

  updateMedical(studentId: number, payload: Partial<MedicalSnapshot>): Observable<void> {
    return this.http
      .put<ApiEnvelope<unknown>>(`${this.studentsBase}/${studentId}/medical`, payload)
      .pipe(map(() => void 0));
  }

  // ---------- Timeline ----------
  timeline(studentId: number): Observable<StudentTimelineEntry[]> {
    return this.http
      .get<ApiEnvelope<StudentTimelineEntry[]>>(`${this.studentsBase}/${studentId}/timeline`)
      .pipe(
        map(r => r.data ?? []),
      );
  }

  /** MOCK: returns mock timeline (used when API is not yet available) */
  timelineMock(studentId: number): Observable<StudentTimelineEntry[]> {
    return of(mockTimeline(studentId));
  }

  // ---------- Academic History ----------
  /** MOCK: Academic history is not yet in the backend — returns mock rows */
  academicHistory(studentId: number): Observable<AcademicHistoryRow[]> {
    return of(mockAcademicHistory());
  }

  // ---------- Student Documents ----------
  /** MOCK: Per-student documents — falls back to mock when API not ready */
  studentDocuments(studentId: number): Observable<StudentDocumentEntry[]> {
    return of(mockStudentDocs(studentId));
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
  alumni(filters?: AlumniFilters): Observable<AlumniResponse[]> {
    let params = new HttpParams();
    if (filters?.passoutYear) params = params.set('passoutYear', filters.passoutYear);
    if (filters?.course) params = params.set('course', filters.course);
    if (filters?.city) params = params.set('city', filters.city);
    if (filters?.occupation) params = params.set('occupation', filters.occupation);
    if (filters?.keyword) params = params.set('keyword', filters.keyword);
    return this.http
      .get<ApiEnvelope<AlumniResponse[]>>(`${this.workspaceBase}/alumni`, { params })
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

  addDocument(req: DocumentVaultRequest): Observable<DocumentVaultEntry> {
    return this.http
      .post<ApiEnvelope<DocumentVaultEntry>>(`${this.workspaceBase}/documents`, req)
      .pipe(map(r => r.data));
  }

  verifyDocument(id: number): Observable<DocumentVaultEntry> {
    return this.http
      .post<ApiEnvelope<DocumentVaultEntry>>(`${this.workspaceBase}/documents/${id}/verify`, {})
      .pipe(map(r => r.data));
  }

  deleteDocument(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void>>(`${this.workspaceBase}/documents/${id}`)
      .pipe(map(() => void 0));
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

  // ---------- Transfer ----------
  listTransfers(): Observable<TransferRequest[]> {
    return this.http
      .get<ApiEnvelope<TransferRequest[]>>(`${this.transfersBase}`)
      .pipe(map(r => r.data ?? []));
  }

  createTransfer(payload: TransferRequest): Observable<TransferRequest> {
    return this.http
      .post<ApiEnvelope<TransferRequest>>(this.transfersBase, payload)
      .pipe(map(r => r.data));
  }

  transitionTransfer(id: number, target: TransferStatus, remarks?: string): Observable<TransferRequest> {
    return this.http
      .put<ApiEnvelope<TransferRequest>>(`${this.transfersBase}/${id}/status`, { status: target, remarks: remarks })
      .pipe(map(r => r.data));
  }
}
