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
