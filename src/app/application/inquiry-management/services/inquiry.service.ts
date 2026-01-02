import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { Inquiry, InquirySource, ClassOption } from '../models/inquiry.model';

@Injectable({
    providedIn: 'root'
})
export class InquiryService {
    // Mock data for development - replace with actual API endpoints
    private mockInquiries: Inquiry[] = [
        {
            inquiryId: 1,
            name: 'Rahul Sharma',
            mobileNumber: '9876543210',
            email: 'rahul.sharma@email.com',
            classInterested: 'class-10',
            address: '123 Main Street, New Delhi',
            inquirySource: 'walkin',
            referredBy: '',
            comments: 'Interested in science stream',
            assignedCounselor: 'John Doe',
            status: 'New',
            createdDate: new Date('2025-12-28'),
            createdBy: 'Admin',
            isActive: true
        },
        {
            inquiryId: 2,
            name: 'Priya Patel',
            mobileNumber: '9123456789',
            email: 'priya.patel@email.com',
            classInterested: 'class-8',
            address: '456 Park Avenue, Mumbai',
            inquirySource: 'website',
            referredBy: '',
            comments: 'Looking for CBSE curriculum',
            assignedCounselor: 'Jane Smith',
            status: 'Contacted',
            createdDate: new Date('2025-12-29'),
            createdBy: 'Admin',
            isActive: true
        },
        {
            inquiryId: 3,
            name: 'Amit Kumar',
            mobileNumber: '8765432109',
            email: 'amit.kumar@email.com',
            classInterested: 'class-12-science',
            address: '789 Lake View, Bangalore',
            inquirySource: 'referral',
            referredBy: 'Mr. Verma',
            comments: 'Wants to prepare for JEE',
            assignedCounselor: 'John Doe',
            status: 'Follow-up',
            createdDate: new Date('2025-12-30'),
            createdBy: 'Admin',
            isActive: true
        },
        {
            inquiryId: 4,
            name: 'Sneha Reddy',
            mobileNumber: '7654321098',
            email: 'sneha.reddy@email.com',
            classInterested: 'class-5',
            address: '321 Green Valley, Hyderabad',
            inquirySource: 'social-media',
            referredBy: '',
            comments: 'Looking for holistic education',
            assignedCounselor: 'Jane Smith',
            status: 'New',
            createdDate: new Date('2025-12-31'),
            createdBy: 'Admin',
            isActive: true
        }
    ];

    constructor(private http: HttpClient) { }

    // Get all inquiries
    getAllInquiries(): Observable<Inquiry[]> {
        // TODO: Replace with actual API call
        // return this.http.get<Inquiry[]>('/api/inquiries');
        return of(this.mockInquiries).pipe(delay(500));
    }

    // Get inquiry by ID
    getInquiryById(id: number): Observable<Inquiry | undefined> {
        const inquiry = this.mockInquiries.find(i => i.inquiryId === id);
        return of(inquiry).pipe(delay(300));
    }

    // Save or update inquiry
    saveOrUpdateInquiry(inquiry: Inquiry): Observable<Inquiry> {
        // TODO: Replace with actual API call
        // return this.http.post<Inquiry>('/api/inquiries', inquiry);
        if (inquiry.inquiryId) {
            // Update existing
            const index = this.mockInquiries.findIndex(i => i.inquiryId === inquiry.inquiryId);
            if (index !== -1) {
                this.mockInquiries[index] = { ...inquiry, lastModifiedDate: new Date() };
            }
        } else {
            // Create new
            const newInquiry: Inquiry = {
                ...inquiry,
                inquiryId: this.mockInquiries.length + 1,
                createdDate: new Date(),
                createdBy: 'Admin',
                status: 'New',
                isActive: true
            };
            this.mockInquiries.push(newInquiry);
            return of(newInquiry).pipe(delay(500));
        }
        return of(inquiry).pipe(delay(500));
    }

    // Delete inquiry
    deleteInquiry(id: number): Observable<void> {
        // TODO: Replace with actual API call
        // return this.http.delete<void>(`/api/inquiries/${id}`);
        const index = this.mockInquiries.findIndex(i => i.inquiryId === id);
        if (index !== -1) {
            this.mockInquiries.splice(index, 1);
        }
        return of(void 0).pipe(delay(300));
    }

    // Update inquiry status
    updateStatus(id: number, isActive: boolean): Observable<void> {
        const index = this.mockInquiries.findIndex(i => i.inquiryId === id);
        if (index !== -1) {
            this.mockInquiries[index].isActive = isActive;
        }
        return of(void 0).pipe(delay(300));
    }

    // Get inquiry sources
    getInquirySources(): InquirySource[] {
        return [
            { label: 'Walk-in', value: 'walkin' },
            { label: 'Website', value: 'website' },
            { label: 'Phone Call', value: 'phone' },
            { label: 'Referral', value: 'referral' },
            { label: 'Social Media', value: 'social-media' },
            { label: 'Advertisement', value: 'advertisement' },
            { label: 'School Event', value: 'school-event' },
            { label: 'Other', value: 'other' }
        ];
    }

    // Get class options
    getClassOptions(): ClassOption[] {
        return [
            { label: 'Nursery', value: 'nursery' },
            { label: 'LKG', value: 'lkg' },
            { label: 'UKG', value: 'ukg' },
            { label: 'Class 1', value: 'class-1' },
            { label: 'Class 2', value: 'class-2' },
            { label: 'Class 3', value: 'class-3' },
            { label: 'Class 4', value: 'class-4' },
            { label: 'Class 5', value: 'class-5' },
            { label: 'Class 6', value: 'class-6' },
            { label: 'Class 7', value: 'class-7' },
            { label: 'Class 8', value: 'class-8' },
            { label: 'Class 9', value: 'class-9' },
            { label: 'Class 10', value: 'class-10' },
            { label: 'Class 11 - Science', value: 'class-11-science' },
            { label: 'Class 11 - Commerce', value: 'class-11-commerce' },
            { label: 'Class 11 - Arts', value: 'class-11-arts' },
            { label: 'Class 12 - Science', value: 'class-12-science' },
            { label: 'Class 12 - Commerce', value: 'class-12-commerce' },
            { label: 'Class 12 - Arts', value: 'class-12-arts' }
        ];
    }

    // Get counselors list (mock)
    getCounselors(): Observable<{ label: string; value: string }[]> {
        return of([
            { label: 'John Doe', value: 'john-doe' },
            { label: 'Jane Smith', value: 'jane-smith' },
            { label: 'Robert Wilson', value: 'robert-wilson' },
            { label: 'Emily Davis', value: 'emily-davis' }
        ]).pipe(delay(200));
    }
}
