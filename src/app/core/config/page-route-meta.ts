/** Route `data` keys: breadcrumb, breadcrumbLink?, pageTitle?, pageSubtitle?, pageKind?, showBack?, hideBack?, backFallback? */

export const DASHBOARD_PAGE = {
  breadcrumb: 'Dashboard',
  pageTitle: 'Dashboard',
  pageSubtitle: 'Your operational snapshot for today.',
  pageKind: 'main',
  hideBack: true
} as const;

export const TENANT_MGMT_ROOT = {
  breadcrumb: 'Tenant Management',
  breadcrumbLink: ['/app/tenant-management/organizations']
} as const;

export const ACCESS_MGMT_ROOT = {
  breadcrumb: 'Access Management',
  breadcrumbLink: ['/app/access-management/users']
} as const;

export const ACADEMICS_ROOT = {
  breadcrumb: 'Academics',
  breadcrumbLink: ['/app/academics/overview']
} as const;

export const STUDENTS_ROOT = {
  breadcrumb: 'Students',
  breadcrumbLink: ['/app/students/directory']
} as const;

export const STAFF_ROOT = {
  breadcrumb: 'Staff',
  breadcrumbLink: ['/app/staff/directory']
} as const;

export const FEES_ROOT = {
  breadcrumb: 'Finance',
  breadcrumbLink: ['/app/fees']
} as const;

export const PAYROLL_ROOT = {
  breadcrumb: 'Payroll',
  breadcrumbLink: ['/app/payroll']
} as const;

export const EXPENSES_ROOT = {
  breadcrumb: 'Expenses',
  breadcrumbLink: ['/app/expenses']
} as const;

export const ADMISSIONS_ROOT = {
  breadcrumb: 'Admissions',
  breadcrumbLink: ['/app/admissions/leads']
} as const;

export const ATTENDANCE_ROOT = {
  breadcrumb: 'Attendance',
  breadcrumbLink: ['/app/attendance/students']
} as const;

export const COMMUNICATION_ROOT = {
  breadcrumb: 'Communication',
  breadcrumbLink: ['/app/communication/notices']
} as const;

export const ACADEMICS_PAGES = {
  overview: {
    breadcrumb: 'Overview',
    pageTitle: 'Overview',
    pageSubtitle: 'Real-time summary of your academic structure, setup and operational status.',
    pageKind: 'main',
    hideBack: true
  },
  academicYear: {
    breadcrumb: 'Academic Year',
    pageTitle: 'Academic Year',
    pageSubtitle: 'Manage academic sessions, year transitions and historical academic records.',
    pageKind: 'main',
    hideBack: true
  },
  classesSections: {
    breadcrumb: 'Classes & Sections',
    pageTitle: 'Classes & Sections',
    pageSubtitle: 'Manage your academic classes, sections, class teachers and student distribution.',
    pageKind: 'main',
    hideBack: true
  },
  classDetail: {
    breadcrumb: 'Class',
    breadcrumbLink: ['/app/academics/classes-sections'],
    pageTitle: 'Class Details',
    pageSubtitle: 'Sections, teachers and related academic setup for this class.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/academics/classes-sections'
  },
  subjectsMapping: {
    breadcrumb: 'Subjects',
    pageTitle: 'Subjects',
    pageSubtitle: 'Create and manage subjects and map them to classes.',
    pageKind: 'main',
    hideBack: true
  },
  subjectDetail: {
    breadcrumb: 'Subject',
    breadcrumbLink: ['/app/academics/subjects-mapping'],
    pageTitle: 'Subject Details',
    pageSubtitle: 'Subject information and class mappings.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/academics/subjects-mapping'
  },
  classSubjects: {
    breadcrumb: 'Subject Mapping',
    breadcrumbLink: ['/app/academics/classes-sections'],
    pageTitle: 'Subject Mapping',
    pageSubtitle: 'Subjects taught in this class and how they are mapped.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/academics/classes-sections'
  },
  teacherAllocation: {
    breadcrumb: 'Teacher Allocation',
    pageTitle: 'Teacher Allocation',
    pageSubtitle: 'Assign teachers to every class, section and subject combination.',
    pageKind: 'main',
    hideBack: true
  },
  timetable: {
    breadcrumb: 'Timetable',
    pageTitle: 'Timetable',
    pageSubtitle: 'Configure periods, generate the weekly timetable and resolve conflicts.',
    pageKind: 'main',
    hideBack: true
  },
  academicCalendar: {
    breadcrumb: 'Academic Calendar',
    pageTitle: 'Academic Calendar',
    pageSubtitle: 'Plan, manage and publish important dates, holidays and events for the academic year.',
    pageKind: 'main',
    hideBack: true
  },
  calendarEventDetail: {
    breadcrumb: 'Event',
    breadcrumbLink: ['/app/academics/academic-calendar'],
    pageTitle: 'Event Details',
    pageSubtitle: 'Event information and visibility.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/academics/academic-calendar'
  },
  myClasses: {
    breadcrumb: 'My Classes',
    pageTitle: 'My Classes',
    pageSubtitle: 'Classes and sections assigned to you.',
    pageKind: 'main',
    hideBack: true
  },
  myTimetable: {
    breadcrumb: 'My Timetable',
    pageTitle: 'My Timetable',
    pageSubtitle: 'Your weekly teaching schedule.',
    pageKind: 'main',
    hideBack: true
  },
  academicStructure: {
    breadcrumb: 'Academic Structure',
    pageTitle: 'Academic Structure',
    pageSubtitle: 'Stages, classes, sections and subject relationships across the school.',
    pageKind: 'main',
    hideBack: true
  },
  myAcademics: {
    breadcrumb: 'My Academics',
    pageTitle: 'My Academics',
    pageSubtitle: 'Your class, section, subjects and timetable for the current academic year.',
    pageKind: 'main',
    hideBack: true
  }
} as const;

export const TENANT_PAGES = {
  dashboard: {
    breadcrumb: 'Dashboard',
    pageTitle: 'Dashboard',
    pageSubtitle: 'ThinkersCave platform-wide overview for super administrators',
    pageKind: 'main',
    hideBack: true
  },
  customers: {
    breadcrumb: 'Customers',
    pageTitle: 'Customers',
    pageSubtitle: 'Manage customer accounts and their organizations.',
    pageKind: 'main',
    hideBack: true
  },
  customersNew: {
    breadcrumb: 'Create Customer',
    pageTitle: 'Create Customer',
    pageSubtitle: 'Create a customer account that can own one or more organizations.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/tenant-management/customers'
  },
  customersArchived: {
    breadcrumb: 'Archived Customers',
    pageTitle: 'Archived Customers',
    pageSubtitle: 'Review, restore, or permanently remove archived customer accounts',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/tenant-management/customers'
  },
  customersEdit: {
    breadcrumb: 'Edit Customer',
    pageTitle: 'Edit Customer',
    pageSubtitle: 'Update account owner details for this customer.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/tenant-management/customers'
  },
  customerDetails: {
    breadcrumb: 'Customer Details',
    pageTitle: 'Customer Details',
    pageSubtitle: 'Account owner, organizations and subscription status.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/tenant-management/customers'
  },
  organizations: {
    breadcrumb: 'Organizations',
    pageTitle: 'Organizations',
    pageSubtitle: 'Manage customer organizations and tenant workspaces',
    pageKind: 'main',
    hideBack: true
  },
  organizationsCreate: {
    breadcrumb: 'Add Organization',
    pageTitle: 'Add Organization',
    pageSubtitle: 'Create a new organization under a customer account.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/tenant-management/organizations'
  },
  organizationDetails: {
    breadcrumb: 'Organization Details',
    pageTitle: 'Organization Details',
    pageSubtitle: 'Tenant workspace, subscription and operations.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/tenant-management/organizations'
  },
  subscriptionPlans: {
    breadcrumb: 'Subscription Plans',
    pageTitle: 'Subscription Plans',
    pageSubtitle: 'Manage commercial plans, limits and bundled modules',
    pageKind: 'main',
    hideBack: true
  },
  promotions: {
    breadcrumb: 'Promotions',
    pageTitle: 'Promotions',
    pageSubtitle: 'Manage discount codes and commercial offers for subscriptions',
    pageKind: 'main',
    hideBack: true
  },
  menuManagement: {
    breadcrumb: 'Menu Management',
    pageTitle: 'Menu Management',
    pageSubtitle: 'Create single-page menus or groups with submenus.',
    pageKind: 'main',
    hideBack: true
  },
  roleManagement: {
    breadcrumb: 'Role Management',
    pageTitle: 'Role Management',
    pageSubtitle: 'Platform roles used across tenants.',
    pageKind: 'main',
    hideBack: true
  },
  featureCatalog: {
    breadcrumb: 'Feature Catalog',
    pageTitle: 'Feature Catalog',
    pageSubtitle: 'Product features, menus and tenant entitlements.',
    pageKind: 'main',
    hideBack: true
  },
  tenantHealth: {
    breadcrumb: 'Tenant Health',
    pageTitle: 'Tenant Health',
    pageSubtitle: 'Monitor tenant infrastructure, schema versions and storage',
    pageKind: 'main',
    hideBack: true
  },
  migrationCenter: {
    breadcrumb: 'Migration Center',
    pageTitle: 'Migration Center',
    pageSubtitle: 'Monitor tenant provisioning jobs and schema migrations',
    pageKind: 'main',
    hideBack: true
  },
  auditCenter: {
    breadcrumb: 'Audit Center',
    pageTitle: 'Audit Center',
    pageSubtitle: 'Every meaningful action across tenants, users and security — searchable, filterable and exportable.',
    pageKind: 'main',
    hideBack: true
  }
} as const;

export const ACCESS_PAGES = {
  dashboard: {
    breadcrumb: 'Overview',
    pageTitle: 'Overview',
    pageSubtitle: 'Users, responsibilities and security for your organization',
    pageKind: 'main',
    hideBack: true
  },
  roles: {
    breadcrumb: 'Roles & Responsibilities',
    pageTitle: 'Roles & Responsibilities',
    pageSubtitle: 'Define organizational roles and assign menu permissions',
    pageKind: 'main',
    hideBack: true
  },
  roleWorkspace: {
    breadcrumb: 'Role Workspace',
    pageTitle: 'Role Workspace',
    pageSubtitle: 'Role details and menu/submenu assignment for this organization.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/access-management/roles'
  },
  featureCatalog: {
    breadcrumb: 'Feature Catalog',
    pageTitle: 'Feature Catalog',
    pageSubtitle: 'Features and menus included in this school’s plan. Assign these to responsibilities.',
    pageKind: 'main',
    hideBack: true
  },
  responsibilities: {
    breadcrumb: 'Responsibilities',
    pageTitle: 'Responsibilities',
    pageSubtitle: 'Default and custom duties. Click a name to assign staff and menus.',
    pageKind: 'main',
    hideBack: true
  },
  responsibilityWorkspace: {
    breadcrumb: 'Responsibility',
    pageTitle: 'Responsibility',
    pageSubtitle: 'Details, assigned staff, and the menus this responsibility can use.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/access-management/responsibilities'
  },
  users: {
    breadcrumb: 'Users',
    pageTitle: 'Users',
    pageSubtitle: 'Click a person to open their account, lock status, assigned menus and sign-in history.',
    pageKind: 'main',
    hideBack: true
  },
  userPermissions: {
    breadcrumb: 'User access',
    pageTitle: 'User Access',
    pageSubtitle: 'Account, assigned menus and sign-in activity for this person.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/access-management/users'
  },
  securityPolicy: {
    breadcrumb: 'Security Policy',
    pageTitle: 'Security Policy',
    pageSubtitle: 'Password, lockout and session rules for this organization.',
    pageKind: 'main',
    hideBack: true
  },
  loginHistory: {
    breadcrumb: 'Login History',
    pageTitle: 'Login History',
    pageSubtitle: 'Sign-ins from the last 7 or 30 days. Older events are not kept.',
    pageKind: 'main',
    hideBack: true
  }
} as const;

export const STUDENTS_PAGES = {
  directory: {
    breadcrumb: 'Directory',
    pageTitle: 'Students',
    pageSubtitle: 'Manage student records, enrollment status and academic placement.',
    pageKind: 'main',
    hideBack: true
  },
  alumni: {
    breadcrumb: 'Alumni',
    pageTitle: 'Alumni',
    pageSubtitle: 'Stay connected with your past graduates.',
    pageKind: 'main',
    hideBack: true
  },
  addStudent: {
    breadcrumb: 'Add Student',
    pageTitle: 'Add Student',
    pageSubtitle: 'Create a student record with personal, academic and guardian details.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/students/directory'
  },
  profile: {
    breadcrumb: 'Student Profile',
    pageTitle: 'Student Profile',
    pageSubtitle: 'Academic, personal and family information for this student.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/students/directory'
  }
} as const;

export const STAFF_PAGES = {
  directory: {
    breadcrumb: 'Directory',
    pageTitle: 'Staff',
    pageSubtitle: 'Manage teaching and non-teaching staff across the organization.',
    pageKind: 'main',
    hideBack: true
  },
  leave: {
    breadcrumb: 'Leave & Availability',
    pageTitle: 'Leave & Availability',
    pageSubtitle: 'Manage leave requests, approvals, and staff availability.',
    pageKind: 'main',
    hideBack: true
  },
  create: {
    breadcrumb: 'Create Staff',
    pageTitle: 'Create Staff',
    pageSubtitle: 'Add a new staff member to the organization.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/staff/directory'
  },
  edit: {
    breadcrumb: 'Edit Staff',
    pageTitle: 'Edit Staff',
    pageSubtitle: 'Update staff member details.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/staff/directory'
  },
  profile: {
    breadcrumb: 'Staff Profile',
    pageTitle: 'Staff Profile',
    pageSubtitle: 'Employment, contact and responsibility details for this staff member.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/staff/directory'
  }
} as const;

export const FEES_PAGES = {
  dashboard: {
    breadcrumb: 'Dashboard',
    pageTitle: 'Fees',
    pageSubtitle: 'Manage fee heads, structures, collections and outstanding balances.',
    pageKind: 'main',
    hideBack: true
  },
  heads: {
    breadcrumb: 'Fee Heads',
    pageTitle: 'Fee Heads',
    pageSubtitle: 'Manage the types of fees used in fee structures.',
    pageKind: 'main',
    hideBack: true
  },
  structures: {
    breadcrumb: 'Fee Structures',
    pageTitle: 'Fee Structures',
    pageSubtitle: 'Configure class-wise fee structures for the selected academic year.',
    pageKind: 'main',
    hideBack: true
  },
  structureClass: {
    breadcrumb: 'Class Fee Structure',
    pageTitle: 'Class Fee Structure',
    pageSubtitle: 'View and configure fee structure for this class.',
    pageKind: 'detail',
    hideBack: true,
    backFallback: '/app/fees/structures'
  },
  students: {
    breadcrumb: 'Student Fee',
    pageTitle: 'Student Fee',
    pageSubtitle: 'View fee status, payment history and receipts for your access scope.',
    pageKind: 'main',
    hideBack: true
  },
  studentDetail: {
    breadcrumb: 'Student Fee',
    pageTitle: 'Student Fee',
    pageSubtitle: 'View fee status, payment history and receipts for this student.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/fees/students'
  },
  receipts: {
    breadcrumb: 'Receipts',
    pageTitle: 'Receipts',
    pageSubtitle: 'Search, preview and download immutable fee receipts.',
    pageKind: 'main',
    hideBack: true
  },
  outstanding: {
    breadcrumb: 'Outstanding',
    pageTitle: 'Outstanding',
    pageSubtitle: 'Track dues, partially paid and overdue balances.',
    pageKind: 'main',
    hideBack: true
  },
  reports: {
    breadcrumb: 'Reports',
    pageTitle: 'Finance Reports',
    pageSubtitle: 'Complete financial overview of your organization',
    pageKind: 'main',
    hideBack: true
  },
  settings: {
    breadcrumb: 'Settings',
    pageTitle: 'Settings',
    pageSubtitle: 'Fee generation, reminders, payment methods, and payroll configuration.',
    pageKind: 'main',
    hideBack: true
  }
} as const;

export const PAYROLL_PAGES = {
  dashboard: {
    breadcrumb: 'Dashboard',
    pageTitle: 'Payroll',
    pageSubtitle: 'Generate payroll, manage employee salaries, and record payments.',
    pageKind: 'main',
    hideBack: true
  },
  components: {
    breadcrumb: 'Components',
    pageTitle: 'Components',
    pageSubtitle: 'Salary components used in structures and employee salary.',
    pageKind: 'main',
    hideBack: true
  },
  structures: {
    breadcrumb: 'Structures',
    pageTitle: 'Structures',
    pageSubtitle: 'Reusable salary templates applied to employees.',
    pageKind: 'main',
    hideBack: true
  },
  employeeSalary: {
    breadcrumb: 'Employee Salary',
    pageTitle: 'Employee Salary',
    pageSubtitle: 'Employee salary configuration and history.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/payroll'
  },
  runDetail: {
    breadcrumb: 'Payroll Run',
    pageTitle: 'Payroll Run',
    pageSubtitle: 'Payroll run detail',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/payroll'
  },
  myPayroll: {
    breadcrumb: 'My Payroll',
    pageTitle: 'My Payroll',
    pageSubtitle: 'Your salary summary, payslips, and payment history — amounts stay private until you reveal them.',
    pageKind: 'main',
    hideBack: true
  }
} as const;

export const EXPENSES_PAGES = {
  dashboard: {
    breadcrumb: 'Dashboard',
    pageTitle: 'Expenses',
    pageSubtitle: "Manage and track your organization's operational expenses",
    pageKind: 'main',
    hideBack: true
  },
  heads: {
    breadcrumb: 'Expense Heads',
    pageTitle: 'Expense Heads',
    pageSubtitle: 'Organization-managed expense classification for operational spending',
    pageKind: 'main',
    hideBack: true
  },
  detail: {
    breadcrumb: 'Expense Detail',
    pageTitle: 'Expense Detail',
    pageSubtitle: 'Expense detail',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/expenses'
  }
} as const;

export const ADMISSIONS_PAGES = {
  leads: {
    breadcrumb: 'Leads',
    pageTitle: 'Leads',
    pageSubtitle: 'Manage prospective students and families from first enquiry to application.',
    pageKind: 'main',
    hideBack: true
  },
  followUps: {
    breadcrumb: 'Follow-ups',
    pageTitle: 'Follow-ups',
    pageSubtitle: 'Your counselor work queue — planned follow-ups for leads assigned to you.',
    pageKind: 'main',
    hideBack: true
  },
  applications: {
    breadcrumb: 'Applications',
    pageTitle: 'Applications',
    pageSubtitle: 'Review submitted applications and move candidates through enrolment.',
    pageKind: 'main',
    hideBack: true
  },
  settings: {
    breadcrumb: 'Settings',
    pageTitle: 'Settings',
    pageSubtitle: 'Configure documents and counselor assignment for this school.',
    pageKind: 'main',
    hideBack: true
  },
  reports: {
    breadcrumb: 'Reports',
    pageTitle: 'Reports',
    pageSubtitle: 'Complete overview of your admission process from inquiries to enrollment.',
    pageKind: 'main',
    hideBack: true
  },
  lead: {
    breadcrumb: 'Lead',
    pageTitle: 'Lead Details',
    pageSubtitle: 'Enquiry details, follow-ups and application progress.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/admissions/leads'
  },
  form: {
    breadcrumb: 'Application Form',
    pageTitle: 'Application Form',
    pageSubtitle: 'Capture applicant details for this admission.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/admissions/applications'
  },
  review: {
    breadcrumb: 'Application Review',
    pageTitle: 'Application Review',
    pageSubtitle: 'Summary, documents and decision actions for this application.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/admissions/applications'
  }
} as const;

export const ATTENDANCE_PAGES = {
  students: {
    breadcrumb: 'Student Attendance',
    pageTitle: 'Student Attendance',
    pageSubtitle: 'Mark and review student attendance by class and date.',
    pageKind: 'main',
    hideBack: true
  },
  staff: {
    breadcrumb: 'Staff Attendance',
    pageTitle: 'Staff Attendance',
    pageSubtitle: 'Mark and review staff attendance.',
    pageKind: 'main',
    hideBack: true
  },
  reports: {
    breadcrumb: 'Attendance Reports',
    pageTitle: 'Attendance Reports',
    pageSubtitle: 'Attendance summaries and exception reports.',
    pageKind: 'main',
    hideBack: true
  },
  calendar: {
    breadcrumb: 'Attendance Calendar',
    pageTitle: 'Attendance Calendar',
    pageSubtitle: 'Calendar view of attendance across the academic year.',
    pageKind: 'main',
    hideBack: true
  },
  settings: {
    breadcrumb: 'Attendance Settings',
    pageTitle: 'Attendance Settings',
    pageSubtitle: 'Configure attendance rules and working days.',
    pageKind: 'main',
    hideBack: true
  }
} as const;

export const COMMUNICATION_PAGES = {
  notices: {
    breadcrumb: 'Notices',
    pageTitle: 'Notices',
    pageSubtitle: 'Publish announcements to students, staff and parents.',
    pageKind: 'main',
    hideBack: true
  },
  announcements: {
    breadcrumb: 'Announcements',
    pageTitle: 'Announcements',
    pageSubtitle: 'Broadcast updates across the school community.',
    pageKind: 'main',
    hideBack: true
  },
  announcementsNew: {
    breadcrumb: 'Create Announcement',
    pageTitle: 'Create Announcement',
    pageSubtitle: 'Compose, target and schedule an announcement.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/communication/announcements'
  },
  announcementDetail: {
    breadcrumb: 'Announcement',
    pageTitle: 'Announcement',
    pageSubtitle: 'Delivery report and recipient breakdown',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/communication/announcements'
  },
  conversations: {
    breadcrumb: 'Conversations',
    pageTitle: 'Conversations',
    pageSubtitle: 'Messages between staff, parents and students.',
    pageKind: 'main',
    hideBack: true
  },
  templates: {
    breadcrumb: 'Templates',
    pageTitle: 'Templates',
    pageSubtitle: 'Reusable message templates for school communication.',
    pageKind: 'main',
    hideBack: true
  },
  templateEdit: {
    breadcrumb: 'Edit Template',
    pageTitle: 'Edit Template',
    pageSubtitle: 'Update this communication template.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/communication/templates'
  },
  deliveryLogs: {
    breadcrumb: 'Delivery Logs',
    pageTitle: 'Delivery Logs',
    pageSubtitle: 'Track sent messages and delivery status.',
    pageKind: 'main',
    hideBack: true
  }
} as const;

export const ORG_PROFILE_PAGES = {
  profile: {
    breadcrumb: 'Organization Profile',
    pageTitle: 'Organization Profile',
    pageSubtitle: "Manage your institution's profile, contact details, and branding",
    pageKind: 'main',
    hideBack: true
  },
  activityLogs: {
    breadcrumb: 'Activity Logs',
    pageTitle: 'Activity Logs',
    pageSubtitle: 'Recent organization activity and audit events.',
    pageKind: 'main',
    hideBack: true
  }
} as const;

export const USER_PROFILE_PAGE = {
  breadcrumb: 'My Profile',
  pageTitle: 'My Profile',
  pageSubtitle: 'Personal information, security and quick links',
  pageKind: 'detail',
  showBack: true,
  backFallback: '/app'
} as const;

export const PROMOTION_PAGES = {
  batches: {
    breadcrumb: 'Promotion Batches',
    pageTitle: 'Promotion Batches',
    pageSubtitle: 'Promote students from one academic year to the next.',
    pageKind: 'main',
    hideBack: true
  },
  batchNew: {
    breadcrumb: 'New Promotion Batch',
    pageTitle: 'New Promotion Batch',
    pageSubtitle: 'Create a draft batch, then preview and execute from the list.',
    pageKind: 'detail',
    showBack: true,
    backFallback: '/app/promotions'
  },
  transfers: {
    breadcrumb: 'Transfer Requests',
    pageTitle: 'Transfer Requests',
    pageSubtitle: 'Manage student transfer certificates and exit workflows.',
    pageKind: 'main',
    hideBack: true
  }
} as const;

export const EXAM_PAGES = {
  list: {
    breadcrumb: 'Exams',
    pageTitle: 'Exams',
    pageSubtitle: 'Schedule exams, capture marks and publish results.',
    pageKind: 'main',
    hideBack: true
  }
} as const;

export const ENROLLMENT_PAGES = {
  list: {
    breadcrumb: 'Enrollments',
    pageTitle: 'Enrollments',
    pageSubtitle: 'Track student enrolment status and academic placement.',
    pageKind: 'main',
    hideBack: true
  }
} as const;
