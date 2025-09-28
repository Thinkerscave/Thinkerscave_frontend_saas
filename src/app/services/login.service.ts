import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, Subject, switchMap } from 'rxjs';
import { environment } from '../environment/environment';
import { loginApi } from '../shared/constants/api.endpoint';
import { Router } from '@angular/router';

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

}
