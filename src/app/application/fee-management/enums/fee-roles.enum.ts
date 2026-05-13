/**
 * Fee Management Roles
 * Strict role segregation as per system governance
 * 
 * CRITICAL: Role-based access is NON-NEGOTIABLE
 * Each role has specific permissions that CANNOT be bypassed
 */
export enum FeeRole {
    // Governance & Oversight
    INSTITUTION_OWNER = 'INSTITUTION_OWNER',   // Read-only dashboards & reports
    SUPER_ADMIN = 'SUPER_ADMIN',               // System-wide read-only audit access
    AUDITOR = 'AUDITOR',                       // Read-only audit trail access

    // Configuration & Setup
    INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',   // Fee setup, structure mapping

    // Financial Operations
    ACCOUNTANT = 'ACCOUNTANT',                 // Full payment, adjustment, reconciliation
    FINANCE_OFFICER = 'FINANCE_OFFICER',       // Same as Accountant

    // Collection Point
    FRONT_DESK = 'FRONT_DESK',                 // Payment collection only
    CASHIER = 'CASHIER',                       // Payment collection only

    // Stakeholders
    PARENT = 'PARENT',                         // View fees, make online payments
    GUARDIAN = 'GUARDIAN',                     // View fees, make online payments
    STUDENT = 'STUDENT'                        // Read-only fee visibility
}

/**
 * Role Permission Matrix
 * Maps each role to allowed actions
 */
export const FEE_ROLE_PERMISSIONS: Record<FeeRole, FeePermission[]> = {
    [FeeRole.INSTITUTION_OWNER]: [
        'VIEW_DASHBOARD',
        'VIEW_REPORTS',
        'VIEW_ANALYTICS'
    ],
    [FeeRole.SUPER_ADMIN]: [
        'VIEW_DASHBOARD',
        'VIEW_REPORTS',
        'VIEW_AUDIT_LOGS',
        'VIEW_ANALYTICS'
    ],
    [FeeRole.AUDITOR]: [
        'VIEW_AUDIT_LOGS',
        'VIEW_REPORTS',
        'VIEW_LEDGER'
    ],
    [FeeRole.INSTITUTION_ADMIN]: [
        // Dashboard & Analytics
        'VIEW_DASHBOARD',
        'VIEW_ANALYTICS',
        // Configuration
        'CONFIGURE_FEE_POLICY',
        'MANAGE_FEE_HEADS',
        'MANAGE_FEE_GROUPS',
        'MANAGE_FEE_STRUCTURE',
        // Contract & Ledger
        'GENERATE_CONTRACTS',
        'VIEW_LEDGER',
        'VIEW_FEE_DETAILS',
        // Payments
        'COLLECT_PAYMENT',
        'RECONCILE_PAYMENTS',
        // Receipts
        'GENERATE_RECEIPT',
        'DOWNLOAD_RECEIPT',
        // Adjustments
        'CREATE_ADJUSTMENT',
        'APPROVE_ADJUSTMENT',
        // Reports & Audit
        'VIEW_REPORTS',
        'VIEW_AUDIT_LOGS'
    ],
    [FeeRole.ACCOUNTANT]: [
        'VIEW_DASHBOARD',
        'COLLECT_PAYMENT',
        'VIEW_LEDGER',
        'GENERATE_RECEIPT',
        'CREATE_ADJUSTMENT',
        'APPROVE_ADJUSTMENT',
        'VIEW_REPORTS',
        'RECONCILE_PAYMENTS'
    ],
    [FeeRole.FINANCE_OFFICER]: [
        'VIEW_DASHBOARD',
        'COLLECT_PAYMENT',
        'VIEW_LEDGER',
        'GENERATE_RECEIPT',
        'CREATE_ADJUSTMENT',
        'APPROVE_ADJUSTMENT',
        'VIEW_REPORTS',
        'RECONCILE_PAYMENTS'
    ],
    [FeeRole.FRONT_DESK]: [
        'VIEW_DASHBOARD',
        'COLLECT_PAYMENT',
        'VIEW_LEDGER',
        'GENERATE_RECEIPT'
    ],
    [FeeRole.CASHIER]: [
        'COLLECT_PAYMENT',
        'GENERATE_RECEIPT'
    ],
    [FeeRole.PARENT]: [
        'VIEW_FEE_DETAILS',
        'VIEW_LEDGER',
        'MAKE_ONLINE_PAYMENT',
        'DOWNLOAD_RECEIPT'
    ],
    [FeeRole.GUARDIAN]: [
        'VIEW_FEE_DETAILS',
        'VIEW_LEDGER',
        'MAKE_ONLINE_PAYMENT',
        'DOWNLOAD_RECEIPT'
    ],
    [FeeRole.STUDENT]: [
        'VIEW_FEE_DETAILS',
        'VIEW_LEDGER',
        'DOWNLOAD_RECEIPT'
    ]
};

/**
 * Fee Permissions - Granular action-level permissions
 */
export type FeePermission =
    // Dashboard & Analytics
    | 'VIEW_DASHBOARD'
    | 'VIEW_ANALYTICS'

    // Configuration
    | 'CONFIGURE_FEE_POLICY'
    | 'MANAGE_FEE_HEADS'
    | 'MANAGE_FEE_GROUPS'
    | 'MANAGE_FEE_STRUCTURE'

    // Contract & Ledger
    | 'GENERATE_CONTRACTS'
    | 'VIEW_LEDGER'
    | 'VIEW_FEE_DETAILS'

    // Payments
    | 'COLLECT_PAYMENT'
    | 'MAKE_ONLINE_PAYMENT'
    | 'RECONCILE_PAYMENTS'

    // Receipts
    | 'GENERATE_RECEIPT'
    | 'DOWNLOAD_RECEIPT'

    // Adjustments
    | 'CREATE_ADJUSTMENT'
    | 'APPROVE_ADJUSTMENT'

    // Reports & Audit
    | 'VIEW_REPORTS'
    | 'VIEW_AUDIT_LOGS';

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: FeeRole, permission: FeePermission): boolean {
    const permissions = FEE_ROLE_PERMISSIONS[role];
    return permissions?.includes(permission) ?? false;
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: FeeRole, permissions: FeePermission[]): boolean {
    return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: FeeRole, permissions: FeePermission[]): boolean {
    return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: FeeRole): FeePermission[] {
    return FEE_ROLE_PERMISSIONS[role] ?? [];
}
