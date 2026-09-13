import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface PublicInquirySubmitRequest {
  studentName?: string;
  mobileNumber: string;
  classId: number;
  consent: boolean;
}

export interface PublicInquiryResponse {
  inquiryId: number;
  inquiryNumber?: string;
  name?: string;
  mobileNumber?: string;
  classId?: number | null;
  classInterestedIn?: string;
  inquirySource?: string;
  status?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PublicClassOption {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicInquiryService {

  constructor(private http: HttpClient) { }

  submitInquiry(payload: PublicInquirySubmitRequest) {
    return this.http.post<ApiEnvelope<PublicInquiryResponse>>(
      `${environment.baseUrl}/public/admissions/inquiries`,
      payload
    );
  }

  loadFormConfig() {
    return this.http.get<ApiEnvelope<{
      defaultAcademicYearId?: number;
      academicYears: PublicClassOption[];
      classes: PublicClassOption[];
    }>>(`${environment.baseUrl}/public/admissions/form-config`);
  }

  loadClasses(academicYearId?: number) {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', String(academicYearId));
    return this.http.get<ApiEnvelope<PublicClassOption[]>>(`${environment.baseUrl}/public/admissions/classes`, { params });
  }
}