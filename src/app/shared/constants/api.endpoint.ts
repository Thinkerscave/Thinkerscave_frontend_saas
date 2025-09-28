import { environment } from '../../environment/environment';

const loginBaseUrl = `${environment.baseUrl}/v1/users`;

export const loginApi = {
  loginUrl: `${loginBaseUrl}/login`,
  currentUserInfo: `${loginBaseUrl}/currentUserInfo`,
  logOutUrl: `${loginBaseUrl}/logout`,
  refreshTokenUrl: `${loginBaseUrl}/refreshToken`,
};
