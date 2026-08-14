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
  yearsDashboard: `${BASE}/academics/years/dashboard`,
  yearById: (id: number) => `${BASE}/academics/years/${id}`,
  deactivateYear: (id: number) => `${BASE}/academics/years/${id}/deactivate`,
  yearReady: (id: number) => `${BASE}/academics/years/${id}/ready`,
  yearSubmit: (id: number) => `${BASE}/academics/years/${id}/submit`,
  yearApprove: (id: number) => `${BASE}/academics/years/${id}/approve`,
  yearReject: (id: number) => `${BASE}/academics/years/${id}/reject`,
  yearActivate: (id: number) => `${BASE}/academics/years/${id}/activate`,
  classesByYear: (yearId: number) => `${BASE}/academics/years/${yearId}/classes`,
  classesDashboard: (yearId: number) => `${BASE}/academics/years/${yearId}/classes/dashboard`,
  structureByYear: (yearId: number) => `${BASE}/academics/years/${yearId}/structure`,
  classes: `${BASE}/academics/classes`,
  classById: (id: number) => `${BASE}/academics/classes/${id}`,
  deactivateClass: (id: number) => `${BASE}/academics/classes/${id}/deactivate`,
  activateClass: (id: number) => `${BASE}/academics/classes/${id}/activate`,
  sectionsByClass: (classId: number) => `${BASE}/academics/classes/${classId}/sections`,
  sectionById: (id: number) => `${BASE}/academics/sections/${id}`,
  deactivateSection: (id: number) => `${BASE}/academics/sections/${id}/deactivate`,
  activateSection: (id: number) => `${BASE}/academics/sections/${id}/activate`,
  subjects: `${BASE}/academics/subjects`,
  subjectsByYear: (yearId: number) => `${BASE}/academics/years/${yearId}/subjects`,
  subjectsDashboard: (yearId: number) => `${BASE}/academics/years/${yearId}/subjects/dashboard`,
  subjectById: (id: number) => `${BASE}/academics/subjects/${id}`,
  deactivateSubject: (id: number) => `${BASE}/academics/subjects/${id}/deactivate`,
  activateSubject: (id: number) => `${BASE}/academics/subjects/${id}/activate`,
  classSubjectMappings: (classId: number) => `${BASE}/academics/classes/${classId}/subject-mappings`,
  teacherAllocationsDashboard: (yearId: number) => `${BASE}/academics/years/${yearId}/teacher-allocations/dashboard`,
  teacherAllocationAssign: `${BASE}/academics/teacher-allocations/assign`,
  teacherAllocationUnassign: (id: number) => `${BASE}/academics/teacher-allocations/${id}/unassign`,
  teacherAllocationRecommendations: `${BASE}/academics/teacher-allocations/recommendations`,
  teacherWorkloads: (yearId: number) => `${BASE}/academics/years/${yearId}/teacher-workloads`,
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
  timetableDashboard: (yearId: number) => `${BASE}/academics/years/${yearId}/timetable/dashboard`,
  timetableConfiguration: (yearId: number) => `${BASE}/academics/years/${yearId}/timetable/configuration`,
  timetableGenerate: (yearId: number) => `${BASE}/academics/years/${yearId}/timetable/generate`,
  timetableReadiness: (yearId: number) => `${BASE}/academics/years/${yearId}/timetable/readiness`,
  timetableGenerations: (yearId: number) => `${BASE}/academics/years/${yearId}/timetable/generations`,
  timetableGenerationById: (id: string) => `${BASE}/academics/timetable/generations/${id}`,
  timetableGenerationCancel: (id: string) => `${BASE}/academics/timetable/generations/${id}/cancel`,
  timetableVersions: (yearId: number) => `${BASE}/academics/years/${yearId}/timetable/versions`,
  timetableGrid: (versionId: number) => `${BASE}/academics/timetable/versions/${versionId}/grid`,
  timetableConflicts: (versionId: number) => `${BASE}/academics/timetable/versions/${versionId}/conflicts`,
  timetableConflictResolve: (id: number) => `${BASE}/academics/timetable/conflicts/${id}/resolve`,
  timetableConflictIgnore: (id: number) => `${BASE}/academics/timetable/conflicts/${id}/ignore`,
  timetableVersionSubmit: (id: number) => `${BASE}/academics/timetable/versions/${id}/submit`,
  timetableVersionApprove: (id: number) => `${BASE}/academics/timetable/versions/${id}/approve`,
  timetableVersionReject: (id: number) => `${BASE}/academics/timetable/versions/${id}/reject`,
  timetableVersionPublish: (id: number) => `${BASE}/academics/timetable/versions/${id}/publish`,
  academicResources: `${BASE}/academics/resources`,
  academicResourceById: (id: number) => `${BASE}/academics/resources/${id}`,
  deactivateAcademicResource: (id: number) => `${BASE}/academics/resources/${id}/deactivate`,
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
  settings: `${BASE}/attendance/settings`,
  settingsReset: `${BASE}/attendance/settings/reset`,
  copyPrevious: (classId: number, targetDate: string, sectionId?: number | null) => {
    const sec = sectionId != null ? `&sectionId=${sectionId}` : '';
    return `${BASE}/attendance/students/copy-previous?classId=${classId}&targetDate=${targetDate}${sec}`;
  },
  reports: {
    summary: `${BASE}/attendance/reports/summary`,
    staff: `${BASE}/attendance/reports/staff`,
    student: (studentId: number) => `${BASE}/attendance/reports/student/${studentId}`
  }
};

// ─── Staff attendance (sign-in / sign-out) ───────────────────────────────────
export const staffAttendanceApi = {
  base: `${BASE}/attendance/staff`,
  myToday: `${BASE}/attendance/staff/me/today`,
  signIn: `${BASE}/attendance/staff/sign-in`,
  signOut: `${BASE}/attendance/staff/sign-out`,
  today: (date?: string) => date ? `${BASE}/attendance/staff/today?date=${date}` : `${BASE}/attendance/staff/today`,
  history: (staffId: number) => `${BASE}/attendance/staff/history/${staffId}`,
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
  base: `${BASE}/students`,
  register: `${BASE}/students/registerStudent`,
  directory: `${BASE}/students`,
  search: `${BASE}/students/search`,
  getAll: `${BASE}/students/getStudents`,
  getById: (id: number) => `${BASE}/students/${id}`,
  create: `${BASE}/students`,
  update: (id: number) => `${BASE}/students/${id}`,
  delete: (id: number) => `${BASE}/students/${id}`,
  status: (id: number) => `${BASE}/students/${id}/status`,
  profile360: (id: number) => `${BASE}/students/${id}/profile-360`,
  personal: (id: number) => `${BASE}/students/${id}/personal`,
  medical: (id: number) => `${BASE}/students/${id}/medical`,
  timeline: (id: number) => `${BASE}/students/${id}/timeline`,
  documents: (id: number) => `${BASE}/students/${id}/documents`,
  downloadDoc: (docId: number) => `${BASE}/students/document/${docId}/download`,
  alumni: `${BASE}/students/alumni`,
  import: `${BASE}/students/import`,
  importTemplate: `${BASE}/students/import/template`,
  importSummary: (jobId: string) => `${BASE}/students/import/${jobId}`,
  importErrors: (jobId: string) => `${BASE}/students/import/${jobId}/errors`,
  classes: `${BASE}/students/classes`,
  sections: `${BASE}/students/sections`,
  academicYears: `${BASE}/students/academic-years`,
  bloodGroups: `${BASE}/students/blood-groups`,
  transfers: `${BASE}/students/transfers`,
  activeEnrollment: (id: number) => `${BASE}/students/${id}/enrollment/active`,
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

/** Unauthenticated org directory for workspace selection before login. */
export const publicOrganizationsApi = {
  list: `${BASE}/public/organizations`,
  search: (q: string) => `${BASE}/public/organizations?search=${encodeURIComponent(q)}`,
};

/** Public subscription catalog for the marketing landing page (DB is source of truth). */
export const publicSubscriptionPlansApi = {
  list: `${BASE}/public/subscription-plans`,
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

// ─── Admissions CRM ─────────────────────────────────────────────────────────────
export const admissionsApi = {
  workspace: `${BASE}/admissions/workspace`,
  leads: `${BASE}/admissions/leads`,
  leadById: (id: number) => `${BASE}/admissions/leads/${id}`,
  applications: `${BASE}/admissions/applications`,
  applicationById: (id: number) => `${BASE}/admissions/applications/${id}`,
  followUps: `${BASE}/admissions/follow-ups`,
  reports: `${BASE}/admissions/reports`,
  settings: `${BASE}/admissions/workspace/settings`,
};

export const dashboardApi = {
  base: `${BASE}/dashboard`,
  summary: `${BASE}/dashboard/summary`,
  workspace: `${BASE}/dashboard/workspace`,
  search: `${BASE}/dashboard/search`,
};

export const profileApi = {
  me: `${BASE}/profile/me`,
  changePassword: `${BASE}/profile/me/change-password`,
};

export const workspaceApi = {
  organizations: `${BASE}/workspaces/organizations`,
  switch: `${BASE}/workspaces/switch`
};

export const onboardingApi = {
  checklist: `${BASE}/onboarding/checklist`
};

export const communicationApi = {
  notices: `${BASE}/communication/notices`,
  noticeById: (id: number) => `${BASE}/communication/notices/${id}`,
  publishNotice: (id: number) => `${BASE}/communication/notices/${id}/publish`,
  notifications: `${BASE}/communication/notifications`,
  messageThreads: `${BASE}/communication/messages/threads`,
  threadMessages: (threadId: number) => `${BASE}/communication/messages/threads/${threadId}`,
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
  customerDashboard: `${PLATFORM_BASE}/customers/dashboard`,
  customerMetadata: `${PLATFORM_BASE}/customers/metadata`,
  customerById: (id: number) => `${PLATFORM_BASE}/customers/${id}`,
  customerStatus: (id: number) => `${PLATFORM_BASE}/customers/${id}/status`,
  customerRestore: (id: number) => `${PLATFORM_BASE}/customers/${id}/restore`,
  customerPermanentDelete: (id: number) => `${PLATFORM_BASE}/customers/${id}/permanent`,
  customerOrganizations: (id: number) => `${PLATFORM_BASE}/customers/${id}/organizations`,
  customerContacts: (id: number) => `${PLATFORM_BASE}/customers/${id}/contacts`,
  customerContactById: (id: number) => `${PLATFORM_BASE}/customer-contacts/${id}`,
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
  provisionDomainAvailability: (subdomain: string) =>
    `${PLATFORM_BASE}/provision/domain-availability?subdomain=${encodeURIComponent(subdomain)}`,
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
