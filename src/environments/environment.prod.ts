// Production environment (same shared server for now)
export const environment = {
    production: true,
    name: 'prod',
    apiUrl: '/api/v1',
    baseUrl: '/api/v1',
    defaultTenantId: '',
    platformTenantId: 'public',
    defaultOrganizationId: null as number | null,
    h2ConsoleUrl: '',
    requireOrganizationSelection: false,
    authUseHttpOnlyRefresh: true,
    features: {
        feeManagementEnabled: false
    }
};
