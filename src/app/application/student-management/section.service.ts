import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Class } from './class.service';
export interface Section {
  sectionId: string;
  sectionName: string;
   classEntity: Class;
}
@Injectable({
  providedIn: 'root'
})
export class SectionService {

    private baseUrl = 'http://localhost:8181/api/section'; 

  constructor(private http: HttpClient) {}

  // Fetch sections filtered by classId
  getSectionsByClassId(classId: string): Observable< Section[] > {
    const url = `${this.baseUrl}/getListOfSectionsByClassId/${classId}`;
    return this.http.get< Section[] >(url);
  }
}
