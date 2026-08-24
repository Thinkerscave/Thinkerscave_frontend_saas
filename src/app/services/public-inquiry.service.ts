import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface PublicInquiryRequest {
  name: string;
  mobileNumber: string;
  email: string;
  classInterestedIn: string;
  academicYearId?: number | null;
  classId?: number | null;
  address: string;
  inquirySource?: string;
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

  submitInquiry(payload: PublicInquiryRequest) {
    return this.http.post(`${environment.baseUrl}/public/admissions/inquiry`, payload);
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
