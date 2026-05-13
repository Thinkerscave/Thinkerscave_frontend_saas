import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { FollowUp, FollowUpType, FollowUpStatus, InquiryWithFollowUp } from '../models/followup.model';

@Injectable({
    providedIn: 'root'
})
export class FollowUpService {
    private baseUrl = 'http://localhost:8181/api/staff/inquiries';

    constructor(private http: HttpClient) { }

    // Get inquiries filtered by tab type
    getInquiriesByTab(tab: string): Observable<InquiryWithFollowUp[]> {
        return new Observable(observer => {
            this.http.get<any>(`${this.baseUrl}/follow-ups?tab=${tab.toUpperCase()}`).subscribe({
                next: (response) => {
                    const mapped = response.data.map((i: any) => this.mapToInquiryWithFollowUp(i));
                    observer.next(mapped);
                    observer.complete();
                },
                error: (err) => {
                    observer.error(err);
                }
            });
        });
    }

    private mapToInquiryWithFollowUp(i: any): InquiryWithFollowUp {
        const nextFollowUpDate = i.nextFollowUpDate ? new Date(i.nextFollowUpDate) : undefined;
        let daysUntil = undefined;
        let overdue = false;

        if (nextFollowUpDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(nextFollowUpDate);
            target.setHours(0, 0, 0, 0);

            const diffTime = target.getTime() - today.getTime();
            daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            overdue = daysUntil < 0;
        }

        return {
            inquiryId: i.inquiryId,
            name: i.name,
            mobileNumber: i.mobileNumber,
            email: i.email,
            classInterested: i.classInterested,
            address: i.address,
            inquirySource: i.inquirySource,
            assignedCounselor: i.assignedCounselor,
            status: i.status,
            createdDate: new Date(), // i.createdAt may be missing in response, using current or need to add to BE
            lastFollowUpDate: i.lastFollowUpDate ? new Date(i.lastFollowUpDate) : undefined,
            nextFollowUpDate: nextFollowUpDate,
            followUpType: i.lastFollowUpType || '',
            followUpCount: 0, // Not in InquiryResponse
            isOverdue: overdue,
            daysUntilFollowUp: daysUntil
        };
    }

    // Get tab counts
    getTabCounts(): Observable<{ [key: string]: number }> {
        // TODO: Implement backend API for counts or fetch all to count?
        // For now returning 0s to avoid errors and separate concerns
        return of({
            today: 0,
            overdue: 0,
            upcoming: 0,
            converted: 0,
            lost: 0
        });
    }

    // Get inquiry by ID with full details
    getInquiryById(id: number): Observable<InquiryWithFollowUp | undefined> {
        return new Observable(observer => {
            this.http.get<any>(`${this.baseUrl}/${id}/summary`).subscribe({
                next: (response) => {
                    observer.next(this.mapToInquiryWithFollowUp(response.data));
                    observer.complete();
                }
            });
        });
    }

    // Get follow-up history for an inquiry
    getFollowUpHistory(inquiryId: number): Observable<FollowUp[]> {
        return new Observable(observer => {
            this.http.get<any>(`${this.baseUrl}/${inquiryId}/follow-ups`).subscribe({
                next: (res) => {
                    observer.next(res.data);
                    observer.complete();
                }
            })
        });
    }

    // Add a new follow-up
    addFollowUp(followUp: FollowUp): Observable<FollowUp> {
        return new Observable(observer => {
            this.http.post<any>(`${this.baseUrl}/${followUp.inquiryId}/follow-ups`, followUp).subscribe({
                next: (res) => {
                    observer.next(res.data);
                    observer.complete();
                }
            });
        });
    }

    // Convert inquiry to admission
    convertToAdmission(inquiryId: number): Observable<void> {
        return new Observable(observer => {
            this.http.post<any>(`${this.baseUrl}/${inquiryId}/proceed-admission`, {}).subscribe({
                next: () => {
                    observer.next();
                    observer.complete();
                }
            });
        });
    }

    // Get follow-up types
    getFollowUpTypes(): FollowUpType[] {
        return [
            { label: 'Call', value: 'Call', color: '#3B82F6' },
            { label: 'WhatsApp', value: 'WhatsApp', color: '#22C55E' },
            { label: 'Email', value: 'Email', color: '#F59E0B' },
            { label: 'SMS', value: 'SMS', color: '#8B5CF6' },
            { label: 'Meeting', value: 'Meeting', color: '#06B6D4' },
            { label: 'Walk-In', value: 'Walk-In', color: '#6366F1' }
        ];
    }

    // Get follow-up statuses
    getFollowUpStatuses(): FollowUpStatus[] {
        return [
            { label: 'Contacted', value: 'Contacted', severity: 'success' },
            { label: 'Interested', value: 'Interested', severity: 'info' },
            { label: 'Call Back', value: 'Call Back', severity: 'warn' },
            { label: 'Not Connected', value: 'Not Connected', severity: 'secondary' },
            { label: 'Converted', value: 'Converted', severity: 'success' },
            { label: 'Lost', value: 'Lost', severity: 'danger' }
        ];
    }

    // Get counselors
    getCounselors(): Observable<{ label: string; value: string }[]> {
        return of([
            { label: 'Ayesha Khan', value: 'ayesha-khan' },
            { label: 'John Doe', value: 'john-doe' },
            { label: 'Jane Smith', value: 'jane-smith' },
            { label: 'Robert Wilson', value: 'robert-wilson' }
        ]).pipe(delay(100));
    }
}
