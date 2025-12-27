import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { MockDataService } from './mock-data.service';
import { Lead, LeadInteraction, CounsellorDashboardStats, FilterOptions } from '../models/lead.model';
import { LeadStatus, LostLeadReason } from '../models/lead-status.enum';

@Injectable({
  providedIn: 'root'
})
export class LeadService {

  constructor(private mockDataService: MockDataService) { }

  /**
   * Get all leads for a counsellor with optional filters
   */
  getLeadsForCounsellor(counsellorId: string, filters?: FilterOptions): Observable<Lead[]> {
    let leads = this.mockDataService.getLeadsForCounsellor(counsellorId);

    if (filters) {
      if (filters.status) {
        leads = leads.filter(l => l.status === filters.status);
      }
      if (filters.course) {
        leads = leads.filter(l => l.course === filters.course);
      }
      if (filters.city) {
        leads = leads.filter(l => l.city === filters.city);
      }
      if (filters.source) {
        leads = leads.filter(l => l.source === filters.source);
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        leads = leads.filter(l =>
          l.name.toLowerCase().includes(term) ||
          l.phoneNumber.includes(term) ||
          l.email.toLowerCase().includes(term)
        );
      }
    }

    return of(leads).pipe(delay(300)); // Simulate API call delay
  }

  /**
   * Get lead by ID
   */
  getLeadById(leadId: string): Observable<Lead | undefined> {
    const lead = this.mockDataService.getLeadById(leadId);
    return of(lead).pipe(delay(200));
  }

  /**
   * Get interactions for a lead
   */
  getLeadInteractions(leadId: string): Observable<LeadInteraction[]> {
    const interactions = this.mockDataService.getInteractionsForLead(leadId);
    return of(interactions).pipe(delay(200));
  }

  /**
   * Create a new lead
   */
  createLead(lead: Omit<Lead, 'id' | 'createdDate' | 'lastUpdatedDate'>): Observable<Lead> {
    const newLead = this.mockDataService.addLead(lead);
    return of(newLead).pipe(delay(300));
  }

  /**
   * Update lead status
   */
  updateLeadStatus(leadId: string, status: LeadStatus, lostReason?: LostLeadReason): Observable<Lead | undefined> {
    const updatedLead = this.mockDataService.updateLeadStatus(leadId, status, lostReason);
    return of(updatedLead).pipe(delay(300));
  }

  /**
   * Add interaction to a lead
   */
  addInteraction(leadId: string, interaction: Omit<LeadInteraction, 'id'>): Observable<LeadInteraction> {
    const newInteraction = this.mockDataService.addInteraction(leadId, interaction);
    return of(newInteraction).pipe(delay(300));
  }

  /**
   * Check for duplicate lead
   */
  checkDuplicate(phoneNumber: string): Observable<Lead | undefined> {
    const duplicate = this.mockDataService.checkDuplicateLead(phoneNumber);
    return of(duplicate).pipe(delay(200));
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats(counsellorId: string): Observable<CounsellorDashboardStats> {
    const stats = this.mockDataService.getDashboardStats(counsellorId);
    return of(stats).pipe(delay(300));
  }

  /**
   * Get today's follow-ups
   */
  getTodayFollowups(counsellorId: string): Observable<Lead[]> {
    const followups = this.mockDataService.getTodayFollowups(counsellorId);
    return of(followups).pipe(delay(300));
  }

  /**
   * Get overdue follow-ups
   */
  getOverdueFollowups(counsellorId: string): Observable<Lead[]> {
    const overdue = this.mockDataService.getOverdueFollowups(counsellorId);
    return of(overdue).pipe(delay(300));
  }

  /**
   * Get leads by status
   */
  getLeadsByStatus(counsellorId: string, status: LeadStatus): Observable<Lead[]> {
    const leads = this.mockDataService.getLeadsByStatus(counsellorId, status);
    return of(leads).pipe(delay(300));
  }

  /**
   * Get courses list
   */
  getCourses(): Observable<string[]> {
    const courses = ['Class 10', 'Class 12', 'Bachelor', 'Master', 'Diploma'];
    return of(courses).pipe(delay(100));
  }

  /**
   * Get cities list
   */
  getCities(): Observable<string[]> {
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Kochi', 'Lucknow'];
    return of(cities).pipe(delay(100));
  }
}
