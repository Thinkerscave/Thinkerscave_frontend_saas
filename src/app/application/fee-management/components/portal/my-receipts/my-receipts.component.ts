import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';

interface Receipt {
  id: string;
  receiptNo: string;
  date: Date;
  amount: number;
  paymentMode: string;
  feeHeads: { name: string; amount: number }[];
  academicYear: string;
  transactionRef: string;
  status: 'ACTIVE' | 'CANCELLED';
}

@Component({
  selector: 'app-my-receipts',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, TagModule, CalendarModule, DropdownModule, TooltipModule, DialogModule, DividerModule],
  template: `
    <div class="my-receipts">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-receipt"></i> My Receipts</h2>
          <p>Download and view your payment receipts</p>
        </div>
        <div class="header-actions">
          <button pButton label="Download All" icon="pi pi-download" class="p-button-outlined" (click)="downloadAllReceipts()"></button>
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-row">
          <div class="filter-item">
            <label>Date Range</label>
            <p-calendar [(ngModel)]="dateRange" selectionMode="range" dateFormat="dd/mm/yy" [showIcon]="true" placeholder="Select dates" (onSelect)="filterReceipts()"></p-calendar>
          </div>
          <div class="filter-item">
            <label>Academic Year</label>
            <p-dropdown [options]="yearOptions" [(ngModel)]="selectedYear" optionLabel="label" optionValue="value" [showClear]="true" placeholder="All Years" (onChange)="filterReceipts()"></p-dropdown>
          </div>
          <div class="filter-actions">
            <button pButton label="Clear" icon="pi pi-filter-slash" class="p-button-text" (click)="clearFilters()"></button>
          </div>
        </div>
      </div>

      <!-- Receipts Grid -->
      <div class="receipts-grid">
        <div class="receipt-card" *ngFor="let receipt of filteredReceipts" [class.cancelled]="receipt.status === 'CANCELLED'">
          <div class="receipt-header">
            <div class="receipt-icon">
              <i class="pi pi-receipt"></i>
            </div>
            <div class="receipt-info">
              <strong>{{ receipt.receiptNo }}</strong>
              <span>{{ receipt.date | date:'dd MMM yyyy' }}</span>
            </div>
            <p-tag value="CANCELLED" severity="danger" *ngIf="receipt.status === 'CANCELLED'"></p-tag>
          </div>

          <div class="receipt-amount">
            <span class="label">Amount</span>
            <span class="value">₹{{ receipt.amount | number }}</span>
          </div>

          <div class="receipt-details">
            <div class="detail-row">
              <span>Payment Mode</span>
              <span><i [class]="getModeIcon(receipt.paymentMode)"></i> {{ receipt.paymentMode }}</span>
            </div>
            <div class="detail-row">
              <span>Academic Year</span>
              <span>{{ receipt.academicYear }}</span>
            </div>
            <div class="detail-row">
              <span>Fee Heads</span>
              <span>{{ receipt.feeHeads.length }} items</span>
            </div>
          </div>

          <div class="receipt-actions">
            <button pButton label="View" icon="pi pi-eye" class="p-button-outlined p-button-sm" (click)="viewReceipt(receipt)"></button>
            <button pButton label="Download" icon="pi pi-download" class="p-button-sm" (click)="downloadReceipt(receipt)" [disabled]="receipt.status === 'CANCELLED'"></button>
          </div>
        </div>

        <div class="no-receipts" *ngIf="filteredReceipts.length === 0">
          <i class="pi pi-inbox"></i>
          <h3>No Receipts Found</h3>
          <p>No payment receipts match your search criteria</p>
        </div>
      </div>

      <!-- Receipt View Dialog -->
      <p-dialog [(visible)]="showReceiptDialog" [header]="'Receipt Details'" [modal]="true" [style]="{width:'600px'}">
        <div class="receipt-view" *ngIf="selectedReceipt">
          <!-- Receipt Header -->
          <div class="receipt-view-header">
            <div class="school-info">
              <div class="school-logo">
                <i class="pi pi-building"></i>
              </div>
              <div>
                <h3>Thinkers Cave School</h3>
                <p>123 Education Lane, Knowledge City</p>
              </div>
            </div>
            <div class="receipt-number">
              <span class="label">Receipt No</span>
              <strong>{{ selectedReceipt.receiptNo }}</strong>
            </div>
          </div>

          <p-divider></p-divider>

          <!-- Student & Payment Info -->
          <div class="receipt-view-info">
            <div class="info-column">
              <h4>Student Details</h4>
              <div class="info-row">
                <span>Name:</span>
                <strong>Rahul Sharma</strong>
              </div>
              <div class="info-row">
                <span>Admission No:</span>
                <strong>ADM2024001</strong>
              </div>
              <div class="info-row">
                <span>Class:</span>
                <strong>Class 10-A</strong>
              </div>
            </div>
            <div class="info-column">
              <h4>Payment Details</h4>
              <div class="info-row">
                <span>Date:</span>
                <strong>{{ selectedReceipt.date | date:'dd MMM yyyy' }}</strong>
              </div>
              <div class="info-row">
                <span>Mode:</span>
                <strong>{{ selectedReceipt.paymentMode }}</strong>
              </div>
              <div class="info-row" *ngIf="selectedReceipt.transactionRef">
                <span>Ref:</span>
                <code>{{ selectedReceipt.transactionRef }}</code>
              </div>
            </div>
          </div>

          <p-divider></p-divider>

          <!-- Fee Heads Table -->
          <div class="fee-heads-table">
            <h4>Fee Particulars</h4>
            <table>
              <thead>
                <tr>
                  <th>Sl.</th>
                  <th>Particulars</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let fh of selectedReceipt.feeHeads; let i = index">
                  <td>{{ i + 1 }}</td>
                  <td>{{ fh.name }}</td>
                  <td>₹{{ fh.amount | number }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2"><strong>Total Amount</strong></td>
                  <td><strong>₹{{ selectedReceipt.amount | number }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Amount in Words -->
          <div class="amount-words">
            <span>Amount in words:</span>
            <strong>{{ getAmountInWords(selectedReceipt.amount) }} Only</strong>
          </div>

          <p-divider></p-divider>

          <!-- Footer -->
          <div class="receipt-view-footer">
            <div class="signature">
              <div class="signature-line"></div>
              <span>Authorized Signatory</span>
            </div>
            <div class="stamp">
              <i class="pi pi-verified"></i>
              <span>Digitally Verified</span>
            </div>
          </div>

          <!-- Cancelled Watermark -->
          <div class="cancelled-watermark" *ngIf="selectedReceipt.status === 'CANCELLED'">
            CANCELLED
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Print" icon="pi pi-print" class="p-button-outlined" (click)="printReceipt()" [disabled]="selectedReceipt?.status === 'CANCELLED'"></button>
          <button pButton label="Download PDF" icon="pi pi-download" (click)="downloadReceipt(selectedReceipt)" [disabled]="selectedReceipt?.status === 'CANCELLED'"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .my-receipts { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .filters-card { background: var(--surface-card); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
    .filter-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .filter-item label { font-size: 0.875rem; font-weight: 500; color: var(--text-color-secondary); }
    .filter-actions { margin-left: auto; }

    .receipts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }

    .receipt-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; transition: all 0.2s; }
    .receipt-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .receipt-card.cancelled { opacity: 0.7; }

    .receipt-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .receipt-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: #2563eb; }
    .receipt-info { flex: 1; display: flex; flex-direction: column; }
    .receipt-info strong { font-size: 1rem; }
    .receipt-info span { font-size: 0.75rem; color: var(--text-color-secondary); }

    .receipt-amount { text-align: center; padding: 1rem; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 10px; margin-bottom: 1rem; }
    .receipt-amount .label { display: block; font-size: 0.75rem; color: #16a34a; text-transform: uppercase; margin-bottom: 0.25rem; }
    .receipt-amount .value { font-size: 1.75rem; font-weight: 700; color: #16a34a; }

    .receipt-details { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; padding: 1rem; background: var(--surface-ground); border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; font-size: 0.875rem; }
    .detail-row span:first-child { color: var(--text-color-secondary); }
    .detail-row span:last-child { display: flex; align-items: center; gap: 0.35rem; }
    .detail-row i { color: var(--primary-color); }

    .receipt-actions { display: flex; gap: 0.75rem; }
    .receipt-actions button { flex: 1; }

    .no-receipts { grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--surface-card); border-radius: 12px; color: var(--text-color-secondary); }
    .no-receipts i { font-size: 3rem; margin-bottom: 1rem; display: block; }
    .no-receipts h3 { margin: 0 0 0.5rem; color: var(--text-color); }
    .no-receipts p { margin: 0; }

    .receipt-view { position: relative; padding: 1rem; }

    .receipt-view-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .school-info { display: flex; gap: 1rem; align-items: center; }
    .school-logo { width: 60px; height: 60px; background: var(--primary-color); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .school-info h3 { margin: 0; }
    .school-info p { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--text-color-secondary); }
    .receipt-number { text-align: right; }
    .receipt-number .label { display: block; font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; }
    .receipt-number strong { font-size: 1.25rem; color: var(--primary-color); }

    .receipt-view-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
    .info-column h4 { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--text-color-secondary); text-transform: uppercase; }
    .info-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem; }
    .info-row span { color: var(--text-color-secondary); min-width: 100px; }
    .info-row code { background: var(--surface-ground); padding: 0.15rem 0.35rem; border-radius: 4px; font-size: 0.8rem; }

    .fee-heads-table { margin-bottom: 1rem; }
    .fee-heads-table h4 { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--text-color-secondary); text-transform: uppercase; }
    .fee-heads-table table { width: 100%; border-collapse: collapse; }
    .fee-heads-table th, .fee-heads-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--surface-border); }
    .fee-heads-table th { background: var(--surface-ground); font-weight: 600; font-size: 0.875rem; }
    .fee-heads-table th:last-child, .fee-heads-table td:last-child { text-align: right; }
    .fee-heads-table tfoot td { background: var(--surface-ground); }

    .amount-words { padding: 0.75rem; background: #fef3c7; border-radius: 8px; font-size: 0.875rem; }
    .amount-words span { color: #92400e; }
    .amount-words strong { color: #78350f; }

    .receipt-view-footer { display: flex; justify-content: space-between; align-items: flex-end; }
    .signature { text-align: center; }
    .signature-line { width: 150px; border-bottom: 1px solid var(--text-color); margin-bottom: 0.5rem; }
    .signature span { font-size: 0.75rem; color: var(--text-color-secondary); }
    .stamp { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; color: #16a34a; }
    .stamp i { font-size: 1.5rem; }
    .stamp span { font-size: 0.75rem; }

    .cancelled-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 4rem; font-weight: 700; color: rgba(220, 38, 38, 0.15); pointer-events: none; }

    @media (max-width: 768px) {
      .receipts-grid { grid-template-columns: 1fr; }
      .receipt-view-info { grid-template-columns: 1fr; gap: 1rem; }
      .receipt-view-header { flex-direction: column; gap: 1rem; }
      .receipt-number { text-align: left; }
    }
  `]
})
export class MyReceiptsComponent implements OnInit {
  dateRange: Date[] | null = null;
  selectedYear = '';
  showReceiptDialog = false;
  selectedReceipt: Receipt | null = null;

  yearOptions = [
    { label: '2025-26', value: '2025-26' },
    { label: '2024-25', value: '2024-25' },
    { label: '2023-24', value: '2023-24' }
  ];

  receipts: Receipt[] = [];
  filteredReceipts: Receipt[] = [];

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.loadReceipts();
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.openReceiptById(params['id']);
      }
    });
  }

  loadReceipts(): void {
    this.receipts = [
      {
        id: '1',
        receiptNo: 'RCP-2025-0234',
        date: new Date('2025-07-12'),
        amount: 18000,
        paymentMode: 'Online',
        feeHeads: [
          { name: 'Tuition Fee - Term 2', amount: 12000 },
          { name: 'Lab Fee', amount: 3000 },
          { name: 'Library Fee', amount: 1500 },
          { name: 'Sports Fee', amount: 1500 }
        ],
        academicYear: '2025-26',
        transactionRef: 'TXN789012345',
        status: 'ACTIVE'
      },
      {
        id: '2',
        receiptNo: 'RCP-2025-0089',
        date: new Date('2025-04-10'),
        amount: 18000,
        paymentMode: 'Cash',
        feeHeads: [
          { name: 'Tuition Fee - Term 1', amount: 12000 },
          { name: 'Transport Fee - Q1', amount: 3000 },
          { name: 'Lab Fee', amount: 3000 }
        ],
        academicYear: '2025-26',
        transactionRef: '',
        status: 'ACTIVE'
      },
      {
        id: '3',
        receiptNo: 'RCP-2025-0012',
        date: new Date('2025-01-08'),
        amount: 17500,
        paymentMode: 'UPI',
        feeHeads: [
          { name: 'Tuition Fee - Term 4', amount: 12000 },
          { name: 'Transport Fee - Q4', amount: 3000 },
          { name: 'Sports Fee', amount: 2500 }
        ],
        academicYear: '2024-25',
        transactionRef: 'UPI456789012',
        status: 'ACTIVE'
      },
      {
        id: '4',
        receiptNo: 'RCP-2024-0456',
        date: new Date('2024-10-15'),
        amount: 17000,
        paymentMode: 'Online',
        feeHeads: [
          { name: 'Tuition Fee - Term 3', amount: 12000 },
          { name: 'Transport Fee - Q3', amount: 3000 },
          { name: 'Lab Fee', amount: 2000 }
        ],
        academicYear: '2024-25',
        transactionRef: 'TXN456123789',
        status: 'ACTIVE'
      },
      {
        id: '5',
        receiptNo: 'RCP-2024-0234',
        date: new Date('2024-07-20'),
        amount: 17000,
        paymentMode: 'Cheque',
        feeHeads: [
          { name: 'Tuition Fee - Term 2', amount: 12000 },
          { name: 'Transport Fee - Q2', amount: 3000 },
          { name: 'Library Fee', amount: 2000 }
        ],
        academicYear: '2024-25',
        transactionRef: 'CHQ-123456',
        status: 'ACTIVE'
      },
      {
        id: '6',
        receiptNo: 'RCP-2024-0045',
        date: new Date('2024-04-05'),
        amount: 17000,
        paymentMode: 'Cash',
        feeHeads: [
          { name: 'Tuition Fee - Term 1', amount: 12000 },
          { name: 'Transport Fee - Q1', amount: 3000 },
          { name: 'Admission Fee', amount: 2000 }
        ],
        academicYear: '2024-25',
        transactionRef: '',
        status: 'ACTIVE'
      },
      {
        id: '7',
        receiptNo: 'RCP-2024-0005',
        date: new Date('2024-01-15'),
        amount: 2000,
        paymentMode: 'UPI',
        feeHeads: [
          { name: 'Sports Fee', amount: 2000 }
        ],
        academicYear: '2023-24',
        transactionRef: 'UPI987654321',
        status: 'CANCELLED'
      }
    ];
    this.filteredReceipts = [...this.receipts];
  }

  openReceiptById(receiptNo: string): void {
    const receipt = this.receipts.find(r => r.receiptNo === receiptNo);
    if (receipt) {
      this.viewReceipt(receipt);
    }
  }

  filterReceipts(): void {
    this.filteredReceipts = this.receipts.filter(receipt => {
      const matchYear = !this.selectedYear || receipt.academicYear === this.selectedYear;
      return matchYear;
    });
  }

  clearFilters(): void {
    this.dateRange = null;
    this.selectedYear = '';
    this.filteredReceipts = [...this.receipts];
  }

  getModeIcon(mode: string): string {
    const icons: Record<string, string> = {
      'Online': 'pi pi-globe',
      'Cash': 'pi pi-wallet',
      'Cheque': 'pi pi-file',
      'UPI': 'pi pi-mobile'
    };
    return icons[mode] || 'pi pi-credit-card';
  }

  viewReceipt(receipt: Receipt): void {
    this.selectedReceipt = receipt;
    this.showReceiptDialog = true;
  }

  downloadReceipt(receipt: Receipt | null): void {
    if (receipt) {
      // Download receipt PDF
    }
  }

  downloadAllReceipts(): void {
    // Download all receipts as ZIP
  }

  printReceipt(): void {
    window.print();
  }

  getAmountInWords(amount: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (amount === 0) return 'Zero Rupees';

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    };

    let result = '';
    const lakh = Math.floor(amount / 100000);
    const thousand = Math.floor((amount % 100000) / 1000);
    const remainder = amount % 1000;

    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim() + ' Rupees';
  }
}
