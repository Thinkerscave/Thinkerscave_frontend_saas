import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Class } from './class.service';
import { sectionApi } from '../../shared/constants/api.endpoint';

export interface Section {
  sectionId: string;
  sectionName: string;
  classEntity: Class;
}

@Injectable({
  providedIn: 'root'
})
export class SectionService {

  constructor(private http: HttpClient) { }

  getSectionsByClassId(classId: string): Observable<Section[]> {
    return this.http.get<any>(sectionApi.getByclassId(Number(classId))).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data ?? []))
    );
  }
}
