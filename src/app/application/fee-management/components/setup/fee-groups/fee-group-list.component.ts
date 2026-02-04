import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FeeStorageService, FeeGroup } from '../../../services/fee-storage.service';

@Component({
  selector: 'app-fee-group-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule, TooltipModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="fee-group-list">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
      
      <div class="page-header">
        <div>
          <h2><i class="pi pi-th-large"></i> Fee Groups</h2>
          <p>Bundle multiple fee heads into packages</p>
        </div>
        <button pButton label="Create Fee Group" icon="pi pi-plus" routerLink="create"></button>
      </div>
      <div class="content-card">
        <p-table [value]="feeGroups" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Code</th>
              <th>Group Name</th>
              <th>Fee Heads</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-group>
            <tr>
              <td><code>{{ group.code }}</code></td>
              <td><strong>{{ group.name }}</strong></td>
              <td>{{ group.feeHeadIds?.length || 0 }} heads</td>
              <td>₹{{ group.totalAmount | number }}</td>
              <td><p-tag [value]="group.isActive ? 'Active' : 'Inactive'" [severity]="group.isActive ? 'success' : 'danger'"></p-tag></td>
              <td>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" [routerLink]="['edit', group.id]" pTooltip="Edit"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="confirmDelete(group)" pTooltip="Delete"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-th-large" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                  <p>No fee groups configured yet</p>
                  <button pButton label="Create First Fee Group" icon="pi pi-plus" routerLink="create"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .fee-group-list { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .empty-state { padding: 2rem; text-align: center; }
    .empty-state p { margin: 1rem 0; color: var(--text-color-secondary); }
    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; }
  `]
})
export class FeeGroupListComponent implements OnInit {
  feeGroups: FeeGroup[] = [];

  constructor(
    private feeStorage: FeeStorageService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadFeeGroups();
  }

  loadFeeGroups(): void {
    this.feeGroups = this.feeStorage.getFeeGroups();
  }

  confirmDelete(group: FeeGroup): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${group.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.feeStorage.deleteFeeGroup(group.id);
        this.loadFeeGroups();
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Fee group has been deleted',
          life: 3000
        });
      }
    });
  }
}
