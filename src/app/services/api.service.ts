import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Uses environment.baseUrl — never hardcode localhost here
  private backendUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  public getData(): Observable<any> {
    return this.http.get<any>(`${this.backendUrl}/data`);
  }

  public createItem(item: any): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/items`, item);
  }
}
