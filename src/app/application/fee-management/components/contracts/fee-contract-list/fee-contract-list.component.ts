import { Component , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
@Component({
    selector: 'app-fee-contract-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule],
    template: `
    <div class="component-container">
      <div class="page-header">
        <div><h2><i class="pi pi-file"></i> Fee Contracts</h2><p>Manage student fee contracts</p></div>
        <button pButton label="Generate Contracts" icon="pi pi-plus" routerLink="generate"></button>
      </div>
      <div class="content-card">
        <p-table [value]="contracts" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header"><tr><th>Contract #</th><th>Student</th><th>Class</th><th>Net Amount</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></ng-template>
          <ng-template pTemplate="body" let-c>
            <tr>
              <td><code>{{c.contractNumber}}</code></td><td>{{c.studentName}}</td><td>{{c.className}}</td>
              <td>₹{{c.netAmount | number}}</td><td class="text-success">₹{{c.paidAmount | number}}</td><td class="text-danger">₹{{c.outstandingAmount | number}}</td>
              <td><p-tag [value]="c.status" [severity]="c.status==='ACTIVE'?'success':'info'"></p-tag></td>
              <td><button pButton icon="pi pi-eye" class="p-button-text p-button-sm" [routerLink]="['view', c.id]"></button></td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage"><tr><td colspan="8" class="text-center p-4">No contracts found</td></tr></ng-template>
        </p-table>
      </div>
    </div>
  `,
    styles: [`.component-container{padding:1.5rem}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}.page-header h2{margin:0;display:flex;align-items:center;gap:.5rem}.page-header p{margin:.25rem 0 0;color:var(--text-color-secondary)}.content-card{background:var(--surface-card);border-radius:12px;padding:1.5rem}code{background:var(--surface-ground);padding:.25rem .5rem;border-radius:4px}.text-success{color:#10b981}.text-danger{color:#ef4444}`]
})
export class FeeContractListComponent {
    contracts = [
        { id: '1', contractNumber: 'FC-2026-0001', studentName: 'Rahul Sharma', className: 'Class 10-A', netAmount: 72000, paidAmount: 36000, outstandingAmount: 36000, status: 'ACTIVE' },
        { id: '2', contractNumber: 'FC-2026-0002', studentName: 'Priya Patel', className: 'Class 8-B', netAmount: 65000, paidAmount: 65000, outstandingAmount: 0, status: 'COMPLETED' }
    ];
}
