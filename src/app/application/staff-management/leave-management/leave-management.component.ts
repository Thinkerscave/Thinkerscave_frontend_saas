import { Component, OnInit, ViewChild , ChangeDetectionStrategy} from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';

import { MessageService } from 'primeng/api';
import { StandardListViewComponent } from '../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../shared/components/standard-list-view/list-view-models';
import { LeaveResponseDTO, LeaveService, LeaveRequestDTO, LeaveType } from '../../../services/leave.service';
import { LoginService } from '../../../core/services/login.service';

@Component({
  selector: 'app-leave-management',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableModule, CardModule, ButtonModule, TagModule, InputTextModule,
    DropdownModule, CommonModule, FormsModule, ReactiveFormsModule,
    TooltipModule, ToastModule, StandardListViewComponent, DialogModule
  ],
  providers: [MessageService],
  templateUrl: './leave-management.component.html',
  styleUrl: './leave-management.component.scss'
})
export class LeaveManagementComponent implements OnInit {
  @ViewChild('dt') dt: Table | undefined;

  leaveRequests: LeaveResponseDTO[] = [];
  loading = false;
  applyDialogVisible = false;
  applyForm!: FormGroup;
  isAdmin = false;

  leaveTypeOptions = [
    { label: 'Vacation', value: 'VACATION' },
    { label: 'Sick Leave', value: 'SICK' },
    { label: 'Personal Leave', value: 'PERSONAL' },
    { label: 'Maternity', value: 'MATERNITY' },
    { label: 'Paternity', value: 'PATERNITY' },
    { label: 'Compensatory', value: 'COMPENSATORY' },
    { label: 'Casual Leave', value: 'CASUAL' }
  ];

  constructor(
    private leaveService: LeaveService,
    private loginService: LoginService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    const roles: string[] = this.loginService.getUserRole();
    this.isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    this.initForm();
    this.loadLeaveRequests();
  }

  private initForm(): void {
    this.applyForm = this.fb.group({
      staffName: ['', Validators.required],
      department: [''],
      leaveType: [null, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['']
    });
  }

  get listViewConfig(): ListViewConfig {
    return {
      title: 'Employee Leave Requests',
      isClientSide: true, showSearch: true,
      searchPlaceholder: 'Search requests...',
      loading: this.loading,
      primaryAction: this.isAdmin ? undefined : {
        label: 'Apply Leave', icon: 'pi pi-plus', color: 'primary',
        actionFn: () => this.openApplyDialog()
      },
      columns: [
        { field: 'staffName', header: 'Employee Name', type: 'text', sortable: true },
        { field: 'leaveType', header: 'Leave Type', type: 'text', sortable: true },
        { field: 'startDate', header: 'Start Date', type: 'date', sortable: true },
        { field: 'endDate', header: 'End Date', type: 'date', sortable: true },
        { field: 'days', header: 'Days', type: 'text', sortable: true },
        { field: 'status', header: 'Status', type: 'badge', sortable: true }
      ],
      rowActions: this.isAdmin ? [
        {
          label: 'Approve', icon: 'pi pi-check', isPrimary: true, color: 'success',
          visibleFn: (req: LeaveResponseDTO) => req.status === 'PENDING',
          actionFn: (req: LeaveResponseDTO) => this.approveRequest(req)
        },
        {
          label: 'Reject', icon: 'pi pi-times', isPrimary: true, color: 'danger',
          visibleFn: (req: LeaveResponseDTO) => req.status === 'PENDING',
          actionFn: (req: LeaveResponseDTO) => this.rejectRequest(req)
        }
      ] : [
        {
          label: 'Cancel', icon: 'pi pi-ban', isPrimary: true, color: 'danger',
          visibleFn: (req: LeaveResponseDTO) => req.status === 'PENDING',
          actionFn: (req: LeaveResponseDTO) => this.cancelRequest(req)
        }
      ]
    };
  }

  private loadLeaveRequests(): void {
    this.loading = true;
    const obs = this.isAdmin ? this.leaveService.getAllLeaveRequests() : this.leaveService.getMyLeaveRequests();
    obs.subscribe({
      next: (data) => { this.leaveRequests = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openApplyDialog(): void { this.applyDialogVisible = true; }

  submitApply(): void {
    if (this.applyForm.invalid) { this.applyForm.markAllAsTouched(); return; }
    const dto: LeaveRequestDTO = {
      staffName: this.applyForm.value.staffName,
      department: this.applyForm.value.department,
      leaveType: this.applyForm.value.leaveType as LeaveType,
      startDate: this.applyForm.value.startDate,
      endDate: this.applyForm.value.endDate,
      reason: this.applyForm.value.reason
    };
    this.leaveService.applyLeave(dto).subscribe({
      next: (saved) => {
        this.leaveRequests = [saved, ...this.leaveRequests];
        this.messageService.add({ severity: 'success', summary: 'Applied', detail: 'Leave request submitted' });
        this.applyDialogVisible = false;
        this.applyForm.reset();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to apply for leave' })
    });
  }

  approveRequest(request: LeaveResponseDTO): void {
    this.leaveService.approveLeave(request.id).subscribe({
      next: (updated) => {
        this.leaveRequests = this.leaveRequests.map(r => r.id === updated.id ? updated : r);
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: `Leave approved for ${request.staffName}` });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve' })
    });
  }

  rejectRequest(request: LeaveResponseDTO): void {
    const reason = prompt('Enter rejection reason (optional):') || '';
    this.leaveService.rejectLeave(request.id, reason).subscribe({
      next: (updated) => {
        this.leaveRequests = this.leaveRequests.map(r => r.id === updated.id ? updated : r);
        this.messageService.add({ severity: 'warn', summary: 'Rejected', detail: `Leave rejected for ${request.staffName}` });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reject' })
    });
  }

  cancelRequest(request: LeaveResponseDTO): void {
    if (!confirm('Cancel this leave request?')) return;
    this.leaveService.cancelLeave(request.id).subscribe({
      next: () => {
        this.leaveRequests = this.leaveRequests.map(r => r.id === request.id ? { ...r, status: 'CANCELLED' as any } : r);
        this.messageService.add({ severity: 'info', summary: 'Cancelled' });
      }
    });
  }
}
