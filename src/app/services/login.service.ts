import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../environment/environment';
import { loginApi } from '../shared/constants/api.endpoint';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  public loginStatusSubject=new Subject<boolean>();
  
   private passwordUrl= environment.baseUrl;
  constructor(private http: HttpClient) { }
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

  public getCurrentUser(){
    console.log("Comming to get current user");
    return this.http.get(`${environment.baseUrl}/current-user`);
  }

  //login user : set token in localStorage
  public loginUser(token : any){
    localStorage.setItem('token',token);
    return true;
  }

  //is login
  public isLoggedIn(){
    
    let tokenStr=localStorage.getItem("token");
    if(tokenStr==undefined || tokenStr == '' || tokenStr == null){
      return false;
    }
    else{
      return true;
    }
  }

  // logout : remove token from localstorage
  public logOut(){
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return true;
  }

  //get token
  public getToken(){
    return localStorage.getItem('token');
  }

  //set userDetail
  public setUser(user:any){
    localStorage.setItem('user',JSON.stringify(user));
  }

  //getUser
  public getUser(){
    let userStr= localStorage.getItem('user');
    if(userStr != null){
      return JSON.parse(userStr);
    }
    else{
      this.logOut();
      return null;
    }
  }

  //get the user role
  public getUserRole(){
   let user= this.getUser();
   return user.authorities[0].authority;
  }
}
