import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, catchError, throwError } from 'rxjs';
import { Inquiry, InquirySource, ClassOption } from '../models/inquiry.model';
import { inquiryUrl } from '../../../shared/constants/api_admission.endpoint';
import { ApiResponse } from '../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class InquiryService {
    constructor(private http: HttpClient) {}

    getAllInquiries(): Observable<Inquiry[]> {
        return this.http
          .get<ApiResponse<Inquiry[]>>(inquiryUrl.staff.view)
          .pipe(
            map(res => res.data),
            catchError(this.handleError)
          );
      }
    
      saveOrUpdateInquiry(payload: Inquiry): Observable<Inquiry> {
        // Single method for save & update (backend handles it)
        return this.http
          .post<ApiResponse<Inquiry>>(inquiryUrl.staff.add, payload)
          .pipe(
            map(res => res.data),
            catchError(this.handleError)
          );
      }
    
      deleteInquiry(id: number): Observable<void> {
        return this.http
          .delete<ApiResponse<void>>(inquiryUrl.staff.delete(id))
          .pipe(
            map(() => void 0),
            catchError(this.handleError)
          );
      }
    
      // ============================
      // DROPDOWN DATA (STATIC / TEMP)
      // ============================
    
      getInquirySources(): InquirySource[] {
        return [
          { label: 'Website', value: 'WEBSITE' },
          { label: 'Social Media', value: 'SOCIAL_MEDIA' },
          { label: 'Walk-in', value: 'WALK_IN' },
          { label: 'Referral', value: 'REFERRAL' },
          { label: 'Advertisement', value: 'ADVERTISEMENT' }
        ];
      }
    
      getClassOptions(): ClassOption[] {
        return [
          { label: 'Nursery', value: 'NURSERY' },
          { label: 'LKG', value: 'LKG' },
          { label: 'UKG', value: 'UKG' },
          { label: 'Class 1', value: 'CLASS_1' },
          { label: 'Class 2', value: 'CLASS_2' },
          { label: 'Class 10', value: 'CLASS_10' }
        ];
      }
    
      getCounselors(): Observable<{ label: string; value: string }[]> {
        // Placeholder for future API
        return new Observable(observer => {
          observer.next([
            { label: 'Admin', value: 'Admin' },
            { label: 'Counselor A', value: 'Counselor A' }
          ]);
          observer.complete();
        });
      }
    
      // ============================
      // ERROR HANDLER (STANDARD)
      // ============================
      private handleError(error: any) {
        let message = 'Something went wrong. Please try again later.';
    
        if (error?.error?.message) {
          message = error.error.message;
        }
    
        return throwError(() => message);
      }
    
}
