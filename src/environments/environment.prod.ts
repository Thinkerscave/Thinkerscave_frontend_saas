// Production environment configuration
export const environment = {
    production: true,
    apiUrl: 'https://api.thinkerscave.com/api/v1',
    baseUrl: 'https://api.thinkerscave.com/api/v1',
    defaultTenantId: '',
    platformTenantId: 'public',
    defaultOrganizationId: null as number | null,
    h2ConsoleUrl: '',
    requireOrganizationSelection: false,
    /** Refresh token via HttpOnly Secure cookie — never in localStorage/sessionStorage. */
    authUseHttpOnlyRefresh: true,
    features: {
        feeManagementEnabled: false
    }
};
