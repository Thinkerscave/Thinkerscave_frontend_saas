import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AppToastComponent } from '../../../../../core/feedback/app-toast.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FeeStorageService, FeeHead } from '../../../services/fee-storage.service';

@Component({
  selector: 'app-fee-head-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AppToastComponent, CommonModule, RouterModule, TableModule, ButtonModule, TagModule, TooltipModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="fee-head-list">
      <app-toast></app-toast>
      <p-confirmDialog></p-confirmDialog>
      
      <div class="page-header">
        <div>
          <h2><i class="pi pi-list"></i> Fee Heads</h2>
          <p>Manage fee head masters (Tuition, Lab, Library, etc.)</p>
        </div>
        <button pButton label="Create Fee Head" icon="pi pi-plus" routerLink="create"></button>
      </div>
      <div class="content-card">
        <p-table [value]="feeHeads" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Default Amount</th>
              <th>Frequency</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-head>
            <tr>
              <td><code>{{ head.code }}</code></td>
              <td><strong>{{ head.name }}</strong></td>
              <td><p-tag [value]="head.category" severity="info"></p-tag></td>
              <td>₹{{ head.defaultAmount | number }}</td>
              <td>{{ head.frequency }}</td>
              <td><p-tag [value]="head.isActive ? 'Active' : 'Inactive'" [severity]="head.isActive ? 'success' : 'danger'"></p-tag></td>
              <td>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" [routerLink]="['edit', head.id]" pTooltip="Edit"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="confirmDelete(head)" pTooltip="Delete"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-list" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                  <p>No fee heads configured yet</p>
                  <button pButton label="Create First Fee Head" icon="pi pi-plus" routerLink="create"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .fee-head-list { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .empty-state { padding: 2rem; text-align: center; }
    .empty-state p { margin: 1rem 0; color: var(--text-color-secondary); }
    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; }
  `]
})
export class FeeHeadListComponent implements OnInit {
  feeHeads: FeeHead[] = [];

  constructor(
    private feeStorage: FeeStorageService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadFeeHeads();
  }

  loadFeeHeads(): void {
    this.feeHeads = this.feeStorage.getFeeHeads();
  }

  confirmDelete(head: FeeHead): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${head.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.feeStorage.deleteFeeHead(head.id);
        this.loadFeeHeads();
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Fee head has been deleted',
          life: 3000
        });
      }
    });
  }
}
