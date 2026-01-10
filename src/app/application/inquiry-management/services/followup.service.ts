import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { FollowUp, FollowUpType, FollowUpStatus, InquiryWithFollowUp } from '../models/followup.model';

@Injectable({
    providedIn: 'root'
})
export class FollowUpService {
    // Mock data for development
    private mockInquiriesWithFollowUp: InquiryWithFollowUp[] = [
        {
            inquiryId: 1,
            name: 'Rohan Sharma',
            mobileNumber: '9876543210',
            email: 'rohan@example.com',
            classInterested: 'class-10',
            address: '123 Main St, Springfield',
            inquirySource: 'website',
            assignedCounselor: 'Ayesha Khan',
            status: 'Contacted',
            createdDate: new Date('2024-07-05'),
            lastFollowUpDate: new Date('2024-08-12'),
            nextFollowUpDate: new Date('2024-08-15'),
            followUpType: 'Call',
            followUpCount: 4,
            isOverdue: false,
            daysUntilFollowUp: 2
        },
        {
            inquiryId: 2,
            name: 'Priya Patel',
            mobileNumber: '9123456789',
            email: 'priya.patel@email.com',
            classInterested: 'class-8',
            address: '456 Park Avenue, Mumbai',
            inquirySource: 'walkin',
            assignedCounselor: 'John Doe',
            status: 'Interested',
            createdDate: new Date('2024-07-10'),
            lastFollowUpDate: new Date('2024-08-10'),
            nextFollowUpDate: new Date('2024-08-07'),
            followUpType: 'WhatsApp',
            followUpCount: 3,
            isOverdue: true,
            daysUntilFollowUp: -5
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
            assignedCounselor: 'Ayesha Khan',
            status: 'Call Back',
            createdDate: new Date('2024-07-15'),
            lastFollowUpDate: new Date('2024-08-08'),
            nextFollowUpDate: new Date('2024-08-06'),
            followUpType: 'Call',
            followUpCount: 2,
            isOverdue: true,
            daysUntilFollowUp: -7
        },
        {
            inquiryId: 4,
            name: 'Sneha Reddy',
            mobileNumber: '7654321098',
            email: 'sneha.reddy@email.com',
            classInterested: 'class-5',
            address: '321 Green Valley, Hyderabad',
            inquirySource: 'social-media',
            assignedCounselor: 'Jane Smith',
            status: 'Converted',
            createdDate: new Date('2024-06-20'),
            lastFollowUpDate: new Date('2024-08-01'),
            followUpType: 'Meeting',
            followUpCount: 5,
            isOverdue: false
        },
        {
            inquiryId: 5,
            name: 'Vikash Singh',
            mobileNumber: '9988776655',
            email: 'vikash.singh@email.com',
            classInterested: 'class-10',
            address: '555 Tech Park, Chennai',
            inquirySource: 'phone',
            assignedCounselor: 'John Doe',
            status: 'Not Connected',
            createdDate: new Date('2024-07-25'),
            lastFollowUpDate: new Date('2024-08-05'),
            nextFollowUpDate: new Date('2024-08-20'),
            followUpType: 'Call',
            followUpCount: 1,
            isOverdue: false,
            daysUntilFollowUp: 7
        },
        {
            inquiryId: 6,
            name: 'Meera Nair',
            mobileNumber: '8877665544',
            email: 'meera.nair@email.com',
            classInterested: 'class-9',
            address: '888 Hill Station, Kerala',
            inquirySource: 'advertisement',
            assignedCounselor: 'Ayesha Khan',
            status: 'Lost',
            createdDate: new Date('2024-06-15'),
            lastFollowUpDate: new Date('2024-07-20'),
            followUpType: 'Email',
            followUpCount: 3,
            isOverdue: false
        }
    ];

    private mockFollowUpHistory: FollowUp[] = [
        {
            followUpId: 1,
            inquiryId: 1,
            followUpType: 'Call',
            status: 'Contacted',
            remarks: 'Spoke with parent, scheduled next visit.',
            followUpDate: new Date('2024-08-12'),
            nextFollowUpDate: new Date('2024-08-15'),
            createdBy: 'Ayesha Khan',
            createdDate: new Date('2024-08-12')
        },
        {
            followUpId: 2,
            inquiryId: 1,
            followUpType: 'WhatsApp',
            status: 'Interested',
            remarks: 'Sent brochure.',
            followUpDate: new Date('2024-08-10'),
            createdBy: 'Ayesha Khan',
            createdDate: new Date('2024-08-10')
        },
        {
            followUpId: 3,
            inquiryId: 1,
            followUpType: 'Call',
            status: 'Call Back',
            remarks: 'Rang but no answer.',
            followUpDate: new Date('2024-08-08'),
            createdBy: 'Ayesha Khan',
            createdDate: new Date('2024-08-08')
        },
        {
            followUpId: 4,
            inquiryId: 1,
            followUpType: 'Walk-In',
            status: 'Not Connected',
            remarks: 'Visited center for information.',
            followUpDate: new Date('2024-08-06'),
            createdBy: 'Ayesha Khan',
            createdDate: new Date('2024-08-06')
        }
    ];

    constructor(private http: HttpClient) { }

    // Get inquiries filtered by tab type
    getInquiriesByTab(tab: string): Observable<InquiryWithFollowUp[]> {
        let filtered: InquiryWithFollowUp[];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (tab) {
            case 'today':
                filtered = this.mockInquiriesWithFollowUp.filter(i => {
                    if (!i.nextFollowUpDate) return false;
                    const followUpDate = new Date(i.nextFollowUpDate);
                    followUpDate.setHours(0, 0, 0, 0);
                    return followUpDate.getTime() === today.getTime() && i.status !== 'Converted' && i.status !== 'Lost';
                });
                break;
            case 'overdue':
                filtered = this.mockInquiriesWithFollowUp.filter(i =>
                    i.isOverdue && i.status !== 'Converted' && i.status !== 'Lost'
                );
                break;
            case 'upcoming':
                filtered = this.mockInquiriesWithFollowUp.filter(i =>
                    i.daysUntilFollowUp && i.daysUntilFollowUp > 0 && i.status !== 'Converted' && i.status !== 'Lost'
                );
                break;
            case 'converted':
                filtered = this.mockInquiriesWithFollowUp.filter(i => i.status === 'Converted');
                break;
            case 'lost':
                filtered = this.mockInquiriesWithFollowUp.filter(i => i.status === 'Lost');
                break;
            default:
                filtered = this.mockInquiriesWithFollowUp;
        }

        return of(filtered).pipe(delay(300));
    }

    // Get tab counts
    getTabCounts(): Observable<{ [key: string]: number }> {
        const counts = {
            today: this.mockInquiriesWithFollowUp.filter(i => {
                if (!i.nextFollowUpDate) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const followUpDate = new Date(i.nextFollowUpDate);
                followUpDate.setHours(0, 0, 0, 0);
                return followUpDate.getTime() === today.getTime() && i.status !== 'Converted' && i.status !== 'Lost';
            }).length,
            overdue: this.mockInquiriesWithFollowUp.filter(i => i.isOverdue && i.status !== 'Converted' && i.status !== 'Lost').length,
            upcoming: this.mockInquiriesWithFollowUp.filter(i => i.daysUntilFollowUp && i.daysUntilFollowUp > 0 && i.status !== 'Converted' && i.status !== 'Lost').length,
            converted: this.mockInquiriesWithFollowUp.filter(i => i.status === 'Converted').length,
            lost: this.mockInquiriesWithFollowUp.filter(i => i.status === 'Lost').length
        };
        return of(counts).pipe(delay(100));
    }

    // Get inquiry by ID with full details
    getInquiryById(id: number): Observable<InquiryWithFollowUp | undefined> {
        const inquiry = this.mockInquiriesWithFollowUp.find(i => i.inquiryId === id);
        return of(inquiry).pipe(delay(200));
    }

    // Get follow-up history for an inquiry
    getFollowUpHistory(inquiryId: number): Observable<FollowUp[]> {
        const history = this.mockFollowUpHistory.filter(f => f.inquiryId === inquiryId);
        return of(history.sort((a, b) => new Date(b.followUpDate).getTime() - new Date(a.followUpDate).getTime())).pipe(delay(300));
    }

    // Add a new follow-up
    addFollowUp(followUp: FollowUp): Observable<FollowUp> {
        const newFollowUp: FollowUp = {
            ...followUp,
            followUpId: this.mockFollowUpHistory.length + 1,
            createdDate: new Date()
        };
        this.mockFollowUpHistory.push(newFollowUp);

        // Update inquiry status
        const inquiryIndex = this.mockInquiriesWithFollowUp.findIndex(i => i.inquiryId === followUp.inquiryId);
        if (inquiryIndex !== -1) {
            this.mockInquiriesWithFollowUp[inquiryIndex].status = followUp.status;
            this.mockInquiriesWithFollowUp[inquiryIndex].lastFollowUpDate = followUp.followUpDate;
            this.mockInquiriesWithFollowUp[inquiryIndex].nextFollowUpDate = followUp.nextFollowUpDate;
            this.mockInquiriesWithFollowUp[inquiryIndex].followUpType = followUp.followUpType;
            this.mockInquiriesWithFollowUp[inquiryIndex].followUpCount =
                (this.mockInquiriesWithFollowUp[inquiryIndex].followUpCount || 0) + 1;
        }

        return of(newFollowUp).pipe(delay(400));
    }

    // Convert inquiry to admission
    convertToAdmission(inquiryId: number): Observable<void> {
        const inquiryIndex = this.mockInquiriesWithFollowUp.findIndex(i => i.inquiryId === inquiryId);
        if (inquiryIndex !== -1) {
            this.mockInquiriesWithFollowUp[inquiryIndex].status = 'Converted';
        }
        return of(void 0).pipe(delay(300));
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
