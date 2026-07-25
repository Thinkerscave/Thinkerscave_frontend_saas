// Production environment (same shared server for now)
export const environment = {
    production: true,
    name: 'prod',
    apiUrl: '/api/v1',
    baseUrl: '/api/v1',
    defaultTenantId: 'public',
    platformTenantId: 'public',
    // Platform / Thinkers Department org id (JWT orgId claim). Must be > 0 —
    // Number(null) is 0 and the sidebar API returns an empty tree for org 0.
    defaultOrganizationId: 1,
    h2ConsoleUrl: '',
    // Required so Login → Thinkers Department (PLATFORM) or an institution (TENANT)
    requireOrganizationSelection: true,
    authUseHttpOnlyRefresh: true,
    features: {
        feeManagementEnabled: false
    }
};
