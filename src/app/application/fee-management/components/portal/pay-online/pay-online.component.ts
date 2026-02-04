import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { StepsModule } from 'primeng/steps';
import { MessageModule } from 'primeng/message';

interface PaymentItem {
    id: string;
    name: string;
    dueDate: Date;
    amount: number;
    lateFee: number;
    selected: boolean;
}

interface PaymentGateway {
    id: string;
    name: string;
    icon: string;
    description: string;
    processingFee: number;
}

@Component({
    selector: 'app-pay-online',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CardModule, ButtonModule, InputNumberModule, RadioButtonModule, CheckboxModule, DividerModule, StepsModule, MessageModule],
    template: `
    <div class="pay-online">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-credit-card"></i> Pay Online</h2>
          <p>Secure online payment for fee dues</p>
        </div>
        <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
      </div>

      <!-- Steps -->
      <div class="steps-container">
        <p-steps [model]="paymentSteps" [activeIndex]="currentStep" [readonly]="true"></p-steps>
      </div>

      <!-- Step 1: Select Amount -->
      <div class="step-content" *ngIf="currentStep === 0">
        <div class="content-grid">
          <!-- Pending Dues -->
          <div class="dues-section">
            <div class="section-card">
              <h3><i class="pi pi-list"></i> Select Dues to Pay</h3>

              <div class="due-items">
                <div class="due-item" *ngFor="let item of paymentItems" [class.selected]="item.selected">
                  <p-checkbox [(ngModel)]="item.selected" [binary]="true" (onChange)="calculateTotal()"></p-checkbox>
                  <div class="due-info">
                    <strong>{{ item.name }}</strong>
                    <span class="due-date">Due: {{ item.dueDate | date:'dd MMM yyyy' }}</span>
                  </div>
                  <div class="due-amount">
                    <span class="principal">₹{{ item.amount | number }}</span>
                    <span class="late-fee" *ngIf="item.lateFee > 0">+ ₹{{ item.lateFee }} late fee</span>
                  </div>
                </div>
              </div>

              <p-divider></p-divider>

              <!-- Custom Amount -->
              <div class="custom-amount-section">
                <div class="custom-toggle">
                  <p-checkbox [(ngModel)]="useCustomAmount" [binary]="true" label="Pay custom amount" (onChange)="onCustomAmountToggle()"></p-checkbox>
                </div>
                <div class="custom-input" *ngIf="useCustomAmount">
                  <label>Enter Amount</label>
                  <p-inputNumber [(ngModel)]="customAmount" mode="currency" currency="INR" locale="en-IN"
                                 [min]="100" [max]="totalDue" (onInput)="calculateTotal()"></p-inputNumber>
                  <small>Min: ₹100 | Max: ₹{{ totalDue | number }}</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Summary -->
          <div class="summary-section">
            <div class="section-card summary">
              <h3><i class="pi pi-file-edit"></i> Payment Summary</h3>

              <div class="summary-student">
                <div class="avatar"><i class="pi pi-user"></i></div>
                <div class="info">
                  <strong>{{ studentName }}</strong>
                  <span>{{ className }} | {{ admissionNo }}</span>
                </div>
              </div>

              <p-divider></p-divider>

              <div class="summary-lines">
                <div class="summary-line" *ngFor="let item of getSelectedItems()">
                  <span>{{ item.name }}</span>
                  <span>₹{{ item.amount + item.lateFee | number }}</span>
                </div>
              </div>

              <p-divider></p-divider>

              <div class="summary-totals">
                <div class="total-line">
                  <span>Subtotal</span>
                  <span>₹{{ subtotal | number }}</span>
                </div>
                <div class="total-line" *ngIf="totalLateFee > 0">
                  <span>Late Fee</span>
                  <span class="late">₹{{ totalLateFee | number }}</span>
                </div>
                <div class="total-line convenience" *ngIf="convenienceFee > 0">
                  <span>Convenience Fee</span>
                  <span>₹{{ convenienceFee | number }}</span>
                </div>
                <div class="total-line grand">
                  <span>Total Payable</span>
                  <span>₹{{ grandTotal | number }}</span>
                </div>
              </div>

              <button pButton label="Proceed to Payment" icon="pi pi-arrow-right" iconPos="right"
                      class="p-button-lg w-full" [disabled]="grandTotal === 0" (click)="proceedToPayment()"></button>
            </div>

            <!-- Security Note -->
            <div class="security-note">
              <i class="pi pi-lock"></i>
              <div>
                <strong>Secure Payment</strong>
                <p>Your payment information is encrypted and secure. We use industry-standard SSL encryption.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Payment Method -->
      <div class="step-content" *ngIf="currentStep === 1">
        <div class="content-grid">
          <div class="method-section">
            <div class="section-card">
              <h3><i class="pi pi-wallet"></i> Select Payment Method</h3>

              <div class="payment-methods">
                <div class="method-card" *ngFor="let gateway of paymentGateways"
                     [class.selected]="selectedGateway === gateway.id"
                     (click)="selectGateway(gateway)">
                  <div class="method-radio">
                    <p-radioButton [value]="gateway.id" [(ngModel)]="selectedGateway" (onClick)="calculateTotal()"></p-radioButton>
                  </div>
                  <div class="method-icon">
                    <i [class]="gateway.icon"></i>
                  </div>
                  <div class="method-info">
                    <strong>{{ gateway.name }}</strong>
                    <span>{{ gateway.description }}</span>
                  </div>
                  <div class="method-fee" *ngIf="gateway.processingFee > 0">
                    +{{ gateway.processingFee }}% fee
                  </div>
                </div>
              </div>

              <p-message *ngIf="selectedGateway" severity="info"
                         [text]="'You will be redirected to ' + getSelectedGatewayName() + ' for secure payment.'"></p-message>
            </div>

            <div class="section-card">
              <h3><i class="pi pi-phone"></i> Contact for Receipt</h3>
              <div class="contact-fields">
                <div class="field">
                  <label>Mobile Number</label>
                  <input type="tel" pInputText [(ngModel)]="mobileNumber" placeholder="Enter mobile number" />
                </div>
                <div class="field">
                  <label>Email (Optional)</label>
                  <input type="email" pInputText [(ngModel)]="email" placeholder="Enter email address" />
                </div>
              </div>
              <small>Receipt will be sent to the provided contact details</small>
            </div>
          </div>

          <div class="summary-section">
            <div class="section-card summary">
              <h3><i class="pi pi-file-edit"></i> Payment Summary</h3>

              <div class="summary-totals">
                <div class="total-line">
                  <span>Fee Amount</span>
                  <span>₹{{ subtotal | number }}</span>
                </div>
                <div class="total-line" *ngIf="totalLateFee > 0">
                  <span>Late Fee</span>
                  <span class="late">₹{{ totalLateFee | number }}</span>
                </div>
                <div class="total-line" *ngIf="convenienceFee > 0">
                  <span>Processing Fee</span>
                  <span>₹{{ convenienceFee | number }}</span>
                </div>
                <div class="total-line grand">
                  <span>Total Payable</span>
                  <span>₹{{ grandTotal | number }}</span>
                </div>
              </div>

              <p-divider></p-divider>

              <div class="action-buttons">
                <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-outlined" (click)="currentStep = 0"></button>
                <button pButton label="Pay ₹{{ grandTotal | number }}" icon="pi pi-lock"
                        class="p-button-success" [disabled]="!selectedGateway || !mobileNumber" (click)="initiatePayment()"></button>
              </div>
            </div>

            <!-- Terms -->
            <div class="terms-note">
              <p-checkbox [(ngModel)]="acceptTerms" [binary]="true"></p-checkbox>
              <span>I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Refund Policy</a></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Processing -->
      <div class="step-content" *ngIf="currentStep === 2">
        <div class="processing-section">
          <div class="processing-card">
            <div class="processing-animation">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <h3>Processing Payment</h3>
            <p>Please wait while we process your payment...</p>
            <p class="warning"><i class="pi pi-exclamation-triangle"></i> Do not close this window or press back button</p>
          </div>
        </div>
      </div>

      <!-- Step 4: Confirmation -->
      <div class="step-content" *ngIf="currentStep === 3">
        <div class="confirmation-section">
          <div class="confirmation-card success">
            <div class="status-icon success">
              <i class="pi pi-check"></i>
            </div>
            <h2>Payment Successful!</h2>
            <p class="transaction-id">Transaction ID: <code>TXN{{ transactionId }}</code></p>

            <div class="confirmation-details">
              <div class="detail-row">
                <span>Amount Paid</span>
                <strong>₹{{ grandTotal | number }}</strong>
              </div>
              <div class="detail-row">
                <span>Payment Date</span>
                <span>{{ paymentDate | date:'dd MMM yyyy, hh:mm a' }}</span>
              </div>
              <div class="detail-row">
                <span>Payment Method</span>
                <span>{{ getSelectedGatewayName() }}</span>
              </div>
              <div class="detail-row">
                <span>Receipt Number</span>
                <code>{{ receiptNumber }}</code>
              </div>
            </div>

            <div class="confirmation-actions">
              <button pButton label="Download Receipt" icon="pi pi-download" class="p-button-outlined" (click)="downloadReceipt()"></button>
              <button pButton label="Back to Dashboard" icon="pi pi-home" routerLink="../"></button>
            </div>

            <p class="receipt-note">
              <i class="pi pi-envelope"></i> Receipt has been sent to {{ mobileNumber }} and {{ email || 'registered email' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .pay-online { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }

    .steps-container { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }

    .step-content { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .content-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; }
    .section-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
    .section-card h3 { margin: 0 0 1.25rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; }
    .section-card.summary { position: sticky; top: 1rem; }

    .due-items { display: flex; flex-direction: column; gap: 0.75rem; }
    .due-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface-ground); border-radius: 10px; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
    .due-item:hover { border-color: var(--primary-color); }
    .due-item.selected { border-color: var(--primary-color); background: rgba(59, 130, 246, 0.05); }
    .due-info { flex: 1; display: flex; flex-direction: column; }
    .due-info strong { margin-bottom: 0.25rem; }
    .due-date { font-size: 0.75rem; color: var(--text-color-secondary); }
    .due-amount { text-align: right; }
    .due-amount .principal { font-size: 1.125rem; font-weight: 600; display: block; }
    .due-amount .late-fee { font-size: 0.75rem; color: #dc2626; }

    .custom-amount-section { margin-top: 1rem; }
    .custom-input { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .custom-input label { font-weight: 500; }
    .custom-input small { color: var(--text-color-secondary); }

    .summary-student { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface-ground); border-radius: 10px; }
    .summary-student .avatar { width: 48px; height: 48px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .summary-student .info { display: flex; flex-direction: column; }
    .summary-student .info span { font-size: 0.875rem; color: var(--text-color-secondary); }

    .summary-lines { display: flex; flex-direction: column; gap: 0.5rem; }
    .summary-line { display: flex; justify-content: space-between; font-size: 0.875rem; padding: 0.35rem 0; }

    .summary-totals { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
    .total-line { display: flex; justify-content: space-between; font-size: 0.875rem; }
    .total-line .late { color: #dc2626; }
    .total-line.convenience { color: var(--text-color-secondary); }
    .total-line.grand { font-size: 1.25rem; font-weight: 700; padding-top: 0.75rem; border-top: 2px solid var(--surface-border); margin-top: 0.5rem; }

    .w-full { width: 100%; }

    .security-note { display: flex; gap: 1rem; padding: 1rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; }
    .security-note i { font-size: 1.5rem; color: #16a34a; }
    .security-note strong { display: block; color: #16a34a; margin-bottom: 0.25rem; }
    .security-note p { margin: 0; font-size: 0.875rem; color: #15803d; }

    .payment-methods { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
    .method-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface-ground); border-radius: 10px; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
    .method-card:hover { border-color: var(--primary-color); }
    .method-card.selected { border-color: var(--primary-color); background: rgba(59, 130, 246, 0.05); }
    .method-icon { width: 48px; height: 48px; background: var(--surface-card); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--primary-color); }
    .method-info { flex: 1; display: flex; flex-direction: column; }
    .method-info span { font-size: 0.75rem; color: var(--text-color-secondary); }
    .method-fee { font-size: 0.75rem; color: #f59e0b; font-weight: 500; }

    .contact-fields { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 0.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    .field label { font-weight: 500; font-size: 0.875rem; }
    .field input { width: 100%; }

    .action-buttons { display: flex; gap: 0.75rem; }
    .action-buttons button { flex: 1; }

    .terms-note { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem; background: var(--surface-ground); border-radius: 10px; font-size: 0.875rem; }
    .terms-note a { color: var(--primary-color); }

    .processing-section, .confirmation-section { display: flex; justify-content: center; padding: 3rem 0; }
    .processing-card, .confirmation-card { text-align: center; background: var(--surface-card); border-radius: 16px; padding: 3rem; max-width: 500px; width: 100%; }
    .processing-animation i { font-size: 4rem; color: var(--primary-color); }
    .processing-card h3 { margin: 1.5rem 0 0.5rem; }
    .processing-card .warning { margin-top: 1.5rem; color: #f59e0b; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

    .status-icon { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 2.5rem; }
    .status-icon.success { background: #dcfce7; color: #16a34a; }
    .confirmation-card h2 { margin: 0 0 0.5rem; color: #16a34a; }
    .transaction-id { color: var(--text-color-secondary); margin-bottom: 1.5rem; }
    .transaction-id code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; }

    .confirmation-details { background: var(--surface-ground); border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem; }
    .detail-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--surface-border); }
    .detail-row:last-child { border-bottom: none; }
    .detail-row code { background: var(--surface-card); padding: 0.15rem 0.35rem; border-radius: 4px; font-size: 0.875rem; }

    .confirmation-actions { display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 1.5rem; }
    .receipt-note { font-size: 0.875rem; color: var(--text-color-secondary); display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

    @media (max-width: 768px) {
      .content-grid { grid-template-columns: 1fr; }
      .section-card.summary { position: static; }
      .action-buttons { flex-direction: column; }
    }
  `]
})
export class PayOnlineComponent implements OnInit {
    currentStep = 0;
    paymentSteps = [
        { label: 'Select Amount' },
        { label: 'Payment Method' },
        { label: 'Processing' },
        { label: 'Confirmation' }
    ];

    studentName = 'Rahul Sharma';
    className = 'Class 10-A';
    admissionNo = 'ADM2024001';

    paymentItems: PaymentItem[] = [];
    useCustomAmount = false;
    customAmount = 0;

    subtotal = 0;
    totalLateFee = 0;
    convenienceFee = 0;
    grandTotal = 0;
    totalDue = 0;

    paymentGateways: PaymentGateway[] = [];
    selectedGateway = '';
    mobileNumber = '9876543210';
    email = '';
    acceptTerms = false;

    transactionId = '';
    receiptNumber = '';
    paymentDate = new Date();

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.loadPaymentItems();
        this.loadPaymentGateways();
        this.route.queryParams.subscribe(params => {
            if (params['installment']) {
                this.preselectInstallment(params['installment']);
            }
        });
    }

    loadPaymentItems(): void {
        this.paymentItems = [
            { id: 'INST-3', name: 'Term 3 (Oct-Dec) - Overdue', dueDate: new Date('2025-10-15'), amount: 16000, lateFee: 500, selected: false },
            { id: 'INST-4', name: 'Term 4 (Jan-Mar)', dueDate: new Date('2026-01-15'), amount: 15000, lateFee: 0, selected: false }
        ];
        this.totalDue = this.paymentItems.reduce((sum, item) => sum + item.amount + item.lateFee, 0);
    }

    loadPaymentGateways(): void {
        this.paymentGateways = [
            { id: 'upi', name: 'UPI Payment', icon: 'pi pi-mobile', description: 'Pay using any UPI app', processingFee: 0 },
            { id: 'card', name: 'Debit/Credit Card', icon: 'pi pi-credit-card', description: 'Visa, Mastercard, RuPay', processingFee: 1.5 },
            { id: 'netbanking', name: 'Net Banking', icon: 'pi pi-building', description: 'All major banks supported', processingFee: 0 },
            { id: 'wallet', name: 'Wallets', icon: 'pi pi-wallet', description: 'Paytm, PhonePe, Amazon Pay', processingFee: 0 }
        ];
    }

    preselectInstallment(id: string): void {
        const item = this.paymentItems.find(i => i.id === id);
        if (item) {
            item.selected = true;
            this.calculateTotal();
        }
    }

    calculateTotal(): void {
        if (this.useCustomAmount && this.customAmount > 0) {
            this.subtotal = this.customAmount;
            this.totalLateFee = 0;
        } else {
            const selected = this.getSelectedItems();
            this.subtotal = selected.reduce((sum, item) => sum + item.amount, 0);
            this.totalLateFee = selected.reduce((sum, item) => sum + item.lateFee, 0);
        }

        // Calculate convenience fee based on selected gateway
        const gateway = this.paymentGateways.find(g => g.id === this.selectedGateway);
        if (gateway && gateway.processingFee > 0) {
            this.convenienceFee = Math.round((this.subtotal + this.totalLateFee) * gateway.processingFee / 100);
        } else {
            this.convenienceFee = 0;
        }

        this.grandTotal = this.subtotal + this.totalLateFee + this.convenienceFee;
    }

    getSelectedItems(): PaymentItem[] {
        return this.paymentItems.filter(item => item.selected);
    }

    onCustomAmountToggle(): void {
        if (this.useCustomAmount) {
            this.paymentItems.forEach(item => item.selected = false);
            this.customAmount = this.totalDue;
        }
        this.calculateTotal();
    }

    proceedToPayment(): void {
        this.currentStep = 1;
    }

    selectGateway(gateway: PaymentGateway): void {
        this.selectedGateway = gateway.id;
        this.calculateTotal();
    }

    getSelectedGatewayName(): string {
        const gateway = this.paymentGateways.find(g => g.id === this.selectedGateway);
        return gateway ? gateway.name : '';
    }

    initiatePayment(): void {
        if (!this.acceptTerms) {
            return;
        }
        this.currentStep = 2;

        // Simulate payment processing
        setTimeout(() => {
            this.transactionId = Date.now().toString().slice(-10);
            this.receiptNumber = 'RCP-2026-' + Math.floor(1000 + Math.random() * 9000);
            this.paymentDate = new Date();
            this.currentStep = 3;
        }, 3000);
    }

    downloadReceipt(): void {
        // Download receipt logic
    }
}
