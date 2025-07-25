import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../environment/environment';
import { loginApi } from '../shared/constants/api.endpoint';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  public loginStatusSubject=new Subject<boolean>();
  

  constructor(private http: HttpClient) { }
  //generate token
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
