/**
 * Spec-aligned students workspace types.
 * Mirror of backend DTOs returned by `/api/v1/students/workspace/*`.
 */

export interface StudentKpi {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newAdmissionsThisYear: number;
  alumniCount: number;
}

export interface StudentSearchRequest {
  keyword?: string | null;
  classId?: string | null;
  sectionId?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | null;
  parentName?: string | null;
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
  currentZipCode?: string | null;
  currentAddressLine?: string | null;
  permanentCountry?: string | null;
  permanentState?: string | null;
  permanentCity?: string | null;
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
}

export type AttendanceStatusToday = 'PRESENT_TODAY' | 'ABSENT_TODAY' | 'PENDING';

export interface StudentDirectoryCard {
  studentId: number;
  admissionNumber: string;
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
  attendanceStatus: AttendanceStatusToday;
  dateOfBirth?: string | null;
  guardianName?: string | null;
  guardianMobile?: string | null;
}

export interface StudentOverview {
  studentId: number;
  admissionNumber: string;
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
  academicYear?: string | null;
  admissionDate?: string | null;
  active?: boolean | null;
  bloodGroup?: string | null;
  motherTongue?: string | null;
  nationality?: string | null;
  religion?: string | null;
  house?: string | null;
  transport?: string | null;
}

export interface StudentPersonal {
  fullName: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  religion?: string | null;
  bloodGroup?: string | null;
  motherTongue?: string | null;
  permanentAddress?: string | null;
  currentAddress?: string | null;
  remarks?: string | null;
}

export interface GuardianInfo {
  guardianId?: number | null;
  name: string;
  relation?: string | null;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  occupation?: string | null;
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
  currentClass?: string | null;
  currentSection?: string | null;
  rollNumber?: string | null;
  academicYear?: string | null;
  admissionDate?: string | null;
  admissionAgeYears?: number | null;
  courseCount: number;
  subjectCount: number;
}

export interface AttendanceSnapshot {
  totalWorkingDays: number;
  present: number;
  absent: number;
  late: number;
  percent: number;
}

export interface FeeSnapshot {
  totalFee: number;
  paid: number;
  pending: number;
  status: string;
}

export interface MedicalSnapshot {
  bloodGroup?: string | null;
  allergies?: string | null;
  medications?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
}

export interface StudentProfile360 {
  overview: StudentOverview;
  personal: StudentPersonal;
  family: FamilySnapshot;
  academics: AcademicsSnapshot;
  attendance: AttendanceSnapshot;
  fees: FeeSnapshot;
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

export interface AlumniRequest {
  studentId?: number | null;
  fullName: string;
  batchYear?: string | null;
  yearPassed?: string | null;
  course?: string | null;
  occupation?: string | null;
  employer?: string | null;
  contact?: string | null;
  email?: string | null;
  city?: string | null;
  graduationDate?: string | null;
  linkedIn?: string | null;
}

export interface AlumniResponse {
  alumniId: number;
  studentId?: number | null;
  fullName: string;
  batchYear?: string | null;
  yearPassed?: string | null;
  course?: string | null;
  occupation?: string | null;
  employer?: string | null;
  contact?: string | null;
  email?: string | null;
  city?: string | null;
  graduationDate?: string | null;
  linkedIn?: string | null;
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

// --- Promotion / Transfer (existing endpoints) ---

export type PromotionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ROLLED_BACK';
export type PromotionDecision = 'PROMOTED' | 'RETAINED' | 'GRADUATED' | 'TRANSFERRED_OUT' | 'WITHHELD';

export interface PromotionBatch {
  id?: number;
  batchCode?: string | null;
  fromAcademicYearId?: number | null;
  toAcademicYearId?: number | null;
  fromClassId?: number | null;
  toClassId?: number | null;
  status?: PromotionStatus | null;
  plannedCount?: number | null;
  processedCount?: number | null;
  executedOn?: string | null;
  remarks?: string | null;
}

export interface PromotionRecord {
  id?: number;
  promotionBatchId?: number | null;
  studentId?: number | null;
  fromEnrollmentId?: number | null;
  toEnrollmentId?: number | null;
  decision?: PromotionDecision | null;
  reason?: string | null;
}

export type TransferStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'CERTIFICATE_ISSUED' | 'REJECTED' | 'CANCELLED';

export interface TransferRequest {
  id?: number;
  requestNumber?: string | null;
  studentId?: number | null;
  enrollmentId?: number | null;
  requestedOn?: string | null;
  reason?: string | null;
  destinationSchool?: string | null;
  status?: TransferStatus | null;
  approvedByUserId?: number | null;
  approvedOn?: string | null;
  certificateNumber?: string | null;
  certificateIssuedOn?: string | null;
  remarks?: string | null;
}
