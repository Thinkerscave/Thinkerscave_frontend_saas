import { Injectable } from '@angular/core';
import { Lead, LeadInteraction, Counsellor } from '../models/lead.model';
import { LeadStatus, LeadSource, InteractionType, ContactOutcome, LostLeadReason } from '../models/lead-status.enum';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  // Counsellor credentials
  COUNSELLOR_CREDENTIALS = {
    username: 'counsellor',
    password: 'Counsellor@123',
    role: 'COUNSELLOR'
  };

  // Sample counsellors
  private counsellors: Counsellor[] = [
    {
      id: 'C001',
      name: 'Priya Sharma',
      email: 'priya@thinkerscave.com',
      phoneNumber: '9876543210',
      role: 'COUNSELLOR'
    },
    {
      id: 'C002',
      name: 'Rajesh Kumar',
      email: 'rajesh@thinkerscave.com',
      phoneNumber: '9876543211',
      role: 'COUNSELLOR'
    },
    {
      id: 'C003',
      name: 'Anjali Verma',
      email: 'anjali@thinkerscave.com',
      phoneNumber: '9876543212',
      role: 'COUNSELLOR'
    }
  ];

  // Sample leads with various statuses
  private leads: Lead[] = [
    {
      id: 'L001',
      name: 'Aarush Patel',
      phoneNumber: '9123456701',
      email: 'aarush@example.com',
      city: 'Mumbai',
      course: 'Class 10',
      source: LeadSource.WEBSITE,
      status: LeadStatus.NEW,
      assignedCounsellor: 'C001',
      counsellorName: 'Priya Sharma',
      nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      lastUpdatedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'L002',
      name: 'Bhavna Singh',
      phoneNumber: '9123456702',
      email: 'bhavna@example.com',
      city: 'Delhi',
      course: 'Class 12',
      source: LeadSource.SOCIAL_MEDIA,
      status: LeadStatus.CONTACTED,
      assignedCounsellor: 'C001',
      counsellorName: 'Priya Sharma',
      nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      lastUpdatedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'L003',
      name: 'Chetan Malhotra',
      phoneNumber: '9123456703',
      email: 'chetan@example.com',
      city: 'Bangalore',
      course: 'Class 10',
      source: LeadSource.WALK_IN,
      status: LeadStatus.INTERESTED,
      assignedCounsellor: 'C001',
      counsellorName: 'Priya Sharma',
      nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastUpdatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'L004',
      name: 'Deepak Gupta',
      phoneNumber: '9123456704',
      email: 'deepak@example.com',
      city: 'Pune',
      course: 'Class 12',
      source: LeadSource.PHONE_CALL,
      status: LeadStatus.FOLLOW_UP,
      assignedCounsellor: 'C001',
      counsellorName: 'Priya Sharma',
      nextFollowUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue
      createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      lastUpdatedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'L005',
      name: 'Esha Chatterjee',
      phoneNumber: '9123456705',
      email: 'esha@example.com',
      city: 'Kolkata',
      course: 'Class 10',
      source: LeadSource.REFERRAL,
      status: LeadStatus.LOST,
      assignedCounsellor: 'C001',
      counsellorName: 'Priya Sharma',
      lostReason: LostLeadReason.JOINED_ANOTHER_INSTITUTE,
      nextFollowUpDate: new Date(),
      createdDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      lastUpdatedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'L006',
      name: 'Farhan Ahmed',
      phoneNumber: '9123456706',
      email: 'farhan@example.com',
      city: 'Chennai',
      course: 'Class 12',
      source: LeadSource.WEBSITE,
      status: LeadStatus.ADMISSION_CONFIRMED,
      assignedCounsellor: 'C001',
      counsellorName: 'Priya Sharma',
      nextFollowUpDate: new Date(),
      createdDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      lastUpdatedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'L007',
      name: 'Gita Reddy',
      phoneNumber: '9123456707',
      email: 'gita@example.com',
      city: 'Hyderabad',
      course: 'Class 10',
      source: LeadSource.SOCIAL_MEDIA,
      status: LeadStatus.NEW,
      assignedCounsellor: 'C002',
      counsellorName: 'Rajesh Kumar',
      nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      lastUpdatedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'L008',
      name: 'Harsh Patel',
      phoneNumber: '9123456708',
      email: 'harsh@example.com',
      city: 'Ahmedabad',
      course: 'Class 12',
      source: LeadSource.WALK_IN,
      status: LeadStatus.CONTACTED,
      assignedCounsellor: 'C002',
      counsellorName: 'Rajesh Kumar',
      nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      lastUpdatedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'L009',
      name: 'Isha Nair',
      phoneNumber: '9123456709',
      email: 'isha@example.com',
      city: 'Kochi',
      course: 'Class 10',
      source: LeadSource.PHONE_CALL,
      status: LeadStatus.INTERESTED,
      assignedCounsellor: 'C003',
      counsellorName: 'Anjali Verma',
      nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      createdDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      lastUpdatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'L010',
      name: 'Jatin Singh',
      phoneNumber: '9123456710',
      email: 'jatin@example.com',
      city: 'Lucknow',
      course: 'Class 12',
      source: LeadSource.REFERRAL,
      status: LeadStatus.FOLLOW_UP,
      assignedCounsellor: 'C003',
      counsellorName: 'Anjali Verma',
      nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      lastUpdatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ];

  // Sample interactions
  private interactions: LeadInteraction[] = [
    {
      id: 'I001',
      leadId: 'L001',
      interactionType: 'EMAIL',
      notes: 'Sent initial enquiry response with course details',
      interactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      counsellorId: 'C001',
      counsellorName: 'Priya Sharma'
    },
    {
      id: 'I002',
      leadId: 'L002',
      interactionType: 'CALL',
      contactOutcome: ContactOutcome.CONNECTED,
      notes: 'Student interested in Class 12 program. Shared fee structure.',
      interactionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      counsellorId: 'C001',
      counsellorName: 'Priya Sharma',
      nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'I003',
      leadId: 'L003',
      interactionType: 'PERSONAL_MEETING',
      contactOutcome: ContactOutcome.CONNECTED,
      notes: 'Campus visit completed. Student impressed with infrastructure. Awaiting parent approval.',
      interactionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      counsellorId: 'C001',
      counsellorName: 'Priya Sharma',
      nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'I004',
      leadId: 'L004',
      interactionType: 'WHATSAPP',
      contactOutcome: ContactOutcome.NO_ANSWER,
      notes: 'Sent admission form link. Awaiting response.',
      interactionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      counsellorId: 'C001',
      counsellorName: 'Priya Sharma',
      nextFollowUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ];

  constructor() { }

  /**
   * Get all leads for a specific counsellor
   */
  getLeadsForCounsellor(counsellorId: string): Lead[] {
    return this.leads.filter(lead => lead.assignedCounsellor === counsellorId);
  }

  /**
   * Get all leads (unfiltered)
   */
  getAllLeads(): Lead[] {
    return [...this.leads];
  }

  /**
   * Get lead by ID
   */
  getLeadById(leadId: string): Lead | undefined {
    return this.leads.find(lead => lead.id === leadId);
  }

  /**
   * Get interactions for a specific lead
   */
  getInteractionsForLead(leadId: string): LeadInteraction[] {
    return this.interactions.filter(interaction => interaction.leadId === leadId);
  }

  /**
   * Get counsellor details
   */
  getCounsellorById(counsellorId: string): Counsellor | undefined {
    return this.counsellors.find(c => c.id === counsellorId);
  }

  /**
   * Get all counsellors
   */
  getAllCounsellors(): Counsellor[] {
    return [...this.counsellors];
  }

  /**
   * Add a new lead (mock implementation)
   */
  addLead(lead: Omit<Lead, 'id' | 'createdDate' | 'lastUpdatedDate'>): Lead {
    const newLead: Lead = {
      ...lead,
      id: 'L' + (this.leads.length + 1).toString().padStart(3, '0'),
      createdDate: new Date(),
      lastUpdatedDate: new Date()
    };
    this.leads.push(newLead);
    return newLead;
  }

  /**
   * Update lead status
   */
  updateLeadStatus(leadId: string, status: LeadStatus, lostReason?: LostLeadReason): Lead | undefined {
    const lead = this.getLeadById(leadId);
    if (lead) {
      lead.status = status;
      if (lostReason) {
        lead.lostReason = lostReason;
      }
      lead.lastUpdatedDate = new Date();
    }
    return lead;
  }

  /**
   * Add interaction for a lead
   */
  addInteraction(leadId: string, interaction: Omit<LeadInteraction, 'id'>): LeadInteraction {
    const newInteraction: LeadInteraction = {
      ...interaction,
      id: 'I' + (this.interactions.length + 1).toString().padStart(3, '0')
    };
    this.interactions.push(newInteraction);

    // Update lead's lastUpdatedDate and nextFollowUpDate
    const lead = this.getLeadById(leadId);
    if (lead) {
      lead.lastUpdatedDate = new Date();
      if (interaction.nextFollowUpDate) {
        lead.nextFollowUpDate = interaction.nextFollowUpDate;
      }
    }

    return newInteraction;
  }

  /**
   * Check for duplicate lead by phone number
   */
  checkDuplicateLead(phoneNumber: string): Lead | undefined {
    return this.leads.find(lead => lead.phoneNumber === phoneNumber);
  }

  /**
   * Get dashboard statistics for a counsellor
   */
  getDashboardStats(counsellorId: string) {
    const counsellorLeads = this.getLeadsForCounsellor(counsellorId);
    const now = new Date();

    const newLeads = counsellorLeads.filter(l => l.status === LeadStatus.NEW).length;
    const todayFollowups = counsellorLeads.filter(l => {
      const isToday = l.nextFollowUpDate.toDateString() === now.toDateString();
      return isToday && (l.status === LeadStatus.CONTACTED || l.status === LeadStatus.FOLLOW_UP);
    }).length;
    const overdueFollowups = counsellorLeads.filter(l => {
      return l.nextFollowUpDate < now && (l.status === LeadStatus.CONTACTED || l.status === LeadStatus.FOLLOW_UP);
    }).length;
    const interestedLeads = counsellorLeads.filter(l => l.status === LeadStatus.INTERESTED).length;
    const admitted = counsellorLeads.filter(l => l.status === LeadStatus.ADMISSION_CONFIRMED).length;
    const conversionRate = counsellorLeads.length > 0 ? ((admitted / counsellorLeads.length) * 100).toFixed(2) : '0';

    return {
      totalLeads: counsellorLeads.length,
      newLeads,
      todayFollowups,
      overdueFollowups,
      interestedLeads,
      conversionRate: parseFloat(conversionRate as string),
      responseTime: 45 // Mock value in minutes
    };
  }

  /**
   * Get leads by status
   */
  getLeadsByStatus(counsellorId: string, status: LeadStatus): Lead[] {
    return this.getLeadsForCounsellor(counsellorId).filter(lead => lead.status === status);
  }

  /**
   * Get today's follow-ups for a counsellor
   */
  getTodayFollowups(counsellorId: string): Lead[] {
    const counsellorLeads = this.getLeadsForCounsellor(counsellorId);
    const now = new Date();

    return counsellorLeads.filter(lead => {
      const isToday = lead.nextFollowUpDate.toDateString() === now.toDateString();
      return isToday && (lead.status === LeadStatus.CONTACTED || lead.status === LeadStatus.FOLLOW_UP);
    });
  }

  /**
   * Get overdue follow-ups for a counsellor
   */
  getOverdueFollowups(counsellorId: string): Lead[] {
    const counsellorLeads = this.getLeadsForCounsellor(counsellorId);
    const now = new Date();

    return counsellorLeads.filter(lead => {
      return lead.nextFollowUpDate < now && (lead.status === LeadStatus.CONTACTED || lead.status === LeadStatus.FOLLOW_UP);
    });
  }
}
