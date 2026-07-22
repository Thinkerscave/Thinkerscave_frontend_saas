// Testing server environment
export const environment = {
    production: false,
    name: 'test',
    apiUrl: 'http://72.61.244.175:8080/api/v1',
    baseUrl: 'http://72.61.244.175:8080/api/v1',
    defaultTenantId: 'public',
    platformTenantId: 'public',
    defaultOrganizationId: 1,
    h2ConsoleUrl: '',
    requireOrganizationSelection: true,
    authUseHttpOnlyRefresh: true,
    features: {
        feeManagementEnabled: false
    }
};
