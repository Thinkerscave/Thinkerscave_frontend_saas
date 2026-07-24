// Production environment (same shared server for now)
export const environment = {
    production: true,
    name: 'prod',
    apiUrl: '/api/v1',
    baseUrl: '/api/v1',
    defaultTenantId: 'public',
    platformTenantId: 'public',
    defaultOrganizationId: null as number | null,
    h2ConsoleUrl: '',
    // Required so Login → Thinkers Department (PLATFORM) or an institution (TENANT)
    requireOrganizationSelection: true,
    authUseHttpOnlyRefresh: true,
    features: {
        feeManagementEnabled: false
    }
};
