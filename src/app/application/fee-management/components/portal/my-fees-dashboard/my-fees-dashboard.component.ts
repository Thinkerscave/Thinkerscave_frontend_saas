import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';

interface FeeInstallment {
    id: string;
    name: string;
    dueDate: Date;
    amount: number;
    paid: number;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
    paymentDate?: Date;
}

interface FeeBreakdown {
    feeHead: string;
    amount: number;
    discount: number;
    netAmount: number;
}

interface RecentPayment {
    id: string;
    date: Date;
    amount: number;
    mode: string;
    receiptNo: string;
}

@Component({
    selector: 'app-my-fees-dashboard',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TableModule, TagModule, TooltipModule, ProgressBarModule],
    template: `
    <div class="my-fees-dashboard">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-wallet"></i> My Fees</h2>
          <p>View your fee details and payment history</p>
        </div>
        <div class="header-actions">
          <button pButton label="Payment History" icon="pi pi-history" class="p-button-outlined" routerLink="history"></button>
          <button pButton label="Pay Now" icon="pi pi-credit-card" class="p-button-success" routerLink="pay"></button>
        </div>
      </div>

      <!-- Student Info Banner -->
      <div class="student-banner">
        <div class="student-avatar">
          <i class="pi pi-user"></i>
        </div>
        <div class="student-info">
          <h3>{{ studentName }}</h3>
          <div class="student-meta">
            <span><i class="pi pi-id-card"></i> {{ admissionNo }}</span>
            <span><i class="pi pi-book"></i> {{ className }}</span>
            <span><i class="pi pi-calendar"></i> {{ academicYear }}</span>
          </div>
        </div>
        <div class="student-status" *ngIf="hasOverdue">
          <p-tag value="Payment Overdue" severity="danger" icon="pi pi-exclamation-triangle"></p-tag>
        </div>
      </div>

      <!-- Fee Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card total">
          <div class="card-icon"><i class="pi pi-file-edit"></i></div>
          <div class="card-content">
            <span class="label">Total Annual Fee</span>
            <span class="value">₹{{ totalFee | number }}</span>
          </div>
        </div>
        <div class="summary-card discount">
          <div class="card-icon"><i class="pi pi-percentage"></i></div>
          <div class="card-content">
            <span class="label">Total Discount</span>
            <span class="value">₹{{ totalDiscount | number }}</span>
          </div>
        </div>
        <div class="summary-card paid">
          <div class="card-icon"><i class="pi pi-check-circle"></i></div>
          <div class="card-content">
            <span class="label">Amount Paid</span>
            <span class="value">₹{{ amountPaid | number }}</span>
          </div>
        </div>
        <div class="summary-card due">
          <div class="card-icon"><i class="pi pi-exclamation-circle"></i></div>
          <div class="card-content">
            <span class="label">Balance Due</span>
            <span class="value">₹{{ balanceDue | number }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Progress -->
      <div class="progress-section">
        <div class="progress-header">
          <span>Payment Progress</span>
          <span class="progress-value">{{ paymentProgress }}% Complete</span>
        </div>
        <p-progressBar [value]="paymentProgress" [showValue]="false" [style]="{'height':'12px'}"></p-progressBar>
        <div class="progress-labels">
          <span>₹0</span>
          <span>₹{{ netFee | number }}</span>
        </div>
      </div>

      <div class="content-row">
        <!-- Installments Section -->
        <div class="installments-section">
          <div class="section-header">
            <h3><i class="pi pi-calendar"></i> Payment Schedule</h3>
          </div>
          <div class="installment-list">
            <div class="installment-item" *ngFor="let inst of installments" [ngClass]="inst.status.toLowerCase()">
              <div class="installment-main">
                <div class="installment-info">
                  <strong>{{ inst.name }}</strong>
                  <span class="due-date">Due: {{ inst.dueDate | date:'dd MMM yyyy' }}</span>
                </div>
                <div class="installment-amount">
                  <span class="amount">₹{{ inst.amount | number }}</span>
                  <p-tag [value]="getStatusLabel(inst)" [severity]="getStatusSeverity(inst.status)"></p-tag>
                </div>
              </div>
              <div class="installment-actions" *ngIf="inst.status !== 'PAID'">
                <button pButton label="Pay ₹{{ inst.amount - inst.paid | number }}" icon="pi pi-credit-card"
                        class="p-button-sm" [routerLink]="['pay']" [queryParams]="{installment: inst.id}"></button>
              </div>
              <div class="installment-paid" *ngIf="inst.status === 'PAID'">
                <i class="pi pi-check"></i> Paid on {{ inst.paymentDate | date:'dd MMM yyyy' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Fee Breakdown -->
        <div class="breakdown-section">
          <div class="section-header">
            <h3><i class="pi pi-list"></i> Fee Breakdown</h3>
          </div>
          <div class="breakdown-table">
            <div class="breakdown-row header">
              <span>Fee Head</span>
              <span>Amount</span>
              <span>Discount</span>
              <span>Net</span>
            </div>
            <div class="breakdown-row" *ngFor="let item of feeBreakdown">
              <span>{{ item.feeHead }}</span>
              <span>₹{{ item.amount | number }}</span>
              <span class="discount">{{ item.discount > 0 ? '-₹' + (item.discount | number) : '-' }}</span>
              <span class="net">₹{{ item.netAmount | number }}</span>
            </div>
            <div class="breakdown-row total">
              <span>Total</span>
              <span>₹{{ totalFee | number }}</span>
              <span class="discount">-₹{{ totalDiscount | number }}</span>
              <span class="net"><strong>₹{{ netFee | number }}</strong></span>
            </div>
          </div>

          <!-- Applied Concessions -->
          <div class="concessions-box" *ngIf="appliedConcessions.length > 0">
            <h4><i class="pi pi-tag"></i> Applied Concessions</h4>
            <div class="concession-item" *ngFor="let con of appliedConcessions">
              <span>{{ con.name }}</span>
              <span class="amount">-₹{{ con.amount | number }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Payments -->
      <div class="recent-payments">
        <div class="section-header">
          <h3><i class="pi pi-history"></i> Recent Payments</h3>
          <a routerLink="history" class="view-all">View All <i class="pi pi-arrow-right"></i></a>
        </div>
        <p-table [value]="recentPayments" styleClass="p-datatable-striped" *ngIf="recentPayments.length > 0">
          <ng-template pTemplate="header">
            <tr>
              <th>Date</th>
              <th>Receipt No</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Action</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-pay>
            <tr>
              <td>{{ pay.date | date:'dd MMM yyyy' }}</td>
              <td><code>{{ pay.receiptNo }}</code></td>
              <td class="text-success"><strong>₹{{ pay.amount | number }}</strong></td>
              <td><p-tag [value]="pay.mode" [severity]="getModeSeverity(pay.mode)"></p-tag></td>
              <td>
                <button pButton icon="pi pi-download" class="p-button-text p-button-sm" pTooltip="Download Receipt" [routerLink]="['receipts']" [queryParams]="{id: pay.receiptNo}"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
        <div class="no-payments" *ngIf="recentPayments.length === 0">
          <i class="pi pi-inbox"></i>
          <p>No payments made yet</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <div class="action-card" routerLink="receipts">
          <i class="pi pi-receipt"></i>
          <span>My Receipts</span>
        </div>
        <div class="action-card" routerLink="history">
          <i class="pi pi-history"></i>
          <span>Payment History</span>
        </div>
        <div class="action-card" (click)="downloadStatement()">
          <i class="pi pi-file-pdf"></i>
          <span>Download Statement</span>
        </div>
        <div class="action-card" (click)="contactSupport()">
          <i class="pi pi-question-circle"></i>
          <span>Need Help?</span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .my-fees-dashboard { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .student-banner { display: flex; align-items: center; gap: 1.25rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; color: white; }
    .student-avatar { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; }
    .student-info { flex: 1; }
    .student-info h3 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .student-meta { display: flex; gap: 1.5rem; font-size: 0.875rem; opacity: 0.9; }
    .student-meta span { display: flex; align-items: center; gap: 0.35rem; }
    .student-status { margin-left: auto; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .summary-card { display: flex; gap: 1rem; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; }
    .card-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .summary-card.total .card-icon { background: #e0e7ff; color: #4f46e5; }
    .summary-card.discount .card-icon { background: #dcfce7; color: #16a34a; }
    .summary-card.paid .card-icon { background: #dbeafe; color: #2563eb; }
    .summary-card.due .card-icon { background: #fee2e2; color: #dc2626; }
    .card-content { display: flex; flex-direction: column; }
    .card-content .label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .card-content .value { font-size: 1.5rem; font-weight: 700; }

    .progress-section { background: var(--surface-card); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .progress-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .progress-value { font-weight: 600; color: var(--primary-color); }
    .progress-labels { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-color-secondary); }

    .content-row { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .installments-section, .breakdown-section { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; }
    .view-all { font-size: 0.875rem; color: var(--primary-color); text-decoration: none; display: flex; align-items: center; gap: 0.25rem; }
    .view-all:hover { text-decoration: underline; }

    .installment-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .installment-item { padding: 1rem; background: var(--surface-ground); border-radius: 10px; border-left: 4px solid var(--surface-border); }
    .installment-item.paid { border-left-color: #16a34a; }
    .installment-item.partial { border-left-color: #f59e0b; }
    .installment-item.pending { border-left-color: #3b82f6; }
    .installment-item.overdue { border-left-color: #dc2626; background: #fef2f2; }
    .installment-main { display: flex; justify-content: space-between; align-items: center; }
    .installment-info { display: flex; flex-direction: column; }
    .installment-info strong { margin-bottom: 0.25rem; }
    .due-date { font-size: 0.75rem; color: var(--text-color-secondary); }
    .installment-amount { display: flex; align-items: center; gap: 0.75rem; }
    .installment-amount .amount { font-size: 1.125rem; font-weight: 600; }
    .installment-actions { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--surface-border); }
    .installment-paid { margin-top: 0.5rem; font-size: 0.75rem; color: #16a34a; display: flex; align-items: center; gap: 0.35rem; }

    .breakdown-table { margin-bottom: 1rem; }
    .breakdown-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 0.75rem; border-bottom: 1px solid var(--surface-border); font-size: 0.875rem; }
    .breakdown-row.header { font-weight: 600; background: var(--surface-ground); border-radius: 6px 6px 0 0; }
    .breakdown-row.total { font-weight: 600; background: var(--surface-ground); border-radius: 0 0 6px 6px; border-bottom: none; }
    .breakdown-row .discount { color: #16a34a; }
    .breakdown-row .net { font-weight: 500; }

    .concessions-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; }
    .concessions-box h4 { margin: 0 0 0.75rem; font-size: 0.875rem; color: #16a34a; display: flex; align-items: center; gap: 0.5rem; }
    .concession-item { display: flex; justify-content: space-between; font-size: 0.875rem; padding: 0.35rem 0; }
    .concession-item .amount { color: #16a34a; font-weight: 500; }

    .recent-payments { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .text-success { color: #16a34a; }
    code { background: var(--surface-ground); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
    .no-payments { text-align: center; padding: 2rem; color: var(--text-color-secondary); }
    .no-payments i { font-size: 2rem; margin-bottom: 0.5rem; display: block; }

    .quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .action-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; background: var(--surface-card); border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.2s; }
    .action-card:hover { background: var(--primary-color); color: white; transform: translateY(-2px); }
    .action-card i { font-size: 1.5rem; }
    .action-card span { font-weight: 500; }

    @media (max-width: 992px) { .content-row { grid-template-columns: 1fr; } }
    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
      .quick-actions { grid-template-columns: repeat(2, 1fr); }
      .student-banner { flex-direction: column; text-align: center; }
      .student-meta { flex-direction: column; gap: 0.5rem; }
    }
  `]
})
export class MyFeesDashboardComponent implements OnInit {
    studentName = 'Rahul Sharma';
    admissionNo = 'ADM2024001';
    className = 'Class 10-A';
    academicYear = '2025-26';
    hasOverdue = true;

    totalFee = 72000;
    totalDiscount = 5000;
    netFee = 67000;
    amountPaid = 36000;
    balanceDue = 31000;
    paymentProgress = 54;

    installments: FeeInstallment[] = [];
    feeBreakdown: FeeBreakdown[] = [];
    appliedConcessions: { name: string; amount: number }[] = [];
    recentPayments: RecentPayment[] = [];

    ngOnInit(): void {
        this.loadInstallments();
        this.loadFeeBreakdown();
        this.loadRecentPayments();
    }

    loadInstallments(): void {
        this.installments = [
            { id: 'INST-1', name: 'Term 1 (Apr-Jun)', dueDate: new Date('2025-04-15'), amount: 18000, paid: 18000, status: 'PAID', paymentDate: new Date('2025-04-10') },
            { id: 'INST-2', name: 'Term 2 (Jul-Sep)', dueDate: new Date('2025-07-15'), amount: 18000, paid: 18000, status: 'PAID', paymentDate: new Date('2025-07-12') },
            { id: 'INST-3', name: 'Term 3 (Oct-Dec)', dueDate: new Date('2025-10-15'), amount: 16000, paid: 0, status: 'OVERDUE' },
            { id: 'INST-4', name: 'Term 4 (Jan-Mar)', dueDate: new Date('2026-01-15'), amount: 15000, paid: 0, status: 'PENDING' }
        ];
    }

    loadFeeBreakdown(): void {
        this.feeBreakdown = [
            { feeHead: 'Tuition Fee', amount: 48000, discount: 5000, netAmount: 43000 },
            { feeHead: 'Transport Fee', amount: 12000, discount: 0, netAmount: 12000 },
            { feeHead: 'Lab Fee', amount: 6000, discount: 0, netAmount: 6000 },
            { feeHead: 'Library Fee', amount: 3000, discount: 0, netAmount: 3000 },
            { feeHead: 'Sports Fee', amount: 3000, discount: 0, netAmount: 3000 }
        ];

        this.appliedConcessions = [
            { name: 'Sibling Discount', amount: 5000 }
        ];
    }

    loadRecentPayments(): void {
        this.recentPayments = [
            { id: '1', date: new Date('2025-07-12'), amount: 18000, mode: 'Online', receiptNo: 'RCP-2025-0234' },
            { id: '2', date: new Date('2025-04-10'), amount: 18000, mode: 'Cash', receiptNo: 'RCP-2025-0089' }
        ];
    }

    getStatusLabel(inst: FeeInstallment): string {
        if (inst.status === 'PAID') return 'Paid';
        if (inst.status === 'PARTIAL') return `Partial (₹${inst.paid})`;
        if (inst.status === 'OVERDUE') return 'Overdue';
        return 'Pending';
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
            'PAID': 'success',
            'PARTIAL': 'warn',
            'PENDING': 'info',
            'OVERDUE': 'danger'
        };
        return map[status] || 'info';
    }

    getModeSeverity(mode: string): 'success' | 'info' | 'warn' {
        if (mode === 'Online') return 'success';
        if (mode === 'Cash') return 'info';
        return 'warn';
    }

    downloadStatement(): void {
        // Download statement logic
    }

    contactSupport(): void {
        // Contact support logic
    }
}
