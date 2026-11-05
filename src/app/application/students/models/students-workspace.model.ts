/**
 * Spec-aligned students workspace types.
 * Mirror of backend DTOs returned by `/api/v1/students/workspace/*`.
 */

export interface StudentKpi {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  unassignedStudents: number;
}

export interface StudentSearchRequest {
  keyword?: string | null;
  classId?: string | null;
  sectionId?: string | null;
  status?: StudentStatus | null;
  academicYearId?: string | null;
  assigned?: boolean | null;
  rollNumber?: string | null;
  parentName?: string | null;
  parentMobile?: string | null;
}

export interface StudentCreateRequest {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  mobileNumber: string;
  gender?: string | null;
  age?: string | null;
  remarks?: string | null;
  rollNumber?: string | null;
  dateOfBirth?: string | null;
  enrollmentDate?: string | null;
  isSameAddress?: boolean | null;
  currentCountry?: string | null;
  currentState?: string | null;
  currentCity?: string | null;
  currentDistrict?: string | null;
  currentLandmark?: string | null;
  currentZipCode?: string | null;
  currentAddressLine?: string | null;
  permanentCountry?: string | null;
  permanentState?: string | null;
  permanentCity?: string | null;
  permanentDistrict?: string | null;
  permanentLandmark?: string | null;
  permanentZipCode?: string | null;
  permanentAddressLine?: string | null;
  classId?: number | null;
  sectionId?: number | null;
  guardianFirstName: string;
  guardianMiddleName?: string | null;
  guardianLastName: string;
  guardianRelation?: string | null;
  guardianEmail?: string | null;
  guardianPhoneNumber?: string | null;
  guardianAddress?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
}

/** Extended create request matching the 5-step wizard */
export interface StudentWizardRequest {
  // Step 1: Student Information
  admissionNumber?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  religion?: string | null;
  nationality?: string | null;
  socialCategory?: string | null;
  motherTongue?: string | null;
  mobile?: string | null;
  email?: string | null;
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
  currentPincode?: string | null;
  permanentAddressLine1?: string | null;
  permanentAddressLine2?: string | null;
  permanentLandmark?: string | null;
  permanentCity?: string | null;
  permanentDistrict?: string | null;
  permanentState?: string | null;
  permanentCountry?: string | null;
  permanentPincode?: string | null;
  sameAsCurrentAddress?: boolean;
  photoUrl?: string | null;

  // Step 2: Parent Information
  parents?: ParentInfo[];

  // Step 3: Academic Information
  academicYear?: string | null;
  academicYearId?: number | null;
  classId?: number | null;
  sectionId?: number | null;
  rollNumber?: string | null;
  enrollmentDate?: string | null;
  enrollmentStatus?: string | null;

  placeOfBirth?: string | null;
  identityDocumentType?: string | null;
  identityDocumentNumber?: string | null;

  // Step 4: Medical Information
  bloodGroup?: string | null;
  allergies?: string | null;
  medicalConditions?: string | null;
  medications?: string | null;
  doctorName?: string | null;
  doctorContact?: string | null;
  emergencyNotes?: string | null;
}

export interface ParentInfo {
  existingParentId?: number | null;
  relationship: string; // 'FATHER' | 'MOTHER' | 'GUARDIAN'
  firstName: string;
  middleName?: string | null;
  lastName: string;
  mobile: string;
  email?: string | null;
  occupation?: string | null;
  organization?: string | null;
  qualification?: string | null;
  annualIncome?: string | null;
  isPrimaryContact?: boolean;
  isPickupAuthorized?: boolean;
  receiveSms?: boolean;
  receiveEmail?: boolean;
}

export type AttendanceStatusToday = 'PRESENT_TODAY' | 'ABSENT_TODAY' | 'PENDING';

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'WITHDRAWN' | 'GRADUATED' | 'ALUMNI';

export interface StudentDirectoryCard {
  studentId: number;
  admissionNumber: string;
  studentCode?: string | null;       // e.g. STU000136
  fullName: string;
  rollNumber?: string | null;
  classId?: number | null;
  className?: string | null;
  sectionId?: number | null;
  sectionName?: string | null;
  activeEnrollmentId?: number | null;
  mobile?: string | null;
  email?: string | null;
  gender?: string | null;
  photoUrl?: string | null;
  active?: boolean | null;
  status?: StudentStatus | null;
  attendanceStatus: AttendanceStatusToday;
  dateOfBirth?: string | null;
  guardianName?: string | null;
  guardianMobile?: string | null;
}

export interface StudentOverview {
  studentId: number;
  admissionNumber: string;
  studentCode?: string | null;
  rollNumber?: string | null;
  fullName: string;
  className?: string | null;
  sectionName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  ageYears?: number | null;
  mobile?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  photoDocumentId?: number | null;
  academicYear?: string | null;
  admissionDate?: string | null;
  enrollmentDate?: string | null;
  enrollmentStatus?: string | null;
  active?: boolean | null;
  status?: StudentStatus | null;
  bloodGroup?: string | null;
  motherTongue?: string | null;
  nationality?: string | null;
  religion?: string | null;
  house?: string | null;
  transport?: string | null;
  profileCompletion?: number | null;
}

export interface StudentPersonal {
  fullName: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  ageYears?: number | null;
  nationality?: string | null;
  religion?: string | null;
  bloodGroup?: string | null;
  motherTongue?: string | null;
  socialCategory?: string | null;
  placeOfBirth?: string | null;
  identityDocumentType?: string | null;
  identityDocumentNumber?: string | null;
  mobile?: string | null;
  email?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  permanentAddress?: string | null;
  currentAddress?: string | null;
  permanentAddressLine1?: string | null;
  permanentAddressLine2?: string | null;
  permanentLandmark?: string | null;
  permanentCity?: string | null;
  permanentDistrict?: string | null;
  permanentState?: string | null;
  permanentCountry?: string | null;
  permanentPincode?: string | null;
  currentAddressLine1?: string | null;
  currentAddressLine2?: string | null;
  currentLandmark?: string | null;
  currentCity?: string | null;
  currentDistrict?: string | null;
  currentState?: string | null;
  currentCountry?: string | null;
  currentPincode?: string | null;
  sameAddress?: boolean | null;
  remarks?: string | null;
}

export interface GuardianInfo {
  guardianId?: number | null;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  relation?: string | null;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  occupation?: string | null;
  organization?: string | null;
  qualification?: string | null;
  annualIncome?: string | null;
  photoUrl?: string | null;
  isPrimaryContact?: boolean;
  isPickupAuthorized?: boolean;
}

export interface SiblingInfo {
  studentId: number;
  name: string;
  relationship: string;
  className?: string | null;
  sectionName?: string | null;
  active?: boolean | null;
}

export interface FamilySnapshot {
  primary?: GuardianInfo | null;
  guardians: GuardianInfo[];
  siblings: SiblingInfo[];
}

export interface AcademicsSnapshot {
  academicYearId?: number | null;
  classId?: number | null;
  sectionId?: number | null;
  currentClass?: string | null;
  currentSection?: string | null;
  rollNumber?: string | null;
  academicYear?: string | null;
  admissionDate?: string | null;
  enrollmentDate?: string | null;
  enrollmentStatus?: string | null;
  admissionAgeYears?: number | null;
  courseCount: number;
  subjectCount: number;
  previousSchoolName?: string | null;
  previousBoard?: string | null;
  previousClass?: string | null;
  previousAcademicYear?: string | null;
  previousPercentage?: string | null;
  previousTcNumber?: string | null;
}

export interface AcademicHistoryRow {
  academicYear: string;
  className: string;
  sectionName: string;
  rollNumber?: string | null;
  result?: string | null;
  remarks?: string | null;
}

export interface AttendanceSnapshot {
  totalWorkingDays: number;
  present: number;
  absent: number;
  late: number;
  percent: number;
}

export interface MedicalSnapshot {
  bloodGroup?: string | null;
  allergies?: string | null;
  medicalConditions?: string | null;
  medications?: string | null;
  doctorName?: string | null;
  doctorContact?: string | null;
  emergencyNotes?: string | null;
  emergencyContact?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  notes?: string | null;
}

export interface StudentDocumentEntry {
  documentId?: number | null;
  studentId: number;
  documentName: string;
  documentType: string;
  /** Admission/custom label shown in UI (prefer over raw type). */
  displayLabel?: string | null;
  remarks?: string | null;
  fileName?: string | null;
  fileExtension?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
  status: 'UPLOADED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'MISSING';
  uploadedDate?: string | null;
  category?: string | null;
}

export interface StudentProfile360 {
  overview: StudentOverview;
  personal: StudentPersonal;
  family: FamilySnapshot;
  academics: AcademicsSnapshot;
  attendance: AttendanceSnapshot;
  medical: MedicalSnapshot;
}

export interface StudentTimelineEntry {
  action: string;
  description: string;
  performedBy: string;
  performedAt: string;
  icon: string;
  tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
}

export interface AchievementRequest {
  category: string;
  title: string;
  description?: string | null;
  achievementDate?: string | null;
  location?: string | null;
  awardedBy?: string | null;
  icon?: string | null;
}

export interface AchievementResponse {
  achievementId: number;
  studentId: number;
  category: string;
  title: string;
  description?: string | null;
  achievementDate?: string | null;
  location?: string | null;
  awardedBy?: string | null;
  icon?: string | null;
}

export interface DocumentVaultKpi {
  totalDocuments: number;
  verifiedDocuments: number;
  pendingVerification: number;
  missingDocuments: number;
}

export type DocumentVaultStatus = 'VERIFIED' | 'PENDING' | 'MISSING';
export type DocumentVaultCategory = 'PERSONAL' | 'ACADEMIC' | 'MEDICAL' | 'OTHER';

export interface DocumentVaultEntry {
  documentId: number;
  studentId: number;
  studentName: string;
  documentType: string;
  fileName: string;
  fileUrl?: string | null;
  status: DocumentVaultStatus;
  category: DocumentVaultCategory;
  uploadedOn?: string | null;
  verifiedBy?: string | null;
  verifiedOn?: string | null;
  expiresOn?: string | null;
  remarks?: string | null;
}

export interface DocumentVaultRequest {
  studentId: number;
  category: DocumentVaultCategory;
  documentType: string;
  fileName: string;
  fileUrl?: string | null;
  fileSize?: number | null;
  status?: DocumentVaultStatus | null;
  expiresOn?: string | null;
  remarks?: string | null;
}

export interface ClassOption {
  id: number;
  label: string;
  code?: string | null;
}

export interface SectionOption {
  id: number;
  label: string;
  classId: number;
}
