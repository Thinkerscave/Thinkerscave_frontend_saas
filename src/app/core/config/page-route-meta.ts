/** Route `data` keys: breadcrumb, breadcrumbLink?, pageSubtitle? */

export const TENANT_MGMT_ROOT = {
  breadcrumb: 'Tenant Management',
  breadcrumbLink: ['/app/tenant-management/dashboard']
} as const;

export const ACCESS_MGMT_ROOT = {
  breadcrumb: 'Access Management',
  breadcrumbLink: ['/app/access-management/dashboard']
} as const;

export const TENANT_PAGES = {
  dashboard: {
    breadcrumb: 'Dashboard',
    pageSubtitle: 'ThinkersCave platform-wide overview for super administrators'
  },
  customers: {
    breadcrumb: 'Customers',
    pageSubtitle: 'Commercial relationships between ThinkerScave and education groups'
  },
  customersNew: {
    breadcrumb: 'New Customer',
    breadcrumbLink: ['/app/tenant-management/customers/new'],
    pageSubtitle: 'Capture business profile, contacts, and commercial details for a platform customer'
  },
  customersArchived: {
    breadcrumb: 'Archived Customers',
    breadcrumbLink: ['/app/tenant-management/customers/archived'],
    pageSubtitle: 'Review, restore, or permanently remove archived customer accounts'
  },
  customersEdit: {
    breadcrumb: 'Edit Customer',
    pageSubtitle: 'Update business profile, contacts, and commercial details'
  },
  customerDetails: {
    breadcrumb: 'Customer Details'
  },
  organizations: {
    breadcrumb: 'Organizations',
    pageSubtitle: 'Manage customer organizations and tenant workspaces'
  },
  organizationsCreate: {
    breadcrumb: 'Provision Organization',
    breadcrumbLink: ['/app/tenant-management/organizations/create'],
    pageSubtitle: 'Guided wizard to onboard a new tenant with subscription, features, and commercials'
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
