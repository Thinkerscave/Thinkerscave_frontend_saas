import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FeeStorageService, FeePolicy } from '../../../services/fee-storage.service';

@Component({
  selector: 'app-fee-policy-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    ConfirmDialogModule,
    TooltipModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="fee-policy-list">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
      
      <div class="page-header">
        <div>
          <h2><i class="pi pi-file-edit"></i> Fee Policies</h2>
          <p>Manage fee policies for academic sessions</p>
        </div>
        <button pButton label="Create Policy" icon="pi pi-plus" routerLink="create"></button>
      </div>

      <div class="content-card">
        <p-table [value]="policies" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Policy Name</th>
              <th>Academic Session</th>
              <th>Status</th>
              <th>Late Fee</th>
              <th>Installments</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-policy>
            <tr>
              <td><strong>{{ policy.name }}</strong></td>
              <td>{{ policy.academicSession }}</td>
              <td>
                <p-tag [value]="policy.status" [severity]="getStatusSeverity(policy.status)"></p-tag>
              </td>
              <td>{{ policy.lateFeeEnabled ? 'Enabled' : 'Disabled' }}</td>
              <td>{{ policy.installmentsAllowed ? 'Up to ' + policy.maxInstallments : 'Not Allowed' }}</td>
              <td>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" 
                        [routerLink]="['edit', policy.id]" pTooltip="Edit"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" 
                        (click)="confirmDelete(policy)" pTooltip="Delete"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-file-edit" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                  <p>No fee policies configured yet</p>
                  <button pButton label="Create First Policy" icon="pi pi-plus" routerLink="create"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .fee-policy-list { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .empty-state { padding: 2rem; text-align: center; }
    .empty-state p { margin: 1rem 0; color: var(--text-color-secondary); }
  `]
})
export class FeePolicyListComponent implements OnInit {
  policies: FeePolicy[] = [];

  constructor(
    private feeStorage: FeeStorageService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.policies = this.feeStorage.getPolicies();
  }

  confirmDelete(policy: FeePolicy): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${policy.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.feeStorage.deletePolicy(policy.id);
        this.loadPolicies();
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Policy has been deleted',
          life: 3000
        });
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'warn' | 'info'> = { 'ACTIVE': 'success', 'DRAFT': 'warn', 'LOCKED': 'info' };
    return map[status] || 'info';
  }
}
