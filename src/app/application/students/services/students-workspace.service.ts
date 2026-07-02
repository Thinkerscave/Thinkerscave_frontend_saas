import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

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
  StudentCreateRequest,
  StudentDirectoryCard,
  StudentDocumentEntry,
  StudentKpi,
  StudentPersonal,
  StudentProfile360,
  StudentSearchRequest,
  StudentStatus,
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

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface BackendStudentDto {
  studentId: number;
  studentCode?: string | null;
  admissionNumber?: string | null;
  fullName?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  status?: string | null;
  className?: string | null;
  sectionName?: string | null;
  parentName?: string | null;
  parentMobileNumber?: string | null;
}

interface BackendProfileDto {
  student: BackendStudentDto;
  parent?: {
    parentId?: number;
    fullName?: string;
    mobileNumber?: string;
    email?: string;
    occupation?: string;
  };
  enrollment?: {
    enrollmentId?: number;
    academicYear?: string;
    className?: string;
    sectionName?: string;
    rollNumber?: string;
    status?: string;
  };
  medical?: MedicalSnapshot;
  timeline?: BackendTimelineDto[];
}

interface BackendTimelineDto {
  timelineId?: number;
  eventType?: string;
  title?: string;
  description?: string;
  createdDate?: string;
  createdBy?: string;
}

interface BackendLookupDto {
  id: number;
  name: string;
}

interface BackendTransferDto {
  id: number;
  requestNumber?: string;
  studentId?: number;
  enrollmentId?: number;
  reason?: string;
  destinationSchool?: string;
  status?: string;
  requestedOn?: string;
  certificateNumber?: string;
}

interface BulkUploadSummary {
  totalRecords?: number;
  successCount?: number;
  failureCount?: number;
  errors?: string[];
}

export interface StudentImportResult {
  jobId: string;
  total: number;
  success: number;
  failed: number;
  errors?: string[];
}

export interface PageEnvelope<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class StudentsWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly studentsBase = `${environment.baseUrl}/students`;
  private readonly documentsBase = `${environment.baseUrl}/documents`;
  private readonly promotionsBase = `${environment.baseUrl}/promotions`;
  private readonly transfersBase = `${environment.baseUrl}/students/transfers`;

  private academicYearCache: ClassOption[] = [];

  // ---------- KPI ----------
  kpi(): Observable<StudentKpi> {
    const count = (status?: StudentStatus) => {
      let params = new HttpParams().set('page', '0').set('size', '1');
      if (status) params = params.set('status', status);
      return this.http
        .get<ApiEnvelope<SpringPage<BackendStudentDto>>>(this.studentsBase, { params })
        .pipe(map(r => r.data?.totalElements ?? 0));
    };

    return forkJoin({
      totalStudents: count(),
      activeStudents: count('ACTIVE'),
      inactiveStudents: count('INACTIVE'),
      alumniCount: this.http
        .get<ApiEnvelope<BackendStudentDto[]>>(`${this.studentsBase}/alumni`)
        .pipe(map(r => r.data?.length ?? 0)),
      newAdmissionsThisYear: count('ACTIVE')
    }).pipe(
      map(({ totalStudents, activeStudents, inactiveStudents, alumniCount, newAdmissionsThisYear }) => ({
        totalStudents,
        activeStudents,
        inactiveStudents,
        alumniCount,
        newAdmissionsThisYear
      }))
    );
  }

  // ---------- Directory ----------
  search(
    filter: StudentSearchRequest,
    page = 0,
    size = 20,
    sort = 'firstName,asc'
  ): Observable<PageEnvelope<StudentDirectoryCard>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', sort);
    if (filter.keyword) params = params.set('keyword', filter.keyword);
    if (filter.classId) params = params.set('classId', filter.classId);
    if (filter.sectionId) params = params.set('sectionId', filter.sectionId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.parentName) params = params.set('parentName', filter.parentName);

    return this.http
      .get<ApiEnvelope<SpringPage<BackendStudentDto>>>(this.studentsBase, { params })
      .pipe(map(r => this.mapPage(r.data, dto => this.mapDirectoryCard(dto))));
  }

  // ---------- Class/Section options ----------
  listAcademicYears(): Observable<ClassOption[]> {
    return this.http
      .get<ApiEnvelope<BackendLookupDto[]>>(`${this.studentsBase}/academic-years`)
      .pipe(map(r => (r.data ?? []).map(y => ({ id: y.id, label: y.name }))));
  }

  listClasses(academicYearId?: number): Observable<ClassOption[]> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', String(academicYearId));
    return this.http
      .get<ApiEnvelope<BackendLookupDto[]>>(`${this.studentsBase}/classes`, { params })
      .pipe(map(r => (r.data ?? []).map(c => ({ id: c.id, label: c.name }))));
  }

  listSectionsByClass(classId: number): Observable<SectionOption[]> {
    return this.http
      .get<ApiEnvelope<BackendLookupDto[]>>(`${this.studentsBase}/sections`, {
        params: new HttpParams().set('classId', String(classId))
      })
      .pipe(map(r => (r.data ?? []).map(s => ({ id: s.id, label: s.name, classId }))));
  }

  listBloodGroups(): Observable<string[]> {
    return this.http
      .get<ApiEnvelope<string[]>>(`${this.studentsBase}/blood-groups`)
      .pipe(map(r => r.data ?? []));
  }

  // ---------- Student CRUD ----------
  createStudent(payload: StudentCreateRequest): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(this.studentsBase, payload)
      .pipe(map(() => void 0));
  }

  createStudentWizard(payload: StudentWizardRequest): Observable<void> {
    return this.resolveAcademicYearId(payload.academicYear).pipe(
      switchMap(academicYearId => {
        const primary = payload.parents?.[0];
        const body = {
          admissionNumber: payload.admissionNumber?.trim() || `ADM-${Date.now()}`,
          rollNumber: payload.rollNumber ?? null,
          firstName: payload.firstName,
          middleName: payload.middleName ?? null,
          lastName: payload.lastName,
          gender: payload.gender || 'Other',
          dateOfBirth: payload.dateOfBirth || new Date().toISOString().substring(0, 10),
          religion: payload.religion ?? null,
          nationality: payload.nationality ?? null,
          motherTongue: payload.motherTongue ?? null,
          mobileNumber: payload.mobile ?? primary?.mobile ?? '0000000000',
          email: payload.email ?? primary?.email ?? null,
          parentFirstName: primary?.firstName ?? 'Guardian',
          parentMiddleName: null,
          parentLastName: primary?.lastName ?? 'NA',
          parentMobileNumber: primary?.mobile ?? '0000000000',
          parentEmail: primary?.email ?? null,
          parentOccupation: primary?.occupation ?? null,
          parentOrganizationName: primary?.organization ?? null,
          parentQualification: primary?.qualification ?? null,
          annualIncome: primary?.annualIncome ? Number(primary.annualIncome) : null,
          academicYearId,
          classId: payload.classId,
          sectionId: payload.sectionId ?? null,
          bloodGroup: payload.bloodGroup ?? null,
          allergies: payload.allergies ?? null,
          medicalConditions: payload.medicalConditions ?? null,
          medications: payload.medications ?? null,
          doctorName: payload.doctorName ?? null,
          doctorContact: payload.doctorContact ?? null,
          emergencyNotes: payload.emergencyNotes ?? null
        };
        return this.http.post<ApiEnvelope<unknown>>(this.studentsBase, body);
      }),
      map(() => void 0)
    );
  }

  updateStudentStatus(studentId: number, status: StudentStatus): Observable<void> {
    return this.http
      .patch<ApiEnvelope<unknown>>(`${this.studentsBase}/${studentId}/status`, { status })
      .pipe(map(() => void 0));
  }

  getActiveEnrollment(studentId: number): Observable<{ enrollmentId: number }> {
    return this.http
      .get<ApiEnvelope<{ enrollmentId: number }>>(`${this.studentsBase}/${studentId}/enrollment/active`)
      .pipe(map(r => r.data));
  }

  // ---------- Profile 360 ----------
  profile(studentId: number): Observable<StudentProfile360> {
    return this.http
      .get<ApiEnvelope<BackendProfileDto>>(`${this.studentsBase}/${studentId}/profile-360`)
      .pipe(map(r => this.mapProfile360(r.data)));
  }

  updatePersonal(studentId: number, payload: Partial<StudentPersonal>): Observable<StudentPersonal> {
    const parts = (payload.fullName ?? '').trim().split(/\s+/);
    const body = {
      firstName: payload.firstName ?? parts[0] ?? 'Student',
      middleName: payload.middleName ?? (parts.length > 2 ? parts.slice(1, -1).join(' ') : null),
      lastName: payload.lastName ?? parts[parts.length - 1] ?? 'NA',
      gender: payload.gender ?? 'Other',
      dateOfBirth: payload.dateOfBirth ?? new Date().toISOString().substring(0, 10),
      mobileNumber: payload.mobile ?? '0000000000',
      email: payload.email ?? null,
      admissionNumber: `ADM-${studentId}`,
      parentFirstName: 'Guardian',
      parentLastName: 'NA',
      parentMobileNumber: '0000000000',
      academicYearId: 1,
      classId: 1
    };
    return this.http
      .put<ApiEnvelope<BackendStudentDto>>(`${this.studentsBase}/${studentId}/personal`, body)
      .pipe(map(r => this.mapPersonalFromStudent(r.data, payload)));
  }

  updateMedical(studentId: number, payload: Partial<MedicalSnapshot>): Observable<void> {
    return this.http
      .put<ApiEnvelope<unknown>>(`${this.studentsBase}/${studentId}/medical`, payload)
      .pipe(map(() => void 0));
  }

  // ---------- Timeline ----------
  timeline(studentId: number): Observable<StudentTimelineEntry[]> {
    return this.http
      .get<ApiEnvelope<BackendTimelineDto[]>>(`${this.studentsBase}/${studentId}/timeline`)
      .pipe(map(r => (r.data ?? []).map(t => this.mapTimelineEntry(t))));
  }

  timelineMock(studentId: number): Observable<StudentTimelineEntry[]> {
    return this.timeline(studentId);
  }

  // ---------- Academic History ----------
  academicHistory(_studentId: number): Observable<AcademicHistoryRow[]> {
    return of([]);
  }

  // ---------- Student Documents ----------
  studentDocuments(studentId: number): Observable<StudentDocumentEntry[]> {
    return this.http
      .get<ApiEnvelope<Array<{ documentId?: number; documentName?: string; documentType?: string }>>>(
        `${this.studentsBase}/${studentId}/documents`
      )
      .pipe(
        map(r =>
          (r.data ?? []).map(doc => ({
            documentId: doc.documentId ?? null,
            studentId,
            documentName: doc.documentName ?? doc.documentType ?? 'Document',
            documentType: doc.documentType ?? 'OTHER',
            status: 'UPLOADED' as const,
            uploadedDate: null,
            category: 'PERSONAL'
          }))
        )
      );
  }

  downloadDocument(docId: number): Observable<Blob> {
    return this.http.get(`${this.studentsBase}/document/${docId}/download`, { responseType: 'blob' });
  }

  // ---------- Achievements (no backend yet) ----------
  achievements(_studentId: number): Observable<AchievementResponse[]> {
    return of([]);
  }

  addAchievement(_studentId: number, _req: AchievementRequest): Observable<AchievementResponse> {
    return of({ achievementId: 0, studentId: 0, category: '', title: '' });
  }

  // ---------- Alumni ----------
  alumni(filters?: AlumniFilters): Observable<AlumniResponse[]> {
    let params = new HttpParams();
    if (filters?.keyword) params = params.set('keyword', filters.keyword);
    return this.http
      .get<ApiEnvelope<BackendStudentDto[]>>(`${this.studentsBase}/alumni`, { params })
      .pipe(map(r => (r.data ?? []).map(dto => this.mapAlumni(dto))));
  }

  addAlumni(_req: AlumniRequest): Observable<AlumniResponse> {
    return of({ alumniId: 0, fullName: '' });
  }

  // ---------- Document Vault (aggregated from per-student docs) ----------
  documentKpi(): Observable<DocumentVaultKpi> {
    return this.documents().pipe(
      map(entries => ({
        totalDocuments: entries.length,
        verifiedDocuments: entries.filter(e => e.status === 'VERIFIED').length,
        pendingVerification: entries.filter(e => e.status === 'PENDING').length,
        missingDocuments: entries.filter(e => e.status === 'MISSING').length
      }))
    );
  }

  documents(category?: string): Observable<DocumentVaultEntry[]> {
    return this.search({ status: 'ACTIVE' }, 0, 50).pipe(
      switchMap(page => {
        const students = page.content;
        if (!students.length) return of([]);
        return forkJoin(
          students.map(s =>
            this.studentDocuments(s.studentId).pipe(
              map(docs =>
                docs.map(doc => ({
                  documentId: doc.documentId ?? 0,
                  studentId: s.studentId,
                  studentName: s.fullName,
                  documentType: doc.documentType,
                  fileName: doc.documentName,
                  fileUrl: null,
                  status: doc.status === 'UPLOADED' ? 'PENDING' as const : doc.status as DocumentVaultEntry['status'],
                  category: (doc.category ?? 'OTHER') as DocumentVaultEntry['category'],
                  uploadedOn: doc.uploadedDate ?? null,
                  expiresOn: null,
                  remarks: null
                }))
              )
            )
          )
        ).pipe(
          map(nested => {
            const flat = nested.flat();
            if (!category) return flat;
            return flat.filter(e => e.category === category);
          })
        );
      })
    );
  }

  addDocument(req: DocumentVaultRequest): Observable<DocumentVaultEntry> {
    const formData = new FormData();
    if (req.fileUrl) {
      formData.append('file', new Blob(['placeholder'], { type: 'application/octet-stream' }), req.fileName);
    }
    formData.append('documentType', req.documentType);
    return this.http
      .post<ApiEnvelope<{ documentId?: number; documentName?: string; documentType?: string }>>(
        this.documentsBase,
        formData,
        { params: new HttpParams().set('studentId', String(req.studentId)) }
      )
      .pipe(
        map(r => ({
          documentId: r.data?.documentId ?? 0,
          studentId: req.studentId,
          studentName: '',
          documentType: req.documentType,
          fileName: req.fileName,
          fileUrl: req.fileUrl ?? null,
          status: 'PENDING',
          category: req.category,
          uploadedOn: new Date().toISOString(),
          expiresOn: req.expiresOn ?? null,
          remarks: req.remarks ?? null
        }))
      );
  }

  verifyDocument(id: number): Observable<DocumentVaultEntry> {
    return this.documents().pipe(
      map(entries => {
        const entry = entries.find(e => e.documentId === id);
        if (!entry) throw new Error('Document not found');
        return { ...entry, status: 'VERIFIED' as const };
      })
    );
  }

  deleteDocument(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void>>(`${this.documentsBase}/${id}`)
      .pipe(map(() => void 0));
  }

  // ---------- Import / Export ----------
  downloadImportTemplate(): Observable<Blob> {
    return this.http.get(`${this.studentsBase}/import/template`, { responseType: 'blob' });
  }

  importStudents(file: File): Observable<StudentImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiEnvelope<{ jobId: string; summary?: BulkUploadSummary }>>(`${this.studentsBase}/import`, formData)
      .pipe(
        map(r => ({
          jobId: r.data?.jobId ?? '',
          total: r.data?.summary?.totalRecords ?? 0,
          success: r.data?.summary?.successCount ?? 0,
          failed: r.data?.summary?.failureCount ?? 0,
          errors: r.data?.summary?.errors ?? []
        }))
      );
  }

  downloadImportErrors(jobId: string): Observable<Blob> {
    return this.http.get(`${this.studentsBase}/import/${jobId}/errors`, { responseType: 'blob' });
  }

  // ---------- Promotion ----------
  listPromotions(): Observable<PromotionBatch[]> {
    return this.http
      .get<ApiEnvelope<SpringPage<PromotionBatch>>>(`${this.promotionsBase}?page=0&size=50&sort=id,desc`)
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
      .get<ApiEnvelope<BackendTransferDto[]>>(this.transfersBase)
      .pipe(map(r => (r.data ?? []).map(t => this.mapTransfer(t))));
  }

  createTransfer(payload: TransferRequest): Observable<TransferRequest> {
    const body = {
      studentId: payload.studentId,
      enrollmentId: payload.enrollmentId,
      reason: payload.reason,
      destinationSchool: payload.destinationSchool
    };
    return this.http
      .post<ApiEnvelope<BackendTransferDto>>(this.transfersBase, body)
      .pipe(map(r => this.mapTransfer(r.data)));
  }

  transitionTransfer(id: number, target: TransferStatus, remarks?: string): Observable<TransferRequest> {
    return this.http
      .patch<ApiEnvelope<BackendTransferDto>>(`${this.transfersBase}/${id}/status`, { status: target, remarks })
      .pipe(map(r => this.mapTransfer(r.data)));
  }

  // ---------- Mappers ----------
  private mapPage<T, R>(page: SpringPage<T> | null | undefined, mapper: (item: T) => R): PageEnvelope<R> {
    return {
      content: (page?.content ?? []).map(mapper),
      totalElements: page?.totalElements ?? 0,
      totalPages: page?.totalPages ?? 0,
      pageNumber: page?.number ?? 0,
      pageSize: page?.size ?? 20
    };
  }

  private mapDirectoryCard(dto: BackendStudentDto): StudentDirectoryCard {
    return {
      studentId: dto.studentId,
      admissionNumber: dto.admissionNumber ?? '',
      studentCode: dto.studentCode,
      fullName: dto.fullName ?? 'Unknown',
      className: dto.className,
      sectionName: dto.sectionName,
      mobile: dto.mobileNumber,
      email: dto.email,
      status: (dto.status as StudentStatus) ?? 'ACTIVE',
      active: dto.status === 'ACTIVE',
      attendanceStatus: 'PENDING',
      guardianName: dto.parentName,
      guardianMobile: dto.parentMobileNumber?.toString() ?? null
    };
  }

  private mapProfile360(raw: BackendProfileDto): StudentProfile360 {
    const s = raw.student;
    const en = raw.enrollment;
    const p = raw.parent;
    const med = raw.medical ?? {};

    return {
      overview: {
        studentId: s.studentId,
        admissionNumber: s.admissionNumber ?? '',
        studentCode: s.studentCode,
        rollNumber: en?.rollNumber,
        fullName: s.fullName ?? '',
        className: en?.className ?? s.className,
        sectionName: en?.sectionName ?? s.sectionName,
        mobile: s.mobileNumber,
        email: s.email,
        status: (s.status as StudentStatus) ?? 'ACTIVE',
        active: s.status === 'ACTIVE',
        academicYear: en?.academicYear,
        enrollmentStatus: en?.status,
        bloodGroup: med.bloodGroup
      },
      personal: {
        fullName: s.fullName ?? '',
        mobile: s.mobileNumber,
        email: s.email,
        bloodGroup: med.bloodGroup,
        ...med
      },
      family: {
        primary: p
          ? {
              name: p.fullName ?? '',
              mobile: p.mobileNumber,
              email: p.email,
              occupation: p.occupation,
              relation: 'Parent'
            }
          : null,
        guardians: p
          ? [{
              name: p.fullName ?? '',
              mobile: p.mobileNumber,
              email: p.email,
              occupation: p.occupation,
              relation: 'Parent'
            }]
          : [],
        siblings: []
      },
      academics: {
        currentClass: en?.className ?? s.className,
        currentSection: en?.sectionName ?? s.sectionName,
        rollNumber: en?.rollNumber,
        academicYear: en?.academicYear,
        enrollmentStatus: en?.status,
        courseCount: 0,
        subjectCount: 0
      },
      attendance: { totalWorkingDays: 0, present: 0, absent: 0, late: 0, percent: 0 },
      fees: { totalFee: 0, paid: 0, pending: 0, status: 'N/A' },
      medical: med
    };
  }

  private mapPersonalFromStudent(dto: BackendStudentDto, payload: Partial<StudentPersonal>): StudentPersonal {
    return {
      fullName: dto.fullName ?? payload.fullName ?? '',
      mobile: dto.mobileNumber ?? payload.mobile,
      email: dto.email ?? payload.email,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth,
      nationality: payload.nationality,
      religion: payload.religion,
      bloodGroup: payload.bloodGroup,
      motherTongue: payload.motherTongue,
      remarks: payload.remarks
    };
  }

  private mapTimelineEntry(dto: BackendTimelineDto): StudentTimelineEntry {
    const eventType = dto.eventType ?? '';
    return {
      action: dto.title ?? eventType.replace(/_/g, ' ') ?? 'Event',
      description: dto.description ?? '',
      performedBy: dto.createdBy ?? 'System',
      performedAt: dto.createdDate ?? new Date().toISOString(),
      icon: this.timelineIcon(eventType),
      tone: eventType.includes('CREATED') || eventType.includes('ENROLL') ? 'success' : 'info'
    };
  }

  private timelineIcon(eventType: string): string {
    if (eventType.includes('CREATED')) return 'pi pi-user-plus';
    if (eventType.includes('DOCUMENT')) return 'pi pi-file';
    if (eventType.includes('ENROLL') || eventType.includes('ACADEMIC')) return 'pi pi-book';
    if (eventType.includes('ALUMNI')) return 'pi pi-graduation-cap';
    return 'pi pi-pencil';
  }

  private mapAlumni(dto: BackendStudentDto): AlumniResponse {
    return {
      alumniId: dto.studentId,
      studentId: dto.studentId,
      fullName: dto.fullName ?? '',
      course: dto.className,
      contact: dto.mobileNumber,
      email: dto.email
    };
  }

  private mapTransfer(dto: BackendTransferDto): TransferRequest {
    return {
      id: dto.id,
      requestNumber: dto.requestNumber,
      transferNumber: dto.requestNumber,
      studentId: dto.studentId,
      enrollmentId: dto.enrollmentId,
      reason: dto.reason,
      destinationSchool: dto.destinationSchool,
      status: dto.status as TransferStatus,
      requestedOn: dto.requestedOn,
      certificateNumber: dto.certificateNumber
    };
  }

  private resolveAcademicYearId(academicYear?: string | null): Observable<number> {
    if (this.academicYearCache.length) {
      const match = this.academicYearCache.find(y => y.label === academicYear);
      if (match) return of(match.id);
      return of(this.academicYearCache[0].id);
    }
    return this.listAcademicYears().pipe(
      map(years => {
        this.academicYearCache = years;
        const match = years.find(y => y.label === academicYear);
        return match?.id ?? years[0]?.id ?? 1;
      })
    );
  }
}
