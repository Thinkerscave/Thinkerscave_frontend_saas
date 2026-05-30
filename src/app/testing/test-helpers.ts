import { LoginService } from '../../core/services/login.service';
import { TenantConfigService } from '../../core/services/tenant-config.service';
import { UserInfo } from '../../shared/models/auth.model';

/**
 * Creates a mock LoginService with sensible defaults.
 * Override any method via Partial<LoginService>.
 */
export function mockLoginService(overrides: Partial<LoginService> = {}): jasmine.SpyObj<LoginService> {
  const spy = jasmine.createSpyObj<LoginService>('LoginService', [
    'isLoggedIn',
    'getAccessToken',
    'getRefreshToken',
    'getUser',
    'getUserRole',
    'getUserPrivileges',
    'getTenant',
    'getOrgType',
    'getCurrentOrganizationId',
    'getOrganizations',
    'setUser',
    'loginUser',
    'logOut',
    'logOutAndRedirect',
    'generateToken',
    'getCurrentUser',
    'refreshAccessToken',
    'changePassword',
    'requestPasswordOtp',
    'verifyPasswordOtp',
    'resetPasswordWithOtp',
    'setCurrentOrganization',
    'setAccessToken',
    'setTenant',
    'clearTokens',
    'redirectToSessionExpired',
  ]);

  spy.isLoggedIn.and.returnValue(true);
  spy.getAccessToken.and.returnValue('mock-access-token');
  spy.getRefreshToken.and.returnValue('mock-refresh-token');
  spy.getTenant.and.returnValue('test-tenant');
  spy.getOrgType.and.returnValue('SCHOOL');
  spy.getCurrentOrganizationId.and.returnValue('1');
  spy.getOrganizations.and.returnValue([]);
  spy.getUserRole.and.returnValue(['ADMIN']);
  spy.getUserPrivileges.and.returnValue([]);
  spy.getUser.and.returnValue(mockUserInfo());

  Object.assign(spy, overrides);
  return spy;
}

/**
 * Creates a mock TenantConfigService.
 */
export function mockTenantConfigService(overrides: Partial<TenantConfigService> = {}): jasmine.SpyObj<TenantConfigService> {
  const spy = jasmine.createSpyObj<TenantConfigService>('TenantConfigService', [
    'fetchConfigFromServer',
    'getConfig',
    'getAdmissionFormConfig',
  ]);

  Object.assign(spy, overrides);
  return spy;
}

/**
 * Returns a minimal valid UserInfo for tests.
 */
export function mockUserInfo(overrides: Partial<UserInfo> = {}): UserInfo {
  return {
    userCode: 'USR001',
    userName: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    mobile: '1234567890',
    roles: ['ADMIN'],
    privileges: [],
    orgId: 1,
    orgCode: 'ORG001',
    organizationId: 1,
    isActive: true,
    ...overrides,
  };
}
