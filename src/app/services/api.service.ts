import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

// The base URL of your Spring Boot backend
  private backendUrl = 'http://localhost:8080/api'; // Adjust port and path as needed

  // Inject HttpClient in the constructor
  constructor(private http: HttpClient) { }

  // Example GET request to fetch some data
  public getData(): Observable<any> {
    return this.http.get<any>(`${this.backendUrl}/data`);
  }

  // Example POST request to create an item
  public createItem(item: any): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/items`, item);
  }
}
