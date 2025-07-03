import { Component, ViewChild } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
export interface LeaveRequest {
  id: number;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  days: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}
@Component({
  selector: 'app-leave-management',
  imports: [TableModule,
    CardModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    DropdownModule,
    CommonModule,
    FormsModule,
    TooltipModule
  ],
  templateUrl: './leave-management.component.html',
  styleUrl: './leave-management.component.scss'
})
export class LeaveManagementComponent {
  // --- ADD THIS LINE ---
  // Get a reference to the p-table component in the template.
  // The '#dt' in the HTML corresponds to this.
  @ViewChild('dt') dt: Table | undefined;

  leaveRequests: LeaveRequest[] = [];
  statuses: any[] = [];

  constructor() { }
  // --- ADD THIS FUNCTION ---
  /**
   * Handles the global filter event from the search input.
   * @param event The input event.
   */
  onGlobalFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dt?.filterGlobal(filterValue, 'contains');
  }
  ngOnInit(): void {
    // Populate with mock data
    this.leaveRequests = [
      { id: 1, employeeName: 'John Doe', leaveType: 'Vacation', startDate: new Date('2025-07-15'), endDate: new Date('2025-07-20'), days: 6, status: 'Pending' },
      { id: 2, employeeName: 'Jane Smith', leaveType: 'Sick Leave', startDate: new Date('2025-07-10'), endDate: new Date('2025-07-11'), days: 2, status: 'Approved' },
      { id: 3, employeeName: 'Peter Jones', leaveType: 'Personal Leave', startDate: new Date('2025-08-01'), endDate: new Date('2025-08-01'), days: 1, status: 'Rejected' },
      { id: 4, employeeName: 'Mary Johnson', leaveType: 'Vacation', startDate: new Date('2025-09-10'), endDate: new Date('2025-09-15'), days: 6, status: 'Pending' },
      { id: 5, employeeName: 'David Williams', leaveType: 'Maternity Leave', startDate: new Date('2025-07-20'), endDate: new Date('2025-10-20'), days: 92, status: 'Approved' },
      { id: 6, employeeName: 'Sarah Miller', leaveType: 'Sick Leave', startDate: new Date('2025-07-22'), endDate: new Date('2025-07-22'), days: 1, status: 'Approved' },
      { id: 7, employeeName: 'Chris Brown', leaveType: 'Vacation', startDate: new Date('2025-10-05'), endDate: new Date('2025-10-10'), days: 6, status: 'Rejected' },
    ];

    // Status options for the dropdown filter
    this.statuses = [
      { label: 'Pending', value: 'Pending' },
      { label: 'Approved', value: 'Approved' },
      { label: 'Rejected', value: 'Rejected' }
    ];
  }

  /**
   * Returns the severity color for the status tag.
   * @param status The status string.
   * @returns 'success' for Approved, 'warning' for Pending, 'danger' for Rejected.
   */
  getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | undefined {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'danger';
      default:
        return undefined;
    }
  }

  /**
   * Logic to approve a leave request.
   * In a real app, this would call a service to update the backend.
   * @param request The leave request to approve.
   */
  approveRequest(request: LeaveRequest): void {
    request.status = 'Approved';
    console.log(`Request ID ${request.id} for ${request.employeeName} has been approved.`);
    // Here you would typically call a service: this.leaveService.updateRequest(request);
  }

  /**
   * Logic to reject a leave request.
   * In a real app, this would call a service to update the backend.
   * @param request The leave request to reject.
   */
  rejectRequest(request: LeaveRequest): void {
    request.status = 'Rejected';
    console.log(`Request ID ${request.id} for ${request.employeeName} has been rejected.`);
    // Here you would typically call a service: this.leaveService.updateRequest(request);
  }
}
