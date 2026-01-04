import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { inquiryUrl } from '../shared/constants/api_admission.endpoint';

export interface PublicInquiryRequest {
  name: string;
  mobileNumber: string;
  email: string;
  classInterestedIn: string;
  address: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicInquiryService {

  constructor(private http: HttpClient) { }

  submitInquiry(payload: any) {
    return this.http.post(inquiryUrl.public.add, payload);
  }
}
