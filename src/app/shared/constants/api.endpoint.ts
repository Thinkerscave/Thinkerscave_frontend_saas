import { environment } from '../../environment/environment';

export const loginApi = {
  loginUrl : `${environment.baseUrl}/v1/users/login`,
  currentUserInfo: `${environment.baseUrl}/v1/users/currentUserInfo`,
};