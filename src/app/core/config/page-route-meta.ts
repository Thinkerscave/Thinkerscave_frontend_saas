/** Route `data` keys: breadcrumb, breadcrumbLink?, pageSubtitle? */

export const TENANT_MGMT_ROOT = {
  breadcrumb: 'Tenant Management',
  breadcrumbLink: ['/app/tenant-management/dashboard']
} as const;

export const ACCESS_MGMT_ROOT = {
  breadcrumb: 'Access Management',
  breadcrumbLink: ['/app/access-management/dashboard']
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
    breadcrumb: 'Subjects & Mapping',
    pageSubtitle: 'Define subjects and map them to the classes that teach them.'
  },
  teacherAllocation: {
    breadcrumb: 'Teacher Allocation',
    pageSubtitle: 'Assign teachers to every class, section and subject combination.'
  },
  timetable: {
    breadcrumb: 'Timetable',
    pageSubtitle: 'Configure periods, generate the weekly timetable and resolve conflicts.'
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
  featureCatalog: {
    breadcrumb: 'Feature Catalog',
    pageSubtitle: 'Master catalogue of platform modules and entitlements'
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
    breadcrumb: 'Dashboard',
    pageSubtitle: 'Roles, menus, user permissions and security policy for your organization'
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
    pageSubtitle: 'Organization navigation modules and pages'
  },
  users: {
    breadcrumb: 'Users & Access',
    pageSubtitle: 'Manage user accounts, roles and permission overrides'
  },
  userPermissions: {
    breadcrumb: 'User Permissions',
    pageSubtitle: 'Custom permissions applied on top of role defaults'
  },
  securityPolicy: {
    breadcrumb: 'Security Policy',
    pageSubtitle: 'Password complexity, lockout rules and session controls'
  },
  loginHistory: {
    breadcrumb: 'Login History',
    pageSubtitle: 'Sign-in audit trail for your organization'
  }
} as const;
