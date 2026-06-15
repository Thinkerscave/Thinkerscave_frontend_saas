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
  status?: 'ACTIVE' | 'INACTIVE' | 'ALUMNI' | null;
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
  motherTongue?: string | null;
  mobile?: string | null;
  email?: string | null;
  currentAddressLine1?: string | null;
  currentAddressLine2?: string | null;
  currentCity?: string | null;
  currentState?: string | null;
  currentPincode?: string | null;
  permanentAddressLine1?: string | null;
  permanentAddressLine2?: string | null;
  permanentCity?: string | null;
  permanentState?: string | null;
  permanentPincode?: string | null;
  sameAsCurrentAddress?: boolean;
  photoUrl?: string | null;

  // Step 2: Parent Information
  parents?: ParentInfo[];

  // Step 3: Academic Information
  academicYear?: string | null;
  classId?: number | null;
  sectionId?: number | null;
  rollNumber?: string | null;
  enrollmentDate?: string | null;
  enrollmentStatus?: string | null;

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
  relationship: string; // 'FATHER' | 'MOTHER' | 'GUARDIAN'
  firstName: string;
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

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'ALUMNI' | 'PENDING';

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
  nationality?: string | null;
  religion?: string | null;
  bloodGroup?: string | null;
  motherTongue?: string | null;
  mobile?: string | null;
  email?: string | null;
  permanentAddress?: string | null;
  currentAddress?: string | null;
  permanentAddressLine1?: string | null;
  permanentCity?: string | null;
  permanentState?: string | null;
  permanentPincode?: string | null;
  currentAddressLine1?: string | null;
  currentCity?: string | null;
  currentState?: string | null;
  currentPincode?: string | null;
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

export interface FeeSnapshot {
  totalFee: number;
  paid: number;
  pending: number;
  status: string;
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
  notes?: string | null;
}

export interface StudentDocumentEntry {
  documentId?: number | null;
  studentId: number;
  documentName: string;
  documentType: string;
  fileName?: string | null;
  fileUrl?: string | null;
  status: 'UPLOADED' | 'PENDING' | 'VERIFIED' | 'MISSING';
  uploadedDate?: string | null;
  category?: string | null;
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

export interface AlumniFilters {
  passoutYear?: string | null;
  course?: string | null;
  batch?: string | null;
  city?: string | null;
  occupation?: string | null;
  keyword?: string | null;
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

/** Simplified spec-aligned transfer status (REQUESTED → APPROVED → COMPLETED or REJECTED) */
export type TransferStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'CERTIFICATE_ISSUED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface TransferRequest {
  id?: number;
  transferNumber?: string | null;
  requestNumber?: string | null;
  studentId?: number | null;
  studentName?: string | null;
  className?: string | null;
  sectionName?: string | null;
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
