import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { RippleModule } from 'primeng/ripple';

import { LeadService } from '../../services/lead.service';
import { LoginService } from '../../../../services/login.service';
import { Lead, CounsellorDashboardStats } from '../../models/lead.model';
import { LeadStatus } from '../../models/lead-status.enum';
import { LeadListComponent } from '../lead-list/lead-list.component';

@Component({
  selector: 'app-counsellor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ChartModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    ToastModule,
    RouterModule,
    RippleModule,
    LeadListComponent
  ],
  templateUrl: './counsellor-dashboard.component.html',
  styleUrl: './counsellor-dashboard.component.scss',
  providers: [MessageService]
})
export class CounsellorDashboardComponent implements OnInit {
  stats: CounsellorDashboardStats | null = null;
  todayFollowups: Lead[] = [];
  overdueFollowups: Lead[] = [];
  interestedLeads: Lead[] = [];
  newLeads: Lead[] = [];
  counsellorName: string = '';
  counsellorId: string = '';
  loading = true;

  // Chart data
  chartData: any;
  chartOptions: any;

  // Menu state
  activeMenu: string = 'overview';
  previousMenu: string = 'overview';
  menuItems = [
    { id: 'overview', label: 'Overview', icon: 'pi pi-home', color: '#667eea' },
    { id: 'all-leads', label: 'All Leads', icon: 'pi pi-list', color: '#607D8B' },
    { id: 'today-followups', label: 'Today\'s Follow-ups', icon: 'pi pi-calendar', color: '#4facfe' },
    { id: 'overdue-followups', label: 'Overdue Follow-ups', icon: 'pi pi-exclamation-circle', color: '#fa709a' },
    { id: 'interested-leads', label: 'Interested Leads', icon: 'pi pi-heart-fill', color: '#30cfd0' },
    { id: 'new-leads', label: 'New Leads', icon: 'pi pi-star-fill', color: '#f093fb' },
    { id: 'lead-statistics', label: 'Statistics', icon: 'pi pi-chart-bar', color: '#a8edea' }
  ];

  constructor(
    private leadService: LeadService,
    private loginService: LoginService,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadCounsellorInfo();
    this.loadDashboardData();
    this.setupChart();

    // Check key for tab restoration
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeMenu = params['tab'];
      }
    });
  }

  /**
   * Load counsellor information from localStorage
   */
  loadCounsellorInfo(): void {
    const user = this.loginService.getUser();
    this.counsellorId = user?.id || 'C001';
    this.counsellorName = user?.name || 'Counsellor';
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.loading = true;
    Promise.all([
      this.loadStats(),
      this.loadTodayFollowups(),
      this.loadOverdueFollowups(),
      this.loadInterestedLeads(),
      this.loadNewLeads()
    ]).finally(() => {
      this.loading = false;
    });
  }

  /**
   * Load dashboard statistics
   */
  loadStats(): Promise<void> {
    return new Promise((resolve) => {
      this.leadService.getDashboardStats(this.counsellorId).subscribe({
        next: (stats) => {
          this.stats = stats;
          this.updateChart();
          resolve();
        },
        error: (err) => {
          console.error('Error loading stats', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load dashboard statistics',
            life: 3000
          });
          resolve();
        }
      });
    });
  }

  /**
   * Load today's follow-ups
   */
  loadTodayFollowups(): Promise<void> {
    return new Promise((resolve) => {
      this.leadService.getTodayFollowups(this.counsellorId).subscribe({
        next: (leads) => {
          this.todayFollowups = leads;
          resolve();
        },
        error: (err) => {
          console.error('Error loading today followups', err);
          resolve();
        }
      });
    });
  }

  /**
   * Load overdue follow-ups
   */
  loadOverdueFollowups(): Promise<void> {
    return new Promise((resolve) => {
      this.leadService.getOverdueFollowups(this.counsellorId).subscribe({
        next: (leads) => {
          this.overdueFollowups = leads;
          resolve();
        },
        error: (err) => {
          console.error('Error loading overdue followups', err);
          resolve();
        }
      });
    });
  }

  /**
   * Load interested leads
   */
  loadInterestedLeads(): Promise<void> {
    return new Promise((resolve) => {
      this.leadService.getLeadsByStatus(this.counsellorId, LeadStatus.INTERESTED).subscribe({
        next: (leads) => {
          this.interestedLeads = leads;
          resolve();
        },
        error: (err) => {
          console.error('Error loading interested leads', err);
          resolve();
        }
      });
    });
  }

  /**
   * Load new leads
   */
  loadNewLeads(): Promise<void> {
    return new Promise((resolve) => {
      this.leadService.getLeadsByStatus(this.counsellorId, LeadStatus.NEW).subscribe({
        next: (leads) => {
          this.newLeads = leads;
          resolve();
        },
        error: (err) => {
          console.error('Error loading new leads', err);
          resolve();
        }
      });
    });
  }

  /**
   * Setup chart configuration
   */
  setupChart(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const primaryColor = documentStyle.getPropertyValue('--primary-color');
    const surfaceColor = documentStyle.getPropertyValue('--surface-border');

    this.chartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor
          },
          grid: {
            color: surfaceColor,
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: surfaceColor,
            drawBorder: false
          }
        }
      }
    };
  }

  /**
   * Update chart with current data
   */
  updateChart(): void {
    if (!this.stats) return;

    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor = documentStyle.getPropertyValue('--primary-color');
    const infoColor = '#1E90FF';
    const successColor = '#10B981';
    const warningColor = '#F59E0B';

    this.chartData = {
      labels: ['New', 'Contacted', 'Interested', 'Follow-up', 'Admitted'],
      datasets: [
        {
          label: 'Lead Status Distribution',
          data: [
            this.stats.newLeads,
            this.stats.totalLeads - this.stats.newLeads - this.stats.interestedLeads,
            this.stats.interestedLeads,
            0,
            Math.round((this.stats.conversionRate / 100) * this.stats.totalLeads)
          ],
          backgroundColor: [primaryColor, infoColor, successColor, warningColor, '#8B5CF6'],
          borderColor: [primaryColor, infoColor, successColor, warningColor, '#8B5CF6'],
          borderWidth: 1
        }
      ]
    };
  }

  /**
   * Get status badge severity
   */
  getSeverity(status: string): string {
    switch (status) {
      case 'NEW':
        return 'info';
      case 'CONTACTED':
        return 'warning';
      case 'INTERESTED':
        return 'success';
      case 'FOLLOW_UP':
        return 'warning';
      case 'ADMISSION_CONFIRMED':
        return 'success';
      case 'LOST':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboardData();
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Dashboard refreshed',
      life: 2000
    });
  }

  /**
   * Set active menu item
   */
  setActiveMenu(menuId: string): void {
    this.previousMenu = this.activeMenu;
    this.activeMenu = menuId;
  }

  /**
   * Go back to previous page
   */
  goBack(): void {
    this.activeMenu = this.previousMenu;
  }
}
