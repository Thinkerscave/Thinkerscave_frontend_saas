/** Route `data` keys: breadcrumb, breadcrumbLink?, pageSubtitle? */

export const TENANT_MGMT_ROOT = {
  breadcrumb: 'Tenant Management',
  breadcrumbLink: ['/app']
} as const;

export const ACCESS_MGMT_ROOT = {
  breadcrumb: 'Access Management',
  breadcrumbLink: ['/app/access-management/users']
} as const;

export const ACADEMICS_ROOT = {
  breadcrumb: 'Academics',
  breadcrumbLink: ['/app/academics/overview']
} as const;

export const ACADEMICS_PAGES = {
  overview: {
    breadcrumb: 'Overview',
    pageSubtitle: 'Real-time summary of your academic structure, setup and operational status.'
  },
  academicYear: {
    breadcrumb: 'Academic Year',
    pageSubtitle: 'Manage academic sessions, year transitions and historical academic records.'
  },
  classesSections: {
    breadcrumb: 'Classes & Sections',
    pageSubtitle: 'Manage your academic classes, sections, class teachers and student distribution.'
  },
  classDetail: {
    breadcrumb: 'Class',
    breadcrumbLink: ['/app/academics/classes-sections'],
    pageSubtitle: 'Sections, teachers and related academic setup for this class.'
  },
  subjectsMapping: {
    breadcrumb: 'Subjects',
    pageSubtitle: 'Create and manage subjects and map them to classes.'
  },
  subjectDetail: {
    breadcrumb: 'Subject',
    breadcrumbLink: ['/app/academics/subjects-mapping'],
    pageSubtitle: 'Subject information and class mappings.'
  },
  classSubjects: {
    breadcrumb: 'Subject Mapping',
    breadcrumbLink: ['/app/academics/classes-sections'],
    pageSubtitle: 'Subjects taught in this class and how they are mapped.'
  },
  teacherAllocation: {
    breadcrumb: 'Teacher Allocation',
    pageSubtitle: 'Assign teachers to every class, section and subject combination.'
  },
  timetable: {
    breadcrumb: 'Timetable',
    pageSubtitle: 'Configure periods, generate the weekly timetable and resolve conflicts.'
  },
  academicCalendar: {
    breadcrumb: 'Academic Calendar',
    pageSubtitle: 'Plan, manage and publish important dates, holidays and events for the academic year.'
  },
  calendarEventDetail: {
    breadcrumb: 'Event',
    breadcrumbLink: ['/app/academics/academic-calendar'],
    pageSubtitle: 'Event information and visibility.'
  },
  myClasses: {
    breadcrumb: 'My Classes',
    pageSubtitle: 'Classes and sections assigned to you.'
  },
  myTimetable: {
    breadcrumb: 'My Timetable',
    pageSubtitle: 'Your weekly teaching schedule.'
  },
  academicStructure: {
    breadcrumb: 'Academic Structure',
    pageSubtitle: 'Stages, classes, sections and subject relationships across the school.'
  },
  myAcademics: {
    breadcrumb: 'My Academics',
    pageSubtitle: 'Your class, section, subjects and timetable for the current academic year.'
  }
} as const;

export const TENANT_PAGES = {
  dashboard: {
    breadcrumb: 'Dashboard',
    pageSubtitle: 'ThinkersCave platform-wide overview for super administrators'
  },
  customers: {
    breadcrumb: 'Customers',
    pageSubtitle: 'Manage customer accounts and their organizations.'
  },
  customersNew: {
    breadcrumb: 'Create Customer',
    breadcrumbLink: ['/app/tenant-management/customers/new'],
    pageSubtitle: 'Create a customer account that can own one or more organizations.'
  },
  customersArchived: {
    breadcrumb: 'Archived Customers',
    breadcrumbLink: ['/app/tenant-management/customers/archived'],
    pageSubtitle: 'Review, restore, or permanently remove archived customer accounts'
  },
  customersEdit: {
    breadcrumb: 'Edit Customer',
    pageSubtitle: 'Update account owner details for this customer.'
  },
  customerDetails: {
    breadcrumb: 'Customer Details'
  },
  organizations: {
    breadcrumb: 'Organizations',
    pageSubtitle: 'Manage customer organizations and tenant workspaces'
  },
  organizationsCreate: {
    breadcrumb: 'Add Organization',
    breadcrumbLink: ['/app/tenant-management/organizations/create'],
    pageSubtitle: 'Create a new organization under a customer account.'
  },
  organizationDetails: {
    breadcrumb: 'Organization Details'
  },
  subscriptionPlans: {
    breadcrumb: 'Subscription Plans',
    pageSubtitle: 'Manage commercial plans, limits and bundled modules'
  },
  promotions: {
    breadcrumb: 'Promotions',
    pageSubtitle: 'Manage discount codes and commercial offers for subscriptions'
  },
  menuManagement: {
    breadcrumb: 'Menu Management',
    pageSubtitle: 'Create single-page menus or groups with submenus.'
  },
  roleManagement: {
    breadcrumb: 'Role Management',
    pageSubtitle: 'Platform roles used across tenants.'
  },
  featureCatalog: {
    breadcrumb: 'Feature Catalog',
    pageSubtitle: 'Product features, menus and tenant entitlements.'
  },
  tenantHealth: {
    breadcrumb: 'Tenant Health',
    pageSubtitle: 'Monitor tenant infrastructure, schema versions and storage'
  },
  migrationCenter: {
    breadcrumb: 'Migration Center',
    pageSubtitle: 'Monitor tenant provisioning jobs and schema migrations'
  },
  auditCenter: {
    breadcrumb: 'Audit Center',
    pageSubtitle: 'Every meaningful action across tenants, users and security — searchable, filterable and exportable.'
  }
} as const;

export const ACCESS_PAGES = {
  dashboard: {
    breadcrumb: 'Overview',
    pageSubtitle: 'Users, responsibilities and security for your organization'
  },
  roles: {
    breadcrumb: 'Roles & Responsibilities',
    pageSubtitle: 'Define organizational roles and assign menu permissions'
  },
  roleWorkspace: {
    breadcrumb: 'Role Workspace'
  },
  menus: {
    breadcrumb: 'Menu Catalog',
    pageSubtitle: 'Features and menus included in this school’s plan. Assign these to responsibilities.'
  },
  responsibilities: {
    breadcrumb: 'Responsibilities',
    pageSubtitle: 'Default and custom duties. Click a name to assign staff and menus.'
  },
  responsibilityWorkspace: {
    breadcrumb: 'Responsibility',
    breadcrumbLink: ['/app/access-management/responsibilities'],
    pageSubtitle: 'Details, assigned staff, and the menus this responsibility can use.'
  },
  users: {
    breadcrumb: 'Users',
    pageSubtitle: 'Click a person to open their account, lock status, assigned menus and sign-in history.'
  },
  userPermissions: {
    breadcrumb: 'User access',
    breadcrumbLink: ['/app/access-management/users'],
    pageSubtitle: 'Account, assigned menus and sign-in activity for this person.'
  },
  securityPolicy: {
    breadcrumb: 'Security Policy',
    pageSubtitle: 'Password, lockout and session rules for this organization.'
  },
  loginHistory: {
    breadcrumb: 'Login History',
    pageSubtitle: 'Sign-ins from the last 7 or 30 days. Older events are not kept.'
  }
} as const;
