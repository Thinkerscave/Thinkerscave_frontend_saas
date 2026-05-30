import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FeeStorageService, FeeStructure } from '../../../services/fee-storage.service';

@Component({
  selector: 'app-fee-structure-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule, TooltipModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="fee-structure-list">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
      
      <div class="page-header">
        <div>
          <h2><i class="pi pi-sitemap"></i> Fee Structures</h2>
          <p>Map fee groups to classes/programs with amounts and due dates</p>
        </div>
        <button pButton label="Create Structure" icon="pi pi-plus" routerLink="create"></button>
      </div>
      <div class="content-card">
        <p-table [value]="structures" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Structure Name</th>
              <th>Class/Program</th>
              <th>Academic Year</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-structure>
            <tr>
              <td><strong>{{ structure.name }}</strong></td>
              <td>{{ structure.classProgram }}</td>
              <td>{{ structure.academicYear }}</td>
              <td>₹{{ structure.totalAmount | number }}</td>
              <td>
                <p-tag [value]="structure.isActive ? 'Active' : 'Inactive'" [severity]="structure.isActive ? 'success' : 'danger'"></p-tag>
                <p-tag *ngIf="structure.isLocked" value="Locked" severity="secondary" class="ml-1"></p-tag>
              </td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" [routerLink]="['view', structure.id]" pTooltip="View"></button>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" [routerLink]="['edit', structure.id]" pTooltip="Edit" [disabled]="structure.isLocked"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="confirmDelete(structure)" pTooltip="Delete" [disabled]="structure.isLocked"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-sitemap" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                  <p>No fee structures configured yet</p>
                  <button pButton label="Create First Fee Structure" icon="pi pi-plus" routerLink="create"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .fee-structure-list { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .empty-state { padding: 2rem; text-align: center; }
    .empty-state p { margin: 1rem 0; color: var(--text-color-secondary); }
    .ml-1 { margin-left: 0.5rem; }
  `]
})
export class FeeStructureListComponent implements OnInit {
  structures: FeeStructure[] = [];

  constructor(
    private feeStorage: FeeStorageService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadStructures();
  }

  loadStructures(): void {
    this.structures = this.feeStorage.getFeeStructures();
  }

  confirmDelete(structure: FeeStructure): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${structure.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.feeStorage.deleteFeeStructure(structure.id);
        this.loadStructures();
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Fee structure has been deleted',
          life: 3000
        });
      }
    });
  }
}
