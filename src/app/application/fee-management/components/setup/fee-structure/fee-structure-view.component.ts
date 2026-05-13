import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';

interface FeeHead {
  code: string;
  name: string;
  category: string;
  amount: number;
}

interface Installment {
  name: string;
  amount: number;
  dueDate: Date;
  percentage: number;
  status: string;
}

@Component({
  selector: 'app-fee-structure-view',
  standalone: true,
  imports: [
    CommonModule, RouterModule, CardModule, ButtonModule,
    TagModule, TableModule, DividerModule, TimelineModule
  ],
  template: `
    <div class="fee-structure-view">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-sitemap"></i> {{ structure.name }}</h2>
          <div class="header-tags">
            <p-tag [value]="structure.status" [severity]="getStatusSeverity(structure.status)"></p-tag>
            <p-tag *ngIf="structure.isLocked" value="Locked" severity="secondary" icon="pi pi-lock"></p-tag>
          </div>
        </div>
        <div class="header-actions">
          <button pButton label="Edit" icon="pi pi-pencil" class="p-button-outlined" 
                  [routerLink]="['../edit', structureId]" [disabled]="structure.isLocked"></button>
          <button pButton label="Back to List" icon="pi pi-arrow-left" class="p-button-text" routerLink="../../"></button>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="overview-grid">
        <div class="overview-card">
          <div class="card-icon academic"><i class="pi pi-book"></i></div>
          <div class="card-content">
            <span class="label">Class/Program</span>
            <span class="value">{{ structure.className }}</span>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon calendar"><i class="pi pi-calendar"></i></div>
          <div class="card-content">
            <span class="label">Academic Year</span>
            <span class="value">{{ structure.academicYear }}</span>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon group"><i class="pi pi-th-large"></i></div>
          <div class="card-content">
            <span class="label">Fee Group</span>
            <span class="value">{{ structure.feeGroup }}</span>
          </div>
        </div>
        
        <div class="overview-card total">
          <div class="card-icon amount"><i class="pi pi-indian-rupee"></i></div>
          <div class="card-content">
            <span class="label">Total Amount</span>
            <span class="value">₹{{ structure.totalAmount | number }}</span>
          </div>
        </div>
      </div>

      <!-- Fee Breakdown -->
      <div class="content-section">
        <h3><i class="pi pi-list"></i> Fee Breakdown</h3>
        
        <p-table [value]="feeHeads" styleClass="p-datatable-sm p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Code</th>
              <th>Fee Head</th>
              <th>Category</th>
              <th class="text-right">Amount</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-head>
            <tr>
              <td><code>{{ head.code }}</code></td>
              <td><strong>{{ head.name }}</strong></td>
              <td><p-tag [value]="head.category" severity="info"></p-tag></td>
              <td class="text-right amount-cell">₹{{ head.amount | number }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr>
              <td colspan="3" class="text-right"><strong>Total:</strong></td>
              <td class="text-right"><strong class="total-amount">₹{{ structure.totalAmount | number }}</strong></td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-divider></p-divider>

      <!-- Installment Schedule -->
      <div class="content-section">
        <h3><i class="pi pi-calendar-plus"></i> Installment Schedule</h3>
        
        <div class="installment-timeline">
          <p-timeline [value]="installments" align="left">
            <ng-template pTemplate="marker" let-inst>
              <span class="installment-marker" [class]="inst.status.toLowerCase()">
                <i class="pi" [ngClass]="{'pi-check': inst.status === 'PAID', 'pi-clock': inst.status === 'PENDING', 'pi-calendar': inst.status === 'UPCOMING'}"></i>
              </span>
            </ng-template>
            <ng-template pTemplate="content" let-inst>
              <div class="installment-item">
                <div class="installment-header">
                  <strong>{{ inst.name }}</strong>
                  <p-tag [value]="inst.status" [severity]="getInstallmentSeverity(inst.status)"></p-tag>
                </div>
                <div class="installment-details">
                  <span class="installment-amount">₹{{ inst.amount | number }}</span>
                  <span class="installment-meta">{{ inst.percentage }}% • Due: {{ inst.dueDate | date:'mediumDate' }}</span>
                </div>
              </div>
            </ng-template>
          </p-timeline>
        </div>

        <div class="installment-summary">
          <div class="summary-item">
            <span>Total Installments</span>
            <strong>{{ installments.length }}</strong>
          </div>
          <div class="summary-item">
            <span>Scheduled Amount</span>
            <strong>₹{{ getInstallmentTotal() | number }}</strong>
          </div>
        </div>
      </div>

      <p-divider></p-divider>

      <!-- Audit Info -->
      <div class="content-section audit-section">
        <h3><i class="pi pi-history"></i> Audit Information</h3>
        
        <div class="audit-grid">
          <div class="audit-item">
            <span class="audit-label">Created By</span>
            <span class="audit-value">{{ structure.createdBy }}</span>
          </div>
          <div class="audit-item">
            <span class="audit-label">Created On</span>
            <span class="audit-value">{{ structure.createdAt | date:'medium' }}</span>
          </div>
          <div class="audit-item">
            <span class="audit-label">Last Modified By</span>
            <span class="audit-value">{{ structure.modifiedBy }}</span>
          </div>
          <div class="audit-item">
            <span class="audit-label">Last Modified On</span>
            <span class="audit-value">{{ structure.modifiedAt | date:'medium' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fee-structure-view { padding: 1.5rem; max-width: 1100px; }
    
    .page-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-bottom: 2rem; 
    }
    
    .page-header h2 { 
      margin: 0 0 0.5rem; 
      display: flex; 
      align-items: center; 
      gap: 0.5rem; 
      color: #1e293b;
    }
    
    .header-tags { display: flex; gap: 0.5rem; }
    .header-actions { display: flex; gap: 0.5rem; }
    
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .overview-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .overview-card.total {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-color: #86efac;
    }
    
    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .card-icon.academic { background: #dbeafe; color: #3b82f6; }
    .card-icon.calendar { background: #fef3c7; color: #f59e0b; }
    .card-icon.group { background: #ede9fe; color: #8b5cf6; }
    .card-icon.amount { background: #d1fae5; color: #10b981; }
    
    .card-content { display: flex; flex-direction: column; gap: 0.25rem; }
    .card-content .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .card-content .value { font-size: 1.1rem; font-weight: 600; color: #1e293b; }
    
    .content-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .content-section h3 {
      margin: 0 0 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #334155;
    }
    
    .content-section h3 i { color: #6366f1; }
    
    code {
      background: #f1f5f9;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8rem;
    }
    
    .text-right { text-align: right; }
    .amount-cell { color: #10b981; font-weight: 500; }
    .total-amount { color: #10b981; font-size: 1.1rem; }
    
    .installment-timeline { margin-bottom: 1.5rem; }
    
    .installment-marker {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .installment-marker.paid { background: #10b981; }
    .installment-marker.pending { background: #f59e0b; }
    .installment-marker.upcoming { background: #94a3b8; }
    
    .installment-item {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1rem;
      margin-left: 1rem;
    }
    
    .installment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .installment-amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }
    
    .installment-meta {
      font-size: 0.875rem;
      color: #64748b;
      margin-left: 0.5rem;
    }
    
    .installment-summary {
      display: flex;
      gap: 2rem;
      padding: 1rem;
      background: #f1f5f9;
      border-radius: 8px;
    }
    
    .summary-item { display: flex; gap: 0.5rem; align-items: center; }
    .summary-item span { color: #64748b; }
    .summary-item strong { color: #1e293b; }
    
    .audit-section { background: #f8fafc; }
    
    .audit-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .audit-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .audit-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .audit-value { font-weight: 500; color: #334155; }
    
    @media (max-width: 992px) {
      .overview-grid { grid-template-columns: repeat(2, 1fr); }
    }
    
    @media (max-width: 768px) {
      .overview-grid { grid-template-columns: 1fr; }
      .audit-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 1rem; }
    }
  `]
})
export class FeeStructureViewComponent implements OnInit {
  structureId: string | null = null;

  structure = {
    name: 'Class 10 - Regular 2025-26',
    status: 'ACTIVE',
    isLocked: false,
    className: 'Class 10',
    academicYear: '2025-26',
    feeGroup: 'Regular Admission Package',
    totalAmount: 65000,
    createdBy: 'Admin User',
    createdAt: new Date(2025, 0, 15),
    modifiedBy: 'Admin User',
    modifiedAt: new Date(2025, 0, 20)
  };

  feeHeads: FeeHead[] = [
    { code: 'TUI001', name: 'Tuition Fee', category: 'ACADEMIC', amount: 55000 },
    { code: 'LAB001', name: 'Laboratory Fee', category: 'ACADEMIC', amount: 5000 },
    { code: 'LIB001', name: 'Library Fee', category: 'ACADEMIC', amount: 2000 },
    { code: 'EXM001', name: 'Examination Fee', category: 'ACADEMIC', amount: 3000 }
  ];

  installments: Installment[] = [
    { name: 'First Quarter', amount: 16250, dueDate: new Date(2025, 3, 15), percentage: 25, status: 'PAID' },
    { name: 'Second Quarter', amount: 16250, dueDate: new Date(2025, 6, 15), percentage: 25, status: 'PENDING' },
    { name: 'Third Quarter', amount: 16250, dueDate: new Date(2025, 9, 15), percentage: 25, status: 'UPCOMING' },
    { name: 'Fourth Quarter', amount: 16250, dueDate: new Date(2026, 0, 15), percentage: 25, status: 'UPCOMING' }
  ];

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.structureId = this.route.snapshot.paramMap.get('id');
    // Load structure data based on ID
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'warn' | 'info'> = {
      'ACTIVE': 'success',
      'DRAFT': 'warn',
      'LOCKED': 'info'
    };
    return map[status] || 'info';
  }

  getInstallmentSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'warn' | 'secondary'> = {
      'PAID': 'success',
      'PENDING': 'warn',
      'UPCOMING': 'secondary'
    };
    return map[status] || 'secondary';
  }

  getInstallmentTotal(): number {
    return this.installments.reduce((sum, inst) => sum + inst.amount, 0);
  }
}
