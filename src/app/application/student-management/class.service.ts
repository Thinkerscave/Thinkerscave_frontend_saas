import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Class {
  classId: string;
  className: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassService {

  private baseUrl = 'http://localhost:8181/api/class'; // Replace with your API base URL

  constructor(private http: HttpClient ) {}

  getClasses(): Observable<Class[] > {
    return this.http.get< Class[] >(`${this.baseUrl}/getListOfClass`);
  }
}
