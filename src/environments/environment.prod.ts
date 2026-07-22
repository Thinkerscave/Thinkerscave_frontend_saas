// Production environment (same shared server for now)
export const environment = {
    production: true,
    name: 'prod',
    apiUrl: 'http://72.61.244.175:8080/api/v1',
    baseUrl: 'http://72.61.244.175:8080/api/v1',
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
