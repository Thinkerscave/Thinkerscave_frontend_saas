// Local development — localhost backend only
export const environment = {
    production: false,
    name: 'dev',
    apiUrl: 'http://localhost:8080/api/v1',
    baseUrl: 'http://localhost:8080/api/v1',
    defaultTenantId: 'public',
    platformTenantId: 'public',
    defaultOrganizationId: 1,
    h2ConsoleUrl: 'http://localhost:8080/h2-console',
    requireOrganizationSelection: true,
    authUseHttpOnlyRefresh: true,
    /** TEMPORARY — remove when production email reset is live. */
    developmentResetPassword: 'Password@123'
};
