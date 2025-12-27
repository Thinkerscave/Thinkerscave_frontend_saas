import { LeadStatus, LeadSource, ContactOutcome, LostLeadReason } from './lead-status.enum';

export interface Lead {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  city: string;
  course: string;
  source: LeadSource;
  status: LeadStatus;
  assignedCounsellor: string;
  counsellorName?: string;
  nextFollowUpDate: Date;
  createdDate: Date;
  lastUpdatedDate: Date;
  lostReason?: LostLeadReason;
  notes?: string;
}

export interface LeadInteraction {
  id: string;
  leadId: string;
  interactionType: string;
  contactOutcome?: ContactOutcome;
  notes: string;
  interactionDate: Date;
  counsellorId: string;
  counsellorName?: string;
  nextFollowUpDate?: Date;
}

export interface LeadAssignmentRule {
  id: string;
  ruleType: 'COURSE_BASED' | 'LOCATION_BASED' | 'ROUND_ROBIN';
  course?: string;
  location?: string;
  assignedCounsellor: string;
  priority: number;
}

export interface Counsellor {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: 'COUNSELLOR';
}

export interface CounsellorDashboardStats {
  totalLeads: number;
  newLeads: number;
  todayFollowups: number;
  overdueFollowups: number;
  interestedLeads: number;
  conversionRate: number;
  responseTime: number; // in minutes
}

export interface FilterOptions {
  status?: LeadStatus;
  course?: string;
  city?: string;
  source?: LeadSource;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}
