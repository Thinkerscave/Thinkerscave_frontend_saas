import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AcademicHistoryRow,
  AchievementRequest,
  AchievementResponse,
  ClassOption,
  DocumentVaultEntry,
  DocumentVaultKpi,
  DocumentVaultRequest,
  GuardianInfo,
  MedicalSnapshot,
  SectionOption,
  StudentCreateRequest,
  StudentDirectoryCard,
  StudentDocumentEntry,
  StudentKpi,
  StudentPersonal,
  StudentProfile360,
  ParentInfo,
  StudentSearchRequest,
  StudentStatus,
  StudentTimelineEntry,
  StudentWizardRequest
} from '../models/students-workspace.model';
import { resolveStudentPhotoUrl } from '../../../shared/utils/profile-assets';

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
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  ageYears?: number | null;
  religion?: string | null;
  nationality?: string | null;
  motherTongue?: string | null;
  category?: string | null;
  socialCategory?: string | null;
  placeOfBirth?: string | null;
  identityDocumentType?: string | null;
  identityDocumentNumber?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  status?: string | null;
  academicYear?: string | null;
  className?: string | null;
  sectionName?: string | null;
  parentName?: string | null;
  parentMobileNumber?: string | null;
  photoUrl?: string | null;
  rollNumber?: string | null;
  admissionDate?: string | null;
  remarks?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  currentAddressLine1?: string | null;
  currentAddressLine2?: string | null;
  currentLandmark?: string | null;
  currentCity?: string | null;
  currentDistrict?: string | null;
  currentState?: string | null;
  currentCountry?: string | null;
  currentPostalCode?: string | null;
  sameAddress?: boolean | null;
  permanentAddressLine1?: string | null;
  permanentAddressLine2?: string | null;
  permanentLandmark?: string | null;
  permanentCity?: string | null;
  permanentDistrict?: string | null;
  permanentState?: string | null;
  permanentCountry?: string | null;
  permanentPostalCode?: string | null;
}

interface BackendParentDto {
  parentId?: number;
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  occupation?: string;
  organizationName?: string;
  qualification?: string;
  relationship?: string;
  primaryContact?: boolean;
  receiveSms?: boolean;
  receiveEmail?: boolean;
  pickupAuthorized?: boolean;
}

interface BackendProfileDto {
  student: BackendStudentDto;
  parent?: BackendParentDto;
  parents?: BackendParentDto[];
  enrollment?: {
    enrollmentId?: number;
    academicYearId?: number;
    classId?: number;
    sectionId?: number;
    academicYear?: string;
    className?: string;
    sectionName?: string;
    rollNumber?: string;
    status?: string;
    enrollmentDate?: string;
  };
  medical?: MedicalSnapshot;
  previousSchooling?: {
    hasPreviousSchooling?: boolean;
    schoolName?: string;
    board?: string;
    className?: string;
    academicYear?: string;
    percentage?: string;
    tcNumber?: string;
    tcDate?: string;
  };
  photoDocumentId?: number;
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

export interface StudentImportPreview {
  total: number;
  valid: number;
  failed: number;
  errors: string[];
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
      unassignedStudents: this.search({ assigned: false }, 0, 1).pipe(map(page => page.totalElements))
    }).pipe(
      map(({ totalStudents, activeStudents, inactiveStudents, unassignedStudents }) => ({
        totalStudents,
        activeStudents,
        inactiveStudents,
        unassignedStudents
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
    if (filter.academicYearId) params = params.set('academicYearId', filter.academicYearId);
    if (filter.classId) params = params.set('classId', filter.classId);
    if (filter.sectionId) params = params.set('sectionId', filter.sectionId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.assigned != null) params = params.set('assigned', String(filter.assigned));
    if (filter.rollNumber) params = params.set('rollNumber', filter.rollNumber);
    if (filter.parentName) params = params.set('parentName', filter.parentName);
    if (filter.parentMobile) params = params.set('parentMobile', filter.parentMobile);

    return this.http
      .get<ApiEnvelope<SpringPage<BackendStudentDto>>>(this.studentsBase, { params })
      .pipe(map(r => this.mapPage(r.data, dto => this.mapDirectoryCard(dto))));
  }

  exportStudents(filter: StudentSearchRequest): Observable<Blob> {
    let params = new HttpParams();
    if (filter.keyword) params = params.set('keyword', filter.keyword);
    if (filter.academicYearId) params = params.set('academicYearId', filter.academicYearId);
    if (filter.classId) params = params.set('classId', filter.classId);
    if (filter.sectionId) params = params.set('sectionId', filter.sectionId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.assigned != null) params = params.set('assigned', String(filter.assigned));
    if (filter.rollNumber) params = params.set('rollNumber', filter.rollNumber);
    if (filter.parentName) params = params.set('parentName', filter.parentName);
    if (filter.parentMobile) params = params.set('parentMobile', filter.parentMobile);
    return this.http.get(`${this.studentsBase}/export`, { params, responseType: 'blob' });
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

  updateEnrollment(studentId: number, enrollment: {
    academicYearId: number;
    classId: number;
    sectionId?: number | null;
    rollNumber?: string | null;
  }): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(`${this.studentsBase}/${studentId}/enrollment`, enrollment)
      .pipe(map(() => void 0));
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

  createStudentWizard(payload: StudentWizardRequest, photo?: File | null): Observable<number> {
    const primary = payload.parents?.[0];
    const body: Record<string, unknown> = {
      admissionNumber: payload.admissionNumber?.trim() || null,
      rollNumber: payload.rollNumber ?? null,
      firstName: payload.firstName,
      middleName: payload.middleName ?? null,
      lastName: payload.lastName,
      gender: payload.gender || 'OTHER',
      dateOfBirth: payload.dateOfBirth || new Date().toISOString().substring(0, 10),
      nationality: payload.nationality ?? null,
      motherTongue: payload.motherTongue ?? null,
      socialCategory: payload.socialCategory ?? null,
      identityDocumentType: payload.identityDocumentType ?? null,
      identityDocumentNumber: payload.identityDocumentNumber ?? null,
      mobileNumber: payload.mobile ?? null,
      email: payload.email ?? null,
      parentRelationship: primary?.relationship ?? 'FATHER',
      parentFirstName: primary?.firstName ?? 'Guardian',
      parentMiddleName: null,
      parentLastName: primary?.lastName || 'NA',
      parentMobileNumber: primary?.mobile ?? '',
      parentEmail: primary?.email ?? null,
      parentOccupation: primary?.occupation ?? null,
      parentOrganizationName: primary?.organization ?? null,
      parentQualification: primary?.qualification ?? null,
      annualIncome: primary?.annualIncome ? Number(primary.annualIncome) : null,
      parents: (payload.parents ?? []).map((parent, index) => ({
        existingParentId: parent.existingParentId ?? null,
        relationship: parent.relationship || 'GUARDIAN',
        firstName: parent.firstName,
        middleName: parent.middleName ?? null,
        lastName: parent.lastName || 'NA',
        mobileNumber: parent.mobile,
        email: parent.email ?? null,
        occupation: parent.occupation ?? null,
        organizationName: parent.organization ?? null,
        qualification: parent.qualification ?? null,
        annualIncome: parent.annualIncome ? Number(parent.annualIncome) : null,
        primaryContact: index === 0 || Boolean(parent.isPrimaryContact),
        receiveSms: parent.receiveSms ?? true,
        receiveEmail: parent.receiveEmail ?? true,
        pickupAuthorized: parent.isPickupAuthorized ?? false
      })),
      academicYearId: payload.academicYearId ?? null,
      classId: payload.classId ?? null,
      sectionId: payload.sectionId ?? null,
      enrollmentDate: payload.enrollmentDate ?? null,
      enrollmentStatus: payload.enrollmentStatus ?? 'ACTIVE',
      sameAddress: payload.sameAsCurrentAddress ?? false,
      currentAddressLine1: payload.currentAddressLine1 ?? null,
      currentAddressLine2: payload.currentAddressLine2 ?? null,
      currentLandmark: payload.currentLandmark ?? null,
      currentCity: payload.currentCity ?? null,
      currentDistrict: payload.currentDistrict ?? null,
      currentState: payload.currentState ?? null,
      currentPostalCode: payload.currentPincode ?? null,
      permanentAddressLine1: payload.permanentAddressLine1 ?? null,
      permanentAddressLine2: payload.permanentAddressLine2 ?? null,
      permanentLandmark: payload.permanentLandmark ?? null,
      permanentCity: payload.permanentCity ?? null,
      permanentDistrict: payload.permanentDistrict ?? null,
      permanentState: payload.permanentState ?? null,
      permanentPostalCode: payload.permanentPincode ?? null,
      bloodGroup: payload.bloodGroup ?? null
    };
    const formData = new FormData();
    formData.append('studentData', new Blob([JSON.stringify(body)], { type: 'application/json' }));
    if (photo) formData.append('photo', photo, photo.name);
    return this.http
      .post<ApiEnvelope<BackendStudentDto>>(`${this.studentsBase}/registerStudent`, formData)
      .pipe(map(response => response.data.studentId));
  }

  updateStudentWizard(studentId: number, payload: StudentWizardRequest): Observable<void> {
    const body = {
      admissionNumber: payload.admissionNumber?.trim() || null,
      rollNumber: payload.rollNumber ?? null,
      firstName: payload.firstName,
      middleName: payload.middleName ?? null,
      lastName: payload.lastName,
      gender: payload.gender || 'OTHER',
      dateOfBirth: payload.dateOfBirth,
      religion: payload.religion ?? null,
      nationality: payload.nationality ?? null,
      motherTongue: payload.motherTongue ?? null,
      socialCategory: payload.socialCategory ?? null,
      placeOfBirth: payload.placeOfBirth ?? null,
      identityDocumentType: payload.identityDocumentType ?? null,
      identityDocumentNumber: payload.identityDocumentNumber ?? null,
      mobileNumber: payload.mobile ?? null,
      email: payload.email ?? null,
      remarks: payload.remarks ?? null,
      emergencyContactName: payload.emergencyContactName ?? null,
      emergencyContactPhone: payload.emergencyContactPhone ?? null,
      emergencyContactRelation: payload.emergencyContactRelation ?? null,
      sameAddress: payload.sameAsCurrentAddress ?? false,
      currentAddressLine1: payload.currentAddressLine1 ?? null,
      currentAddressLine2: payload.currentAddressLine2 ?? null,
      currentLandmark: payload.currentLandmark ?? null,
      currentCity: payload.currentCity ?? null,
      currentDistrict: payload.currentDistrict ?? null,
      currentState: payload.currentState ?? null,
      currentCountry: payload.currentCountry ?? null,
      currentPostalCode: payload.currentPincode ?? null,
      permanentAddressLine1: payload.permanentAddressLine1 ?? null,
      permanentAddressLine2: payload.permanentAddressLine2 ?? null,
      permanentLandmark: payload.permanentLandmark ?? null,
      permanentCity: payload.permanentCity ?? null,
      permanentDistrict: payload.permanentDistrict ?? null,
      permanentState: payload.permanentState ?? null,
      permanentCountry: payload.permanentCountry ?? null,
      permanentPostalCode: payload.permanentPincode ?? null
    };
    return this.http
      .put<ApiEnvelope<unknown>>(`${this.studentsBase}/${studentId}`, body)
      .pipe(map(() => void 0));
  }

  updateStudentStatus(studentId: number, status: StudentStatus): Observable<void> {
    return this.http
      .patch<ApiEnvelope<unknown>>(`${this.studentsBase}/${studentId}/status`, { status })
      .pipe(map(() => void 0));
  }

  addParent(studentId: number, parent: ParentInfo): Observable<GuardianInfo> {
    return this.http
      .post<ApiEnvelope<BackendParentDto>>(`${this.studentsBase}/${studentId}/parents`, this.parentRequest(parent))
      .pipe(map(response => this.mapGuardian(response.data)));
  }

  updateParent(studentId: number, parentId: number, parent: ParentInfo): Observable<GuardianInfo> {
    return this.http
      .put<ApiEnvelope<BackendParentDto>>(`${this.studentsBase}/${studentId}/parents/${parentId}`, this.parentRequest(parent))
      .pipe(map(response => this.mapGuardian(response.data)));
  }

  removeParent(studentId: number, parentId: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void>>(`${this.studentsBase}/${studentId}/parents/${parentId}`)
      .pipe(map(() => void 0));
  }

  private parentRequest(parent: ParentInfo): Record<string, unknown> {
    return {
      existingParentId: parent.existingParentId ?? null,
      relationship: parent.relationship,
      firstName: parent.firstName,
      middleName: parent.middleName ?? null,
      lastName: parent.lastName || null,
      mobileNumber: parent.mobile,
      email: parent.email ?? null,
      occupation: parent.occupation ?? null,
      organizationName: parent.organization ?? null,
      qualification: parent.qualification ?? null,
      annualIncome: parent.annualIncome ? Number(parent.annualIncome) : null,
      primaryContact: Boolean(parent.isPrimaryContact),
      receiveSms: parent.receiveSms ?? true,
      receiveEmail: parent.receiveEmail ?? true,
      pickupAuthorized: parent.isPickupAuthorized ?? false
    };
  }

  private mapGuardian(parent: BackendParentDto): GuardianInfo {
    return {
      guardianId: parent.parentId ?? null,
      name: parent.fullName ?? '',
      mobile: parent.mobileNumber,
      email: parent.email,
      occupation: parent.occupation,
      organization: parent.organizationName,
      qualification: parent.qualification,
      relation: parent.relationship,
      isPrimaryContact: parent.primaryContact,
      isPickupAuthorized: parent.pickupAuthorized
    };
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
    const body = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth,
      mobile: payload.mobile,
      email: payload.email,
      currentAddressLine1: payload.currentAddressLine1,
      currentAddressLine2: payload.currentAddressLine2,
      currentLandmark: payload.currentLandmark,
      currentCity: payload.currentCity,
      currentDistrict: payload.currentDistrict,
      currentState: payload.currentState,
      currentCountry: payload.currentCountry,
      currentPostalCode: payload.currentPincode,
      sameAddress: payload.sameAddress,
      permanentAddressLine1: payload.permanentAddressLine1,
      permanentAddressLine2: payload.permanentAddressLine2,
      permanentLandmark: payload.permanentLandmark,
      permanentCity: payload.permanentCity,
      permanentDistrict: payload.permanentDistrict,
      permanentState: payload.permanentState,
      permanentCountry: payload.permanentCountry,
      permanentPostalCode: payload.permanentPincode
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
  academicHistory(studentId: number): Observable<AcademicHistoryRow[]> {
    return forkJoin({
      enrollments: this.http.get<ApiEnvelope<Array<{
        academicYear?: string;
        className?: string;
        sectionName?: string;
        rollNumber?: string;
        status?: string;
        enrollmentDate?: string;
      }>>>(`${this.studentsBase}/${studentId}/enrollment`),
      profile: this.http.get<ApiEnvelope<BackendProfileDto>>(`${this.studentsBase}/${studentId}/profile-360`)
    }).pipe(
      map(({ enrollments, profile }) => {
        const rows: AcademicHistoryRow[] = (enrollments.data ?? []).map(row => ({
          academicYear: row.academicYear || '—',
          className: row.className || '—',
          sectionName: row.sectionName || '—',
          rollNumber: row.rollNumber ?? null,
          result: row.status === 'ACTIVE' ? 'Current' : (row.status ?? null),
          remarks: row.enrollmentDate ? `Enrolled ${row.enrollmentDate}` : null
        }));
        const prev = profile.data?.previousSchooling;
        if (prev && (prev.hasPreviousSchooling || prev.schoolName)) {
          rows.push({
            academicYear: prev.academicYear || 'Previous',
            className: prev.className || '—',
            sectionName: prev.board || '—',
            rollNumber: null,
            result: 'Previous school',
            remarks: [prev.schoolName, prev.percentage ? `${prev.percentage}%` : null, prev.tcNumber ? `TC ${prev.tcNumber}` : null]
              .filter(Boolean)
              .join(' · ') || null
          });
        }
        return rows;
      })
    );
  }

  // ---------- Student Documents ----------
  studentDocuments(studentId: number): Observable<StudentDocumentEntry[]> {
    return this.http
      .get<ApiEnvelope<Array<{
        documentId?: number;
        documentName?: string;
        documentType?: string;
        fileName?: string;
        fileExtension?: string;
        mimeType?: string;
        fileSize?: number;
        uploadedOn?: string;
        displayLabel?: string;
        remarks?: string;
        status?: string;
      }>>>(`${this.studentsBase}/${studentId}/documents`)
      .pipe(
        map(r => {
          let otherIndex = 0;
          return (r.data ?? []).map(doc => {
            const rawStatus = (doc.status ?? 'PENDING').toUpperCase();
            const status =
              rawStatus === 'VERIFIED' ? 'VERIFIED' as const
              : rawStatus === 'REJECTED' ? 'REJECTED' as const
              : rawStatus === 'PENDING' ? 'PENDING' as const
              : 'UPLOADED' as const;
            let label = (doc.displayLabel || doc.remarks || '').trim();
            const type = (doc.documentType ?? 'OTHER').toUpperCase();
            if (!label && type === 'OTHER') {
              otherIndex += 1;
              label = `Additional document ${otherIndex}`;
            }
            return {
              documentId: doc.documentId ?? null,
              studentId,
              documentName: doc.documentName ?? 'Document',
              fileName: doc.fileName ?? doc.documentName ?? 'Document',
              fileExtension: doc.fileExtension ?? null,
              mimeType: doc.mimeType ?? null,
              fileSize: doc.fileSize ?? null,
              documentType: doc.documentType ?? 'OTHER',
              displayLabel: label || this.formatDocumentType(doc.documentType),
              remarks: doc.remarks ?? null,
              status,
              uploadedDate: doc.uploadedOn ?? null,
              category: 'PERSONAL'
            };
          });
        })
      );
  }

  downloadDocument(docId: number): Observable<Blob> {
    return this.http.get(`${this.studentsBase}/document/${docId}/download`, { responseType: 'blob' });
  }

  uploadStudentDocument(
    studentId: number,
    file: File,
    documentType: string,
    documentName?: string,
    remarks?: string
  ): Observable<StudentDocumentEntry> {
    const form = new FormData();
    form.append('file', file, file.name);
    let params = new HttpParams()
      .set('studentId', String(studentId))
      .set('documentType', documentType);
    if (documentName?.trim()) params = params.set('documentName', documentName.trim());
    if (remarks?.trim()) params = params.set('remarks', remarks.trim());
    return this.http
      .post<ApiEnvelope<{
        documentId?: number; documentName?: string; documentType?: string; fileName?: string;
        fileExtension?: string; mimeType?: string; fileSize?: number; status?: string; remarks?: string;
      }>>(`${this.documentsBase}`, form, { params })
      .pipe(map(response => ({
        documentId: response.data.documentId ?? null,
        studentId,
        documentName: response.data.documentName ?? documentName ?? file.name,
        fileName: response.data.fileName ?? file.name,
        fileExtension: response.data.fileExtension ?? null,
        mimeType: response.data.mimeType ?? file.type,
        fileSize: response.data.fileSize ?? file.size,
        documentType: response.data.documentType ?? documentType,
        displayLabel: response.data.documentName ?? documentName ?? this.formatDocumentType(documentType),
        remarks: response.data.remarks ?? remarks ?? null,
        status: (response.data.status ?? 'PENDING') as StudentDocumentEntry['status'],
        uploadedDate: null,
        category: 'PERSONAL'
      })));
  }

  replaceStudentDocument(
    studentId: number,
    documentId: number,
    file: File,
    documentName?: string,
    remarks?: string
  ): Observable<StudentDocumentEntry> {
    const form = new FormData();
    form.append('file', file, file.name);
    let params = new HttpParams().set('studentId', String(studentId));
    if (documentName?.trim()) params = params.set('documentName', documentName.trim());
    if (remarks?.trim()) params = params.set('remarks', remarks.trim());
    return this.http
      .put<ApiEnvelope<{
        documentId?: number; documentName?: string; documentType?: string; fileName?: string;
        fileExtension?: string; mimeType?: string; fileSize?: number; status?: string; remarks?: string;
      }>>(`${this.documentsBase}/${documentId}`, form, { params })
      .pipe(map(response => ({
        documentId: response.data.documentId ?? null,
        studentId,
        documentName: response.data.documentName ?? documentName ?? file.name,
        fileName: response.data.fileName ?? file.name,
        fileExtension: response.data.fileExtension ?? null,
        mimeType: response.data.mimeType ?? file.type,
        fileSize: response.data.fileSize ?? file.size,
        documentType: response.data.documentType ?? 'OTHER',
        displayLabel: response.data.documentName ?? documentName ?? this.formatDocumentType(response.data.documentType),
        remarks: response.data.remarks ?? remarks ?? null,
        status: (response.data.status ?? 'PENDING') as StudentDocumentEntry['status'],
        uploadedDate: null,
        category: 'PERSONAL'
      })));
  }

  // ---------- Achievements (no backend yet) ----------
  achievements(_studentId: number): Observable<AchievementResponse[]> {
    return of([]);
  }

  addAchievement(_studentId: number, _req: AchievementRequest): Observable<AchievementResponse> {
    return of({ achievementId: 0, studentId: 0, category: '', title: '' });
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

  addDocument(req: DocumentVaultRequest, file?: File): Observable<DocumentVaultEntry> {
    if (!file) return throwError(() => new Error('A real document file is required.'));
    return this.uploadStudentDocument(req.studentId, file, req.documentType, req.fileName, req.remarks ?? undefined)
      .pipe(map(document => ({
        documentId: document.documentId ?? 0,
        studentId: req.studentId,
        studentName: '',
        documentType: document.documentType,
        fileName: document.fileName ?? file.name,
        fileUrl: null,
        status: document.status === 'UPLOADED' ? 'PENDING' : document.status as DocumentVaultEntry['status'],
        category: req.category,
        uploadedOn: document.uploadedDate ?? new Date().toISOString(),
        expiresOn: req.expiresOn ?? null,
        remarks: document.remarks ?? req.remarks ?? null
      })));
  }

  verifyDocument(id: number): Observable<DocumentVaultEntry> {
    const params = new HttpParams().set('status', 'VERIFIED');
    return this.http
      .post<ApiEnvelope<{ documentId: number; documentName: string; documentType: string; remarks?: string }>>(
        `${this.documentsBase}/${id}/verify`, {}, { params })
      .pipe(map(response => ({
        documentId: id,
        studentId: 0,
        studentName: '',
        documentType: response.data.documentType,
        fileName: response.data.documentName,
        status: 'VERIFIED',
        category: 'OTHER',
        remarks: response.data.remarks ?? null
      })));
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

  previewStudentImport(file: File): Observable<StudentImportPreview> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiEnvelope<BulkUploadSummary>>(`${this.studentsBase}/import/preview`, formData)
      .pipe(map(response => ({
        total: response.data?.totalRecords ?? 0,
        valid: response.data?.successCount ?? 0,
        failed: response.data?.failureCount ?? 0,
        errors: response.data?.errors ?? []
      })));
  }

  downloadImportErrors(jobId: string): Observable<Blob> {
    return this.http.get(`${this.studentsBase}/import/${jobId}/errors`, { responseType: 'blob' });
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
      guardianMobile: dto.parentMobileNumber?.toString() ?? null,
      photoUrl: resolveStudentPhotoUrl(dto.studentId, dto.photoUrl)
    };
  }

  private mapProfile360(raw: BackendProfileDto): StudentProfile360 {
    const s = raw.student;
    const en = raw.enrollment;
    const med = raw.medical ?? {};
    const parents = (raw.parents?.length ? raw.parents : (raw.parent ? [raw.parent] : []))
      .map(p => ({ ...this.mapGuardian(p), relation: this.formatRelation(p.relationship) }));
    const primary = parents.find(g => g.isPrimaryContact) ?? parents[0] ?? null;
    const rollNumber = en?.rollNumber || s.rollNumber || null;
    const ageYears = s.ageYears ?? this.ageFromDob(s.dateOfBirth);

    const personal = {
      fullName: s.fullName ?? '',
      firstName: s.firstName,
      middleName: s.middleName,
      lastName: s.lastName,
      gender: this.formatGender(s.gender),
      dateOfBirth: this.formatDateOnly(s.dateOfBirth),
      ageYears,
      nationality: s.nationality,
      religion: s.religion,
      motherTongue: s.motherTongue,
      socialCategory: s.socialCategory ?? s.category,
      placeOfBirth: s.placeOfBirth,
      identityDocumentType: s.identityDocumentType,
      identityDocumentNumber: s.identityDocumentNumber,
      mobile: s.mobileNumber,
      email: s.email,
      bloodGroup: med.bloodGroup,
      currentAddressLine1: s.currentAddressLine1,
      currentAddressLine2: s.currentAddressLine2,
      currentLandmark: s.currentLandmark,
      currentCity: s.currentCity,
      currentDistrict: s.currentDistrict,
      currentState: s.currentState,
      currentCountry: s.currentCountry,
      currentPincode: s.currentPostalCode,
      sameAddress: s.sameAddress,
      permanentAddressLine1: s.permanentAddressLine1,
      permanentAddressLine2: s.permanentAddressLine2,
      permanentLandmark: s.permanentLandmark,
      permanentCity: s.permanentCity,
      permanentDistrict: s.permanentDistrict,
      permanentState: s.permanentState,
      permanentCountry: s.permanentCountry,
      permanentPincode: s.permanentPostalCode,
      remarks: s.remarks,
      ...med,
      emergencyContactName: s.emergencyContactName,
      emergencyContactPhone: s.emergencyContactPhone,
      emergencyContactRelation: s.emergencyContactRelation
    };

    const prev = raw.previousSchooling;

    return {
      overview: {
        studentId: s.studentId,
        admissionNumber: s.admissionNumber ?? '',
        studentCode: s.studentCode,
        rollNumber,
        fullName: s.fullName ?? '',
        className: en?.className ?? s.className,
        sectionName: en?.sectionName ?? s.sectionName,
        gender: this.formatGender(s.gender),
        dateOfBirth: this.formatDateOnly(s.dateOfBirth),
        ageYears,
        mobile: s.mobileNumber,
        email: s.email,
        status: (s.status as StudentStatus) ?? 'ACTIVE',
        active: s.status === 'ACTIVE',
        academicYear: en?.academicYear,
        admissionDate: this.formatDateOnly(s.admissionDate),
        enrollmentDate: this.formatDateOnly(en?.enrollmentDate),
        enrollmentStatus: en?.status,
        bloodGroup: med.bloodGroup,
        motherTongue: s.motherTongue,
        nationality: s.nationality,
        religion: s.religion,
        photoUrl: null,
        photoDocumentId: raw.photoDocumentId ?? null,
        profileCompletion: this.computeProfileCompletion(personal, parents.length > 0, !!en)
      },
      personal,
      family: {
        primary,
        guardians: parents,
        siblings: []
      },
      academics: {
        academicYearId: en?.academicYearId ?? null,
        classId: en?.classId ?? null,
        sectionId: en?.sectionId ?? null,
        currentClass: en?.className ?? s.className,
        currentSection: en?.sectionName ?? s.sectionName,
        rollNumber,
        academicYear: en?.academicYear,
        admissionDate: this.formatDateOnly(s.admissionDate),
        enrollmentDate: this.formatDateOnly(en?.enrollmentDate),
        enrollmentStatus: en?.status,
        courseCount: 0,
        subjectCount: 0,
        previousSchoolName: prev?.schoolName ?? null,
        previousBoard: prev?.board ?? null,
        previousClass: prev?.className ?? null,
        previousAcademicYear: prev?.academicYear ?? null,
        previousPercentage: prev?.percentage ?? null,
        previousTcNumber: prev?.tcNumber ?? null
      },
      attendance: { totalWorkingDays: 0, present: 0, absent: 0, late: 0, percent: 0 },
      medical: {
        ...med,
        emergencyContactName: s.emergencyContactName,
        emergencyContactPhone: s.emergencyContactPhone,
        emergencyContactRelation: s.emergencyContactRelation,
        emergencyContact: s.emergencyContactName
          ? [s.emergencyContactName, s.emergencyContactRelation, s.emergencyContactPhone]
              .filter(Boolean)
              .join(' · ')
          : null
      }
    };
  }

  private formatGender(gender?: string | null): string | null {
    if (!gender?.trim()) return null;
    return gender.trim()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private formatDateOnly(value?: string | null): string | null {
    if (!value?.trim()) return null;
    return value.trim().substring(0, 10);
  }

  private formatRelation(relationship?: string | null): string {
    if (!relationship) return 'Parent';
    return relationship
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private formatDocumentType(documentType?: string | null): string {
    if (!documentType) return 'Document';
    if (documentType.toUpperCase() === 'OTHER') return 'Additional document';
    return documentType
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private ageFromDob(dateOfBirth?: string | null): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age >= 0 ? age : null;
  }

  private computeProfileCompletion(
    personal: StudentPersonal,
    hasFamily: boolean,
    hasEnrollment: boolean
  ): number {
    const checks = [
      !!personal.fullName,
      !!personal.gender,
      !!personal.dateOfBirth,
      !!personal.mobile,
      !!personal.email,
      !!personal.religion || !!personal.nationality || !!personal.motherTongue,
      !!personal.currentAddressLine1 || !!personal.currentCity,
      hasFamily,
      hasEnrollment
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }

  private mapPersonalFromStudent(dto: BackendStudentDto, payload: Partial<StudentPersonal>): StudentPersonal {
    return {
      ...payload,
      fullName: dto.fullName ?? payload.fullName ?? '',
      mobile: dto.mobileNumber ?? payload.mobile,
      email: dto.email ?? payload.email,
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
