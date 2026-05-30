import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { classApi } from '../../shared/constants/api.endpoint';

export interface Class {
  classId: string;
  className: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassService {

  constructor(private http: HttpClient) { }

  getClasses(): Observable<Class[]> {
    return this.http.get<any>(classApi.getAll).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data ?? []))
    );
  }
}
