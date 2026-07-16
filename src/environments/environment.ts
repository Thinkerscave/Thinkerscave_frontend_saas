// Development environment configuration
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8181/api/v1',
    baseUrl: 'http://localhost:8181/api/v1',
    // Dev mode: multi-tenancy bypassed, use default tenant
    defaultTenantId: 'public',
    platformTenantId: 'public',
    defaultOrganizationId: 1,
    h2ConsoleUrl: 'http://localhost:8181/h2-console',
    /** Local dev: show org picker before login. Production resolves tenant from subdomain. */
    requireOrganizationSelection: true,
    /** Refresh token via HttpOnly cookie (never stored in JS-accessible storage). */
    authUseHttpOnlyRefresh: true,
    /** Feature flags — set false to hide incomplete modules from production UI. */
    features: {
        feeManagementEnabled: false
    }
};
