import { environment } from '../../../environments/environment';

const BASE = environment.baseUrl; // e.g. http://localhost:8181/api/v1
// Password reset lives at /api/password/... (outside /v1 versioning)
const PASS_BASE = environment.baseUrl.replace(/\/api\/v\d+$/, '/api');
// Platform management APIs live at /api/platform/* (SUPER_ADMIN only)
const PLATFORM_BASE = `${PASS_BASE}/platform`;
// Access management APIs live at /api/access/* (org admin / owner)
const ACCESS_BASE = `${PASS_BASE}/access`;

export const academicsApi = {
  years: `${BASE}/academics/years`,
  yearById: (id: number) => `${BASE}/academics/years/${id}`,
  setCurrentYear: (id: number) => `${BASE}/academics/years/${id}/set-current`,
  deactivateYear: (id: number) => `${BASE}/academics/years/${id}/deactivate`,
  cloneYear: (id: number) => `${BASE}/academics/years/${id}/clone`,
  classesByYear: (yearId: number) => `${BASE}/academics/years/${yearId}/classes`,
  structureByYear: (yearId: number) => `${BASE}/academics/years/${yearId}/structure`,
  classes: `${BASE}/academics/classes`,
  classById: (id: number) => `${BASE}/academics/classes/${id}`,
  deactivateClass: (id: number) => `${BASE}/academics/classes/${id}/deactivate`,
  sectionsByClass: (classId: number) => `${BASE}/academics/classes/${classId}/sections`,
  sectionById: (id: number) => `${BASE}/academics/sections/${id}`,
  deactivateSection: (id: number) => `${BASE}/academics/sections/${id}/deactivate`,
  subjects: `${BASE}/academics/subjects`,
  subjectById: (id: number) => `${BASE}/academics/subjects/${id}`,
  deactivateSubject: (id: number) => `${BASE}/academics/subjects/${id}/deactivate`,
  classTeachers: `${BASE}/academics/allocations/class-teachers`,
  classTeacherById: (id: number) => `${BASE}/academics/allocations/class-teachers/${id}`,
  subjectAssignments: `${BASE}/academics/allocations/subjects`,
  subjectAssignmentById: (id: number) => `${BASE}/academics/allocations/subjects/${id}`,
  schedulesByYear: (yearId: number) => `${BASE}/academics/schedules/year/${yearId}`,
  schedules: `${BASE}/academics/schedules`,
  scheduleById: (id: number) => `${BASE}/academics/schedules/${id}`,
  scheduleTemplates: (scheduleId: number) => `${BASE}/academics/schedules/${scheduleId}/templates`,
  templatePeriods: (templateId: number) => `${BASE}/academics/schedules/templates/${templateId}/periods`,
  timetableByClass: (classId: number) => `${BASE}/academics/timetable/class/${classId}`,
  timetableSlots: `${BASE}/academics/timetable/slots`,
  timetableSlotById: (id: number) => `${BASE}/academics/timetable/slots/${id}`,
  calendarEventsByYear: (yearId: number) => `${BASE}/academics/calendar/years/${yearId}/events`,
  calendarEventById: (id: number) => `${BASE}/academics/calendar/events/${id}`,
  calendarUpcoming: `${BASE}/academics/calendar/events/upcoming`,
  arrangements: `${BASE}/academics/arrangements`,
  arrangementsByDate: `${BASE}/academics/arrangements/by-date`,
  arrangementById: (id: number) => `${BASE}/academics/arrangements/${id}`,
  approveArrangement: (id: number) => `${BASE}/academics/arrangements/${id}/approve`,
  rejectArrangement: (id: number) => `${BASE}/academics/arrangements/${id}/reject`,
  syllabus: `${BASE}/academics/syllabus`,
  syllabusById: (id: number) => `${BASE}/academics/syllabus/${id}`,
  syllabusProgress: (id: number) => `${BASE}/academics/syllabus/${id}/progress`,
  topicProgress: (topicId: number) => `${BASE}/academics/syllabus/topics/${topicId}/progress`,
  staffAll: `${BASE}/staff`,
};

export const accessApi = {
  roles: `${ACCESS_BASE}/roles`,
  roleById: (id: number) => `${ACCESS_BASE}/roles/${id}`,
  roleSearch: `${ACCESS_BASE}/roles/search`,
  activateRole: (id: number) => `${ACCESS_BASE}/roles/${id}/activate`,
  deactivateRole: (id: number) => `${ACCESS_BASE}/roles/${id}/deactivate`,
  rolePermissions: (roleId: number, organizationId: number) =>
    `${ACCESS_BASE}/roles/${roleId}/permissions?organizationId=${organizationId}`,
  menus: `${ACCESS_BASE}/menus`,
  menuById: (id: number) => `${ACCESS_BASE}/menus/${id}`,
  menuTree: `${ACCESS_BASE}/menus/tree`,
  menuSearch: `${ACCESS_BASE}/menus/search`,
  activateMenu: (id: number) => `${ACCESS_BASE}/menus/${id}/activate`,
  deactivateMenu: (id: number) => `${ACCESS_BASE}/menus/${id}/deactivate`,
  sidebar: (userId: number, organizationId: number) =>
    `${ACCESS_BASE}/menus/sidebar?userId=${userId}&organizationId=${organizationId}`,
  orgUsers: (orgId: number) => `${ACCESS_BASE}/organizations/${orgId}/users`,
  orgUserById: (orgId: number, userId: number) => `${ACCESS_BASE}/organizations/${orgId}/users/${userId}`,
  activateUser: (orgId: number, userId: number) => `${ACCESS_BASE}/organizations/${orgId}/users/${userId}/activate`,
  deactivateUser: (orgId: number, userId: number) => `${ACCESS_BASE}/organizations/${orgId}/users/${userId}/deactivate`,
  lockUser: (orgId: number, userId: number) => `${ACCESS_BASE}/organizations/${orgId}/users/${userId}/lock`,
  unlockUser: (orgId: number, userId: number) => `${ACCESS_BASE}/organizations/${orgId}/users/${userId}/unlock`,
  assignRole: (orgId: number, userId: number, roleId: number) =>
    `${ACCESS_BASE}/organizations/${orgId}/users/${userId}/roles/${roleId}`,
  removeRole: (orgId: number, userId: number, roleId: number) =>
    `${ACCESS_BASE}/organizations/${orgId}/users/${userId}/roles/${roleId}`,
  userEffectivePermissions: (orgId: number, userId: number) =>
    `${ACCESS_BASE}/organizations/${orgId}/users/${userId}/effective-permissions`,
  userPermissions: (userId: number, organizationId: number) =>
    `${ACCESS_BASE}/users/${userId}/permissions?organizationId=${organizationId}`,
  securityPolicy: (orgId: number) => `${ACCESS_BASE}/organizations/${orgId}/security-policy`,
  resetSecurityPolicy: (orgId: number) => `${ACCESS_BASE}/organizations/${orgId}/security-policy/reset`,
  orgLoginHistory: (orgId: number) => `${ACCESS_BASE}/login-history/organizations/${orgId}`,
  userLoginHistory: (userId: number) => `${ACCESS_BASE}/login-history/users/${userId}`,
};

export const loginApi = {
  loginUrl: `${PASS_BASE}/auth/login`,
  logOutUrl: `${PASS_BASE}/auth/logout`,
  refreshTokenUrl: `${PASS_BASE}/auth/refresh`,
};

export const passwordApi = {
  forgot: `${PASS_BASE}/auth/forgot-password`,
  verifyOtp: `${PASS_BASE}/auth/verify-otp`,
  reset: `${PASS_BASE}/auth/reset-password`,
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
  base: `${BASE}/staff`,
  dashboard: `${BASE}/staff/dashboard`,
  byId: (id: number) => `${BASE}/staff/${id}`,
  activate: (id: number) => `${BASE}/staff/${id}/activate`,
  deactivate: (id: number) => `${BASE}/staff/${id}/deactivate`,
  responsibilities: `${BASE}/staff/responsibilities`,
  responsibilityById: (id: number) => `${BASE}/staff/responsibilities/${id}`,
  responsibilityAssignments: `${BASE}/staff/responsibility-assignments`,
  staffResponsibilities: (staffId: number) => `${BASE}/staff/${staffId}/responsibilities`,
  salaryStructures: `${BASE}/staff/salary-structures`,
  salaryStructureById: (id: number) => `${BASE}/staff/salary-structures/${id}`,
  salaryStructureForStaff: (staffId: number) => `${BASE}/staff/${staffId}/salary-structure`,
  salaryHistory: (staffId: number) => `${BASE}/staff/${staffId}/salary-history`,
  /** @deprecated legacy endpoints — do not use */
  saveOrUpdate: `${BASE}/staff/saveOrUpdateStaff`,
  getAll: `${BASE}/staff/getAllStaff`,
  getByCode: (code: string) => `${BASE}/staff/getStaffByCode/${code}`,
  toggleStatus: (code: string) => `${BASE}/staff/staffActiveStatus/${code}`,
};

export const staffPayrollApi = {
  dashboard: `${BASE}/payroll/dashboard`,
  generate: `${BASE}/payroll/generate`,
  list: `${BASE}/payroll`,
  byId: (id: number) => `${BASE}/payroll/${id}`,
  markPaid: (id: number) => `${BASE}/payroll/${id}/mark-paid`,
  bulkMarkPaid: `${BASE}/payroll/mark-paid`,
  payslip: (id: number) => `${BASE}/payroll/${id}/payslip`,
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

// ─── Syllabus (legacy paths) ───────────────────────────────────────────────────
export const syllabusApi = {
  base: `${BASE}/syllabus`,
  byId: (id: number) => `${BASE}/syllabus/${id}`,
  publish: (id: number) => `${BASE}/syllabus/${id}/publish`,
  newVersion: (id: number) => `${BASE}/syllabus/${id}/version`,
  history: (id: number) => `${BASE}/syllabus/${id}/history`,
  latestBySubject: (subjectId: number) => `${BASE}/syllabus/subject/${subjectId}/latest`,
  studentProgress: (studentId: number, syllabusId: number) => `${BASE}/syllabus/progress/student/${studentId}/syllabus/${syllabusId}`,
  saveStudentProgress: (topicId: number) => `${BASE}/syllabus/progress/topic/${topicId}`,
};

// ─── Dashboard ──────────────────────────────────────────────────────────────────
export const dashboardApi = {
  base: `${BASE}/dashboard`,
  workspace: `${BASE}/dashboard/workspace`,
  search: `${BASE}/dashboard/search`,
};

// ─── Audit (platform-wide activity logs) ────────────────────────────────────────
export const auditApi = {
  logs: `${BASE}/audit/logs`,
  security: `${BASE}/audit/security`,
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

// ─── Platform Management (ThinkersCave Super Admin) ───────────────────────────
export const platformApi = {
  dashboard: `${PLATFORM_BASE}/dashboard`,
  organizations: `${PLATFORM_BASE}/organizations`,
  organizationById: (id: number) => `${PLATFORM_BASE}/organizations/${id}`,
  activateOrganization: (id: number) => `${PLATFORM_BASE}/organizations/${id}/activate`,
  suspendOrganization: (id: number) => `${PLATFORM_BASE}/organizations/${id}/suspend`,
  archiveOrganization: (id: number) => `${PLATFORM_BASE}/organizations/${id}/archive`,
  customers: `${PLATFORM_BASE}/customers`,
  customerById: (id: number) => `${PLATFORM_BASE}/customers/${id}`,
  customerOrganizations: (id: number) => `${PLATFORM_BASE}/customers/${id}/organizations`,
  subscriptionPlans: `${PLATFORM_BASE}/subscription-plans`,
  subscriptionPlanById: (id: number) => `${PLATFORM_BASE}/subscription-plans/${id}`,
  planFeatures: (planId: number) => `${PLATFORM_BASE}/subscription-plans/${planId}/features`,
  features: `${PLATFORM_BASE}/features`,
  featureById: (id: number) => `${PLATFORM_BASE}/features/${id}`,
  promotions: `${PLATFORM_BASE}/promotions`,
  promotionById: (id: number) => `${PLATFORM_BASE}/promotions/${id}`,
  organizationSubscriptions: `${PLATFORM_BASE}/organization-subscriptions`,
  organizationSubscriptionById: (id: number) => `${PLATFORM_BASE}/organization-subscriptions/${id}`,
  subscriptionFeatureOverrides: (subId: number) => `${PLATFORM_BASE}/organization-subscriptions/${subId}/feature-overrides`,
  featureOverrides: `${PLATFORM_BASE}/feature-overrides`,
  featureOverrideById: (id: number) => `${PLATFORM_BASE}/feature-overrides/${id}`,
  provision: `${PLATFORM_BASE}/provision`,
  provisionJobs: `${PLATFORM_BASE}/provision/jobs`,
  provisionJobById: (id: number) => `${PLATFORM_BASE}/provision/jobs/${id}`,
  retryProvisionJob: (id: number) => `${PLATFORM_BASE}/provision/jobs/${id}/retry`,
  tenantRegistry: `${PLATFORM_BASE}/tenant-registry`,
  tenantById: (id: number) => `${PLATFORM_BASE}/tenant-registry/${id}`,
  tenantMaintenance: (id: number) => `${PLATFORM_BASE}/tenant-registry/${id}/maintenance`,
  tenantResume: (id: number) => `${PLATFORM_BASE}/tenant-registry/${id}/resume`,
  tenantBackup: (id: number) => `${PLATFORM_BASE}/tenant-registry/${id}/backup`,
  tenantMigrate: (id: number) => `${PLATFORM_BASE}/tenant-registry/${id}/migrate`,
  provisioningTemplates: `${PLATFORM_BASE}/provisioning-templates`,
  maintenanceSchedules: `${PLATFORM_BASE}/maintenance`,
  orgConfiguration: (orgId: number) => `${PLATFORM_BASE}/organization-configurations/${orgId}`,
};
