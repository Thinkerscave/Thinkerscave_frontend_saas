import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, Subject, switchMap, of } from 'rxjs';
import { environment } from '../environment/environment';
import { loginApi } from '../shared/constants/api.endpoint';
import { Router } from '@angular/router';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  public loginStatusSubject = new Subject<boolean>();

  private passwordUrl = environment.baseUrl;
  constructor(private http: HttpClient,private router: Router) { }
  //generate token


  /**
   * Step 1: Requests the backend to generate and send an OTP to the user's email.
   * @param email The user's email address.
   * @returns An Observable for the API call.
   */
  requestPasswordOtp(email: string): Observable<any> {
    const params = new HttpParams().set('email', email);
    return this.http.post(`${this.passwordUrl}/password/forgot`, null, { params: params });
  }

  /**
   * Step 2: Sends the OTP to the backend for verification.
   * @param email The user's email address.
   * @param otp The 6-digit OTP entered by the user.
   * @returns An Observable for the API call.
   */
  verifyPasswordOtp(email: string, otp: string): Observable<any> {
    const params = new HttpParams()
      .set('email', email)
      .set('otp', otp.trim());
    return this.http.post(`${this.passwordUrl}/password/verify-otp`, null, { params: params });
  }

  /**
   * Step 3: Sends the final request to reset the password.
   * @param payload An object containing the email, OTP, and newPassword.
   * @returns An Observable for the API call.
   */
  resetPasswordWithOtp(payload: { email: string; otp: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.passwordUrl}/password/reset`, payload);
  }
  public generateToken(loginData: any) {
    return this.http.post(loginApi.loginUrl, loginData);
  }

  public getCurrentUser() {
    return this.http.get(loginApi.currentUserInfo);
  }

  //login user : set token in localStorage
  public loginUser(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return true;
  }

  //is login
  public isLoggedIn() {

    let tokenStr = localStorage.getItem("accessToken");
    if (tokenStr == undefined || tokenStr == '' || tokenStr == null) {
      return false;
    }
    else {
      return true;
    }
  }

  //get token
  public getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  public setAccessToken(accessToken: string) {
    localStorage.setItem('accessToken', accessToken);
  }

  public getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  //set userDetail
  public setUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  //getUser
  public getUser() {
    let userStr = localStorage.getItem('user');
    if (userStr != null) {
      return JSON.parse(userStr);
    }
    else {
      this.logOut();
      return null;
    }
  }

  public getUserRole() {
    let user = this.getUser();
    return user?.roles || [];
  }

  public logOut() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(loginApi.logOutUrl, { token: refreshToken })
        .subscribe({ next: () => { }, error: () => { } });
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sideMenu');
    localStorage.removeItem('app-breadcrumb');
    this.loginStatusSubject.next(false);
    return true;
  }

  logOutAndRedirect(): void {
    this.logOut();
    this.router.navigate(['/auth/login']); // Redirect to login
  }

  public refreshAccessToken(refreshToken: string): Observable<string> {
    return this.http.post<any>(loginApi.refreshTokenUrl,{ token: refreshToken }
    ).pipe(
      switchMap((res: any) => {
        this.setAccessToken(res.accessToken); // update local storage
        return from([res.accessToken]); // return new access token
      })
    );
  }

  public clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sideMenu');
    localStorage.removeItem('app-breadcrumb');
    this.loginStatusSubject.next(false);
  }

  public redirectToSessionExpired(): void {
    this.router.navigate(['/session-expired']);
  }

  /**
   * Mock counsellor login for demo purposes
   * Credentials: counsellor / Counsellor@123
   */
  public counsellorLogin(username: string, password: string): Observable<any> {
    // Hardcoded counsellor credentials
    const COUNSELLOR_USERNAME = 'counsellor';
    const COUNSELLOR_PASSWORD = 'Counsellor@123';
    const COUNSELLOR_ID = 'C001';

    const normalizedUsername = (username || '').trim().toLowerCase();
    const normalizedPassword = (password || '').trim();

    console.log('[MOCK LOGIN] Attempting login with username:', normalizedUsername);
    console.log('[MOCK LOGIN] Expected:', COUNSELLOR_USERNAME);
    console.log('[MOCK LOGIN] Password match:', normalizedPassword === COUNSELLOR_PASSWORD);

    if (normalizedUsername === COUNSELLOR_USERNAME && normalizedPassword === COUNSELLOR_PASSWORD) {
      const mockToken = 'mock_jwt_token_' + Date.now();
      const mockUser = {
        id: COUNSELLOR_ID,
        username: normalizedUsername,
        name: 'Priya Sharma',
        roles: ['COUNSELLOR'],
        role: 'COUNSELLOR',
        phoneNumber: '9876543210',
        firstTimeLogin: false
      };

      console.log('[MOCK LOGIN] Login successful, returning mock token and user');

      return of({
        accessToken: mockToken,
        refreshToken: 'mock_refresh_token_' + Date.now(),
        user: mockUser
      }).pipe(delay(300)); // Simulate API call
    }

    console.log('[MOCK LOGIN] Login failed - invalid credentials');

    // Return error if credentials don't match
    return of({
      error: 'Invalid credentials',
      message: 'Username or password is incorrect'
    }).pipe(delay(300));
  }

}

