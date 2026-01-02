export interface Inquiry {
    inquiryId?: number;
    name: string;
    mobileNumber: string;
    email: string;
    classInterested: string;
    address: string;
    inquirySource: string;
    referredBy?: string;
    comments?: string;
    assignedCounselor?: string;
    status?: string;
    createdDate?: Date;
    createdBy?: string;
    lastModifiedDate?: Date;
    isActive?: boolean;
}

export interface InquirySource {
    label: string;
    value: string;
}

export interface ClassOption {
    label: string;
    value: string;
}
