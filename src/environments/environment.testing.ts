// TESTING environment — local backend
export const environment = {
    production: false,
    name: 'testing',
    apiUrl: 'http://localhost:8181/api/v1',
    baseUrl: 'http://localhost:8181/api/v1',
    defaultTenantId: 'public',
    platformTenantId: 'public',
    defaultOrganizationId: 1,
    h2ConsoleUrl: 'http://localhost:8181/h2-console',
    requireOrganizationSelection: true,
    authUseHttpOnlyRefresh: true,
    features: {
        feeManagementEnabled: false
    }
};
