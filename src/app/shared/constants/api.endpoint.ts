import { environment } from '../../../environments/environment';

const BASE = environment.baseUrl; // e.g. http://localhost:8181/api/v1
// Password reset lives at /api/password/... (outside /v1 versioning)
const PASS_BASE = environment.baseUrl.replace(/\/api\/v\d+$/, '/api');

export const loginApi = {
  loginUrl: `${BASE}/users/login`,
  currentUserInfo: `${BASE}/users/currentUserInfo`,
  logOutUrl: `${BASE}/users/logout`,
  refreshTokenUrl: `${BASE}/users/refreshToken`,
};

export const passwordApi = {
  forgot: `${PASS_BASE}/password/forgot`,
  verifyOtp: `${PASS_BASE}/password/verify-otp`,
  reset: `${PASS_BASE}/password/reset`,
};

export const attendanceApi = {
  base: `${BASE}/attendance`,
  byDateAndType: (date: string, type: string) => `${BASE}/attendance?date=${date}&type=${type}`,
  byClass: (classId: number, date: string) => `${BASE}/attendance/class/${classId}?date=${date}`,
  history: (referenceId: number, type: string) => `${BASE}/attendance/history/${referenceId}?type=${type}`,
  update: (id: number) => `${BASE}/attendance/${id}`,
  delete: (id: number) => `${BASE}/attendance/${id}`,
};

export const leaveApi = {
  apply: `${BASE}/leave/apply`,
  all: `${BASE}/leave/all`,
  my: `${BASE}/leave/my`,
  approve: (id: number) => `${BASE}/leave/${id}/approve`,
  reject: (id: number) => `${BASE}/leave/${id}/reject`,
  cancel: (id: number) => `${BASE}/leave/${id}`,
};

export const payrollApi = {
  all: `${BASE}/payroll`,
  byStaff: (staffId: number) => `${BASE}/payroll/${staffId}`,
  saveOrUpdate: `${BASE}/payroll`,
  run: `${BASE}/payroll/run`,
};

export const tenantApi = {
  // Tenant provisioning controller sits at /api/v1/tenant-onboarding
  activate: (tenantId: string) => `${BASE}/tenant-onboarding/${tenantId}/activate`,
  deactivate: (tenantId: string) => `${BASE}/tenant-onboarding/${tenantId}/deactivate`,
  status: (tenantId: string) => `${BASE}/tenant-onboarding/status/${tenantId}`,
};

// ─── Staff, Branch, Department (previously /api/* — now /api/v1/*) ──────────
export const staffApi = {
  saveOrUpdate: `${BASE}/staff/saveOrUpdateStaff`,
  getAll: `${BASE}/staff/getAllStaff`,
  getByCode: (code: string) => `${BASE}/staff/getStaffByCode/${code}`,
  toggleStatus: (code: string) => `${BASE}/staff/staffActiveStatus/${code}`,
};

export const branchApi = {
  getAll: `${BASE}/branches/getAllBranch`,
};

export const departmentApi = {
  getAll: `${BASE}/departments/getAllDepartment`,
};

// ─── Student, Class, Section (previously /api/* — now /api/v1/*) ─────────────
export const studentApi = {
  register: `${BASE}/students/registerStudent`,
  getAll: `${BASE}/students/getStudents`,
  getById: (id: number) => `${BASE}/students/${id}`,
  update: (id: number) => `${BASE}/students/${id}`,
  delete: (id: number) => `${BASE}/students/${id}`,
  documents: (id: number) => `${BASE}/students/${id}/documents`,
  downloadDoc: (docId: number) => `${BASE}/students/document/${docId}/download`,
};

export const classApi = {
  getAll: `${BASE}/classes/getListOfClass`,
};

export const sectionApi = {
  getByclassId: (classId: number) => `${BASE}/sections/getListOfSectionsByClassId/${classId}`,
};

// ─── Admissions (previously /api/admissions — now /api/v1/admissions) ────────
export const admissionApi = {
  saveDraft: `${BASE}/admissions/draft`,
  submit: `${BASE}/admissions`,
  getById: (id: number) => `${BASE}/admissions/${id}`,
  getAll: `${BASE}/admissions`,
  updateStatus: `${BASE}/admissions/status`,
  publicFormConfig: `${BASE}/public/admissions/form-config`,
};

// ─── Inquiry (previously /api/staff/inquiries — now /api/v1/inquiries) ────────
export const inquiryApi = {
  base: `${BASE}/inquiries`,
  getAll: `${BASE}/inquiries`,
  save: `${BASE}/inquiries`,
  delete: (id: number) => `${BASE}/inquiries/${id}`,
  followUps: `${BASE}/inquiries/follow-ups`,
  summary: (inquiryId: number) => `${BASE}/inquiries/${inquiryId}/summary`,
  inquiryFollowUps: (inquiryId: number) => `${BASE}/inquiries/${inquiryId}/follow-ups`,
  addFollowUp: (inquiryId: number) => `${BASE}/inquiries/${inquiryId}/follow-ups`,
  proceedAdmission: (inquiryId: number) => `${BASE}/inquiries/${inquiryId}/proceed-admission`,
  markLost: (inquiryId: number) => `${BASE}/inquiries/${inquiryId}/mark-lost`,
};

// ─── Public Inquiry (previously /api/public/inquiries — now /api/v1/public/inquiries) ─
export const publicInquiryApi = {
  submit: `${BASE}/public/inquiries`,
};

// ─── Courses, Subjects, Academic Years ─────────────────────────────────────────
export const courseApi = {
  getByOrg: (orgId: number) => `${BASE}/courses/org/${orgId}`,
  getById: (id: number) => `${BASE}/courses/${id}`,
  save: `${BASE}/courses`,
  subjectsByOrg: (orgId: number) => `${BASE}/subjects/org/${orgId}`,
  subjectById: (id: number) => `${BASE}/subjects/${id}`,
  saveSubject: `${BASE}/subjects`,
  courseSubjects: (courseId: number) => `${BASE}/courses/${courseId}/subjects`,
};

export const academicYearApi = {
  getByOrg: (orgId: number) => `${BASE}/academic-structure/years/${orgId}`,
  save: `${BASE}/academic-structure/years`,
  setCurrent: (orgId: number, yearId: number) => `${BASE}/academic-structure/years/${orgId}/current/${yearId}`,
  getCurrent: (orgId: number) => `${BASE}/academic-structure/years/${orgId}/current`,
};

// ─── Semesters ──────────────────────────────────────────────────────────────────
export const semesterApi = {
  base: `${BASE}/semesters`,
  byYear: (yearId: number) => `${BASE}/semesters/year/${yearId}`,
  byId: (id: number) => `${BASE}/semesters/${id}`,
  setCurrent: (id: number) => `${BASE}/semesters/${id}/set-current`,
};

// ─── Academic Structure (containers) ────────────────────────────────────────────
export const academicStructureApi = {
  base: `${BASE}/academic-structure`,
  containersByOrgYear: (orgId: number, yearId: number) => `${BASE}/academic-structure/containers/org/${orgId}/year/${yearId}`,
  children: (parentId: number) => `${BASE}/academic-structure/containers/${parentId}/children`,
  containerById: (id: number) => `${BASE}/academic-structure/containers/${id}`,
  saveContainer: `${BASE}/academic-structure/containers`,
  generateSchool: `${BASE}/academic-structure/generate-school`,
  generateDynamic: `${BASE}/academic-structure/generate-dynamic`,
};

// ─── Academics Workspace ────────────────────────────────────────────────────────
export const academicsApi = {
  saveClass: `${BASE}/classes/saveOrUpdate`,
  saveSection: `${BASE}/sections/saveOrUpdate`,
  allocations: `${BASE}/allocations`,
  allocationsByClass: (classId: number) => `${BASE}/allocations/class/${classId}`,
  classTeachers: `${BASE}/academics/class-teachers`,
  timetableSlots: `${BASE}/academics/timetable-slots`,
  calendarEvents: `${BASE}/academics/calendar-events`,
  settings: `${BASE}/academics/settings`,
};

// ─── Syllabus ───────────────────────────────────────────────────────────────────
export const syllabusApi = {
  base: `${BASE}/syllabi`,
  byId: (id: number) => `${BASE}/syllabi/${id}`,
  publish: (id: number) => `${BASE}/syllabi/${id}/publish`,
  newVersion: (id: number) => `${BASE}/syllabi/${id}/new-version`,
  history: (id: number) => `${BASE}/syllabi/${id}/history`,
  latestBySubject: (subjectId: number) => `${BASE}/syllabus/subject/${subjectId}/latest`,
  studentProgress: (studentId: number, syllabusId: number) => `${BASE}/student-progress/${studentId}/${syllabusId}`,
  saveStudentProgress: `${BASE}/student-progress`,
};

// ─── Dashboard ──────────────────────────────────────────────────────────────────
export const dashboardApi = {
  base: `${BASE}/dashboard`,
  workspace: `${BASE}/dashboard/workspace`,
  search: `${BASE}/dashboard/search`,
};

// ─── Admin Control ──────────────────────────────────────────────────────────────
export const adminControlApi = {
  workspace: `${BASE}/admin-control/workspace`,
  diagnostics: `${BASE}/admin-control/diagnostics`,
  provision: `${BASE}/tenant-onboarding/provision`,
  registerUser: `${BASE}/users/register`,
};

// ─── Organization ───────────────────────────────────────────────────────────────
export const organizationApi = {
  base: `${BASE}/organizations`,
  all: `${BASE}/organizations/all`,
  groups: `${BASE}/organizations/groups`,
  byId: (orgId: number) => `${BASE}/organizations/${orgId}`,
  byCode: (orgCode: string) => `${BASE}/organizations/${orgCode}`,
  updateOwner: `${BASE}/organizations/owner/update`,
  provision: `${BASE}/tenant-onboarding/provision`,
};
