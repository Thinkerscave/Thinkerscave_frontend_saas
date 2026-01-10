export interface FollowUp {
    followUpId?: number;
    inquiryId: number;
    followUpType: string;
    status: string;
    remarks?: string;
    followUpDate: Date;
    nextFollowUpDate?: Date;
    createdBy?: string;
    createdDate?: Date;
}

export interface FollowUpType {
    label: string;
    value: string;
    color?: string;
}

export interface FollowUpStatus {
    label: string;
    value: string;
    severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
}

export interface InquiryWithFollowUp {
    inquiryId: number;
    name: string;
    mobileNumber: string;
    email: string;
    classInterested: string;
    address: string;
    inquirySource: string;
    referredBy?: string;
    comments?: string;
    assignedCounselor?: string;
    status: string;
    createdDate: Date;
    createdBy?: string;
    lastFollowUpDate?: Date;
    nextFollowUpDate?: Date;
    followUpType?: string;
    followUpCount?: number;
    isOverdue?: boolean;
    daysUntilFollowUp?: number;
    avatar?: string;
}
