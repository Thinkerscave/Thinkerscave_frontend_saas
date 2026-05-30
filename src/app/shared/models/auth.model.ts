export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  orgType: string;
  organizations: UserOrganization[];
  isFirstLogin: boolean;
}

export interface UserOrganization {
  orgId: number;
  orgCode: string;
  orgName: string;
  orgType: string;
}

export interface UserInfo {
  id?: string;
  userCode: string;
  userName: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  mobile: string;
  roles: string[];
  privileges: string[];
  orgId: number;
  orgCode: string;
  organizationId?: number;
  isActive: boolean;
  firstTimeLogin?: boolean;
}

export interface RefreshTokenRequest {
  token: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PasswordResetPayload {
  email: string;
  otp: string;
  newPassword: string;
}
